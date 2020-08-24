import { Consultation, ExternalList } from "oparl-sdk/dist/types";
import {
  CONSULTATION_EDGE_COLLECTION,
  AGENA_ITEM_COLLECTION,
  PAPER_COLLECTION,
} from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { oparl } from "./oparl";
import { mapSeries } from "p-iteration";

// const consultationsCollection = db.collection(CONSULTATION_COLLECTION);
const consultationsCollection = db.edgeCollection(CONSULTATION_EDGE_COLLECTION);

export const importConsultation = async (consultation: Consultation) => {
  process.stdout.write("C");

  const consultationKey = oparlIdToArangoKey(consultation.id);

  const {
    organization: organizations,
    agendaItem,
    paper,
    ...consultationRest
  } = consultation;

  if (agendaItem && paper) {
    const agendaItemKey = oparlIdToArangoKey(agendaItem);
    const paperKey = oparlIdToArangoKey(agendaItem);
    const ageendaItemId = `${AGENA_ITEM_COLLECTION}/${agendaItemKey}`;
    const paperId = `${PAPER_COLLECTION}/${paperKey}`;

    return await consultationsCollection
      .save(
        {
          ...consultationRest,
          _from: ageendaItemId,
          _to: paperId,
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
  } else {
    console.log(`missing relations for ${consultation.id}`);
    return consultation.id;
  }
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
