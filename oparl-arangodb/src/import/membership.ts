import { Membership, ExternalList } from "oparl-sdk/dist/types";
import { MEMBERSHIP_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { oparl } from "./oparl";
import { mapSeries } from "p-iteration";

export const importMembership = async (membership: Membership) => {
  process.stdout.write("Mem");
  let membershipsCollection = db.collection(MEMBERSHIP_COLLECTION);

  const membershipKey = oparlIdToArangoKey(membership.id);

  const { ...membershipRest } = membership;

  return membershipsCollection
    .save(
      {
        ...membershipRest,
        _key: membershipKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => membership.id);
};

export const importMembershipEl = async (
  MembershipEl: string
): Promise<String[]> => {
  let MembershipsList = await oparl.getData<ExternalList<Membership>>(
    MembershipEl
  );
  let hasNext = true;
  let MembershipIds: string[] = [];
  do {
    const Memberships = await mapSeries(
      MembershipsList.data,
      async (Membership) => {
        return await importMembership(Membership);
      }
    );
    MembershipIds = [...MembershipIds, ...Memberships];
    if (MembershipsList?.next) {
      MembershipsList = await MembershipsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return MembershipIds;
};
