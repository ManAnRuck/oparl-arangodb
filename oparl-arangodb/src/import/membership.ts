import { Membership, ExternalList } from "oparl-sdk/dist/types";
import {
  MEMBERSHIP_COLLECTION,
  ORGANISATION_COLLECTION,
} from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { oparl } from "./oparl";
import { map } from "p-iteration";
import { importKeyword } from "./keyword";
import { saveMembershipRelation } from "../utils/saveMembershipRelation";
import { savePersonRelation } from "../utils/savePersonRelation";

export const importMembership = async (membership: Membership) => {
  process.stdout.write("Mem");
  let membershipsCollection = db.collection(MEMBERSHIP_COLLECTION);

  const membershipKey = oparlIdToArangoKey(membership.id);

  const {
    keyword,
    onBehalfOf,
    organization,
    person,
    ...membershipRest
  } = membership;

  // membership edges
  if (organization) {
    await saveMembershipRelation({
      fromId: `${ORGANISATION_COLLECTION}/${oparlIdToArangoKey(organization)}`,
      toKey: membershipKey,
    });
  }
  if (onBehalfOf) {
    await saveMembershipRelation({
      fromId: `${ORGANISATION_COLLECTION}/${oparlIdToArangoKey(onBehalfOf)}`,
      toKey: membershipKey,
      type: "onBehalfOf",
    });
  }

  // person edges
  if (person) {
    await savePersonRelation({
      fromId: `${MEMBERSHIP_COLLECTION}/${membershipKey}`,
      toKey: oparlIdToArangoKey(person),
    });
  }

  // Keyword edge
  if (keyword) {
    await map(keyword, (k) =>
      importKeyword({
        keyword: k,
        fromId: `${MEMBERSHIP_COLLECTION}/${membershipKey}`,
      })
    );
  }

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
): Promise<string[]> => {
  let MembershipsList = await oparl.getData<ExternalList<Membership>>(
    MembershipEl
  );
  let hasNext = true;
  let MembershipIds: string[] = [];
  do {
    const Memberships = await map(MembershipsList.data, async (Membership) => {
      return importMembership(Membership);
    });
    MembershipIds = [...MembershipIds, ...Memberships];
    if (MembershipsList?.next) {
      MembershipsList = await MembershipsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return MembershipIds;
};
