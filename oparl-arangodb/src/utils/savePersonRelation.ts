import { db } from "../db";
import { PERSON_EDGE_COLLECTION, PERSON_COLLECTION } from "./collections";

let personsCollection = db.edgeCollection(PERSON_EDGE_COLLECTION);

export const savePersonRelation = async ({
  fromId,
  toKey,
  type,
}: {
  fromId: string;
  toKey: string;
  type?: string;
}) => {
  process.stdout.write("#Pe");
  return personsCollection
    .save(
      {
        _key: Buffer.from(`${fromId}-${PERSON_COLLECTION}/${toKey}`).toString(
          "base64"
        ),
        _from: fromId,
        _to: `${PERSON_COLLECTION}/${toKey}`,
        type,
      },
      {
        overwrite: true,
      }
    )
    .catch((e) => {
      console.log("\nERROR PersonEdge->save ", toKey);
      return `ERROR: ${toKey}`;
    });
};
