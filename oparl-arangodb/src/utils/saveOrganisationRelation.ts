import { db } from "../db";
import {
  ORGANISATION_EDGE_COLLECTION,
  ORGANISATION_COLLECTION,
} from "./collections";

let organisationsCollection = db.edgeCollection(ORGANISATION_EDGE_COLLECTION);

export const saveOrganisationRelation = async ({
  fromId,
  toKey,
}: {
  fromId: string;
  toKey: string;
}) => {
  return organisationsCollection
    .save(
      {
        _key: Buffer.from(
          `${fromId}-${ORGANISATION_COLLECTION}/${toKey}`
        ).toString("base64"),
        _from: fromId,
        _to: `${ORGANISATION_COLLECTION}/${toKey}`,
      },
      {
        overwrite: true,
      }
    )
    .catch((e) => {
      console.log("\nERROR OrganisationEdge->save ", e);
      return `ERROR: ${toKey}`;
    });
};
