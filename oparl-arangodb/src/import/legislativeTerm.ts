import { LegislativeTerm, ExternalList } from "oparl-sdk/dist/types";
import { LEGISLATIVE_TERM_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { oparl } from "./oparl";
import { map } from "p-iteration";
import { importKeyword } from "./keyword";
import { alreadyImported } from "../utils/alreadyImported";

export const importLegislativeTerm = async (
  legislativeTerm: LegislativeTerm
) => {
  process.stdout.write("Leg");
  if (alreadyImported(legislativeTerm.id)) {
    return legislativeTerm.id;
  }
  let legislativeTermsCollection = db.collection(LEGISLATIVE_TERM_COLLECTION);

  const legislativeTermKey = oparlIdToArangoKey(legislativeTerm.id);

  const { keyword, ...legislativeTermRest } = legislativeTerm;

  // Keyword edge
  if (keyword) {
    map(keyword, (k) =>
      importKeyword({
        keyword: k,
        fromId: `${LEGISLATIVE_TERM_COLLECTION}/${legislativeTermKey}`,
      })
    );
  }

  return legislativeTermsCollection
    .save(
      {
        ...legislativeTermRest,
        _key: legislativeTermKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => legislativeTerm.id);
};

export const importLegislativeTermEl = async (
  legislativeTermEl: string
): Promise<string[]> => {
  let legislativeTermsList = await oparl.getData<ExternalList<LegislativeTerm>>(
    legislativeTermEl
  );
  let hasNext = true;
  let legislativeTermIds: string[] = [];
  do {
    const legislativeTerms = await map(
      legislativeTermsList.data,
      async (legislativeTerm) => {
        return importLegislativeTerm(legislativeTerm);
      }
    );
    legislativeTermIds = [...legislativeTermIds, ...legislativeTerms];
    if (legislativeTermsList?.next) {
      legislativeTermsList = await legislativeTermsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return legislativeTermIds;
};
