import { db } from "../db";
import {
  AGENDA_ITEM_EDGE_COLLECTION,
  AGENDA_ITEM_COLLECTION,
} from "./collections";

let agendaItemCollection = db.edgeCollection(AGENDA_ITEM_EDGE_COLLECTION);

export const saveAgendaItemRelation = async ({
  fromId,
  toKey,
}: {
  fromId: string;
  toKey: string;
}) => {
  return agendaItemCollection.save(
    {
      _key: Buffer.from(
        `${fromId}-${AGENDA_ITEM_COLLECTION}/${toKey}`
      ).toString("base64"),
      _from: fromId,
      _to: `${AGENDA_ITEM_COLLECTION}/${toKey}`,
    },
    {
      overwrite: true,
    }
  );
};
