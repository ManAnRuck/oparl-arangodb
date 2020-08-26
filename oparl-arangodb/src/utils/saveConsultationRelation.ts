import { db } from "../db";
import {
  CONSULTATION_EDGE_COLLECTION,
  CONSULTATION_COLLECTION,
} from "./collections";

let consultationsCollection = db.edgeCollection(CONSULTATION_EDGE_COLLECTION);

export const saveConsultationRelation = async ({
  fromId,
  toKey,
}: {
  fromId: string;
  toKey: string;
}) => {
  return consultationsCollection.save(
    {
      _key: Buffer.from(
        `${fromId}-${CONSULTATION_COLLECTION}/${toKey}`
      ).toString("base64"),
      _from: fromId,
      _to: `${CONSULTATION_COLLECTION}/${toKey}`,
    },
    {
      overwrite: true,
    }
  );
};
