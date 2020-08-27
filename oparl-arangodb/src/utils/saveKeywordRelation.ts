import { db } from "../db";
import { KEYWORD_EDGE_COLLECTION, KEYWORD_COLLECTION } from "./collections";

let keywordCollection = db.edgeCollection(KEYWORD_EDGE_COLLECTION);

export const saveKeywordRelation = async ({
  fromId,
  toKey,
}: {
  fromId: string;
  toKey: string;
}) => {
  process.stdout.write("#K");
  return keywordCollection.save(
    {
      _key: Buffer.from(`${fromId}-${KEYWORD_COLLECTION}/${toKey}`).toString(
        "base64"
      ),
      _from: fromId,
      _to: `${KEYWORD_COLLECTION}/${toKey}`,
    },
    {
      overwrite: true,
    }
  );
};
