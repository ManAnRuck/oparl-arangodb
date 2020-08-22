import { LegislativeTerm, ExternalList } from "oparl-sdk/dist/types";
import { LEGISLATIVE_TERM_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { oparl } from "./oparl";
import { mapSeries } from "p-iteration";

export const importLegislativeTerm = async (
  legislativeTerm: LegislativeTerm
) => {
  process.stdout.write("Leg");
  let legislativeTermsCollection = db.collection(LEGISLATIVE_TERM_COLLECTION);

  const legislativeTermKey = oparlIdToArangoKey(legislativeTerm.id);

  const { ...legislativeTermRest } = legislativeTerm;

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
): Promise<String[]> => {
  let legislativeTermsList = await oparl.getData<ExternalList<LegislativeTerm>>(
    legislativeTermEl
  );
  let hasNext = true;
  let legislativeTermIds: string[] = [];
  do {
    const legislativeTerms = await mapSeries(
      legislativeTermsList.data,
      async (legislativeTerm) => {
        return await importLegislativeTerm(legislativeTerm);
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
