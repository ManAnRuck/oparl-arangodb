import { db } from "../db";
import { MEETING_EDGE_COLLECTION, MEETING_COLLECTION } from "./collections";

let meetingsCollection = db.edgeCollection(MEETING_EDGE_COLLECTION);

export const saveMeetingRelation = async ({
  fromId,
  toKey,
}: {
  fromId: string;
  toKey: string;
}) => {
  process.stdout.write("#Mee");
  return meetingsCollection.save(
    {
      _key: Buffer.from(`${fromId}-${MEETING_COLLECTION}/${toKey}`).toString(
        "base64"
      ),
      _from: fromId,
      _to: `${MEETING_COLLECTION}/${toKey}`,
    },
    {
      overwrite: true,
    }
  );
};
