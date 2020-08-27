import { db } from "../db";
import { FILE_EDGE_COLLECTION, FILE_COLLECTION } from "./collections";

let fileCollection = db.edgeCollection(FILE_EDGE_COLLECTION);

export const saveFileRelation = async ({
  fromId,
  toKey,
  type,
}: {
  fromId: string;
  toKey: string;
  type: string;
}) => {
  process.stdout.write("#F");
  return fileCollection.save(
    {
      _key: Buffer.from(`${fromId}-${FILE_COLLECTION}/${toKey}`).toString(
        "base64"
      ),
      _from: fromId,
      _to: `${FILE_COLLECTION}/${toKey}`,
      type,
    },
    {
      overwrite: true,
    }
  );
};
