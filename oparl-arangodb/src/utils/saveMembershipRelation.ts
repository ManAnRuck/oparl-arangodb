import { db } from "../db";
import {
  MEMBERSHIP_EDGE_COLLECTION,
  MEMBERSHIP_COLLECTION,
} from "./collections";

let membershipCollection = db.edgeCollection(MEMBERSHIP_EDGE_COLLECTION);

export const saveMembershipRelation = async ({
  fromId,
  toKey,
  type,
}: {
  fromId: string;
  toKey: string;
  type?: string;
}) => {
  process.stdout.write("#Mem");
  return membershipCollection.save(
    {
      _key: Buffer.from(`${fromId}-${MEMBERSHIP_COLLECTION}/${toKey}`).toString(
        "base64"
      ),
      _from: fromId,
      _to: `${MEMBERSHIP_COLLECTION}/${toKey}`,
      type,
    },
    {
      overwrite: true,
    }
  );
};
