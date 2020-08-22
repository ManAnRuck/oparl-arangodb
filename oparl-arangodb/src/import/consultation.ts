import { Consultation, ExternalList } from "oparl-sdk/dist/types";
import { CONSULTATION_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { oparl } from "./oparl";
import { mapSeries } from "p-iteration";

export const importConsultation = async (consultation: Consultation) => {
  process.stdout.write("C");
  let consultationsCollection = db.collection(CONSULTATION_COLLECTION);

  const consultationKey = oparlIdToArangoKey(consultation.id);

  const { organization: organizations, ...consultationRest } = consultation;

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
): Promise<String[]> => {
  let consultationsList = await oparl.getData<ExternalList<Consultation>>(
    consultationEl
  );
  let hasNext = true;
  let consultationIds: string[] = [];
  do {
    const consultations = await mapSeries(
      consultationsList.data,
      async (consultation) => {
        return await importConsultation(consultation);
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
