import { Consultation, ExternalList } from "oparl-sdk/dist/types";
import { CONSULTATION_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { oparl } from "./oparl";
import { map } from "p-iteration";
import { importKeyword } from "./keyword";
import { savePaperRelation } from "../utils/savePaperRelation";

const consultationsCollection = db.collection(CONSULTATION_COLLECTION);

export const importConsultation = async (consultation: Consultation) => {
  process.stdout.write("C");

  const consultationKey = oparlIdToArangoKey(consultation.id);

  const {
    keyword,
    organization: organizations,
    paper,
    ...consultationRest
  } = consultation;

  // Keyword edge
  if (keyword) {
    await map(keyword, (k) =>
      importKeyword({
        keyword: k,
        fromId: `${CONSULTATION_COLLECTION}/${consultationKey}`,
      }).catch((e) => console.log("\nERROR Consultation->keyword ", e, keyword))
    );
  }

  // Paper edge
  if (paper) {
    await savePaperRelation({
      fromId: `${CONSULTATION_COLLECTION}/${consultationKey}`,
      toKey: oparlIdToArangoKey(paper),
    }).catch((e) => console.log("\nERROR Consultation->paper ", e, paper));
  }

  return await consultationsCollection
    .save(
      {
        ...consultationRest,
        organizations,
        _key: consultationKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => consultation.id)
    .catch((e) => {
      console.log("\nERROR Consultation->save ", consultation);
      return `ERROR: ${consultation.id}`;
    });
};

export const importConsultationEl = async (
  consultationEl: string
): Promise<string[]> => {
  let consultationsList = await oparl.getData<ExternalList<Consultation>>(
    consultationEl
  );
  let hasNext = true;
  let consultationIds: string[] = [];
  do {
    const consultations = await map(
      consultationsList.data,
      async (consultation) => {
        return importConsultation(consultation);
      }
    );
    consultationIds = [...consultationIds, ...consultations];
    if (consultationsList?.next) {
      consultationsList = await consultationsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return consultationIds;
};
