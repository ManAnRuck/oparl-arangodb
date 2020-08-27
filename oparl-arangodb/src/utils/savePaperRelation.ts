import { db } from "../db";
import { PAPER_EDGE_COLLECTION, PAPER_COLLECTION } from "./collections";

let papersCollection = db.edgeCollection(PAPER_EDGE_COLLECTION);

export const savePaperRelation = async ({
  fromId,
  toKey,
}: {
  fromId: string;
  toKey: string;
}) => {
  process.stdout.write("#Pa");
  return papersCollection
    .save(
      {
        _key: Buffer.from(`${fromId}-${PAPER_COLLECTION}/${toKey}`).toString(
          "base64"
        ),
        _from: fromId,
        _to: `${PAPER_COLLECTION}/${toKey}`,
      },
      {
        overwrite: true,
      }
    )
    .catch((e) => {
      console.log("\nERROR PaperEdge->save ", toKey);
      return `ERROR: ${toKey}`;
    });
};
