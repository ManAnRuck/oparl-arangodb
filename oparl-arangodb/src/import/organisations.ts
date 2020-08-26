import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { ORGANISATION_COLLECTION, BODY_COLLECTION } from "../utils/collections";
import { ExternalList, Organization } from "oparl-sdk/dist/types";
import { map } from "p-iteration";
import { importMeetingEl } from "./meetings";
import { importConsultationEl } from "./consultation";
import { importLocation } from "./location";
import { importKeyword } from "./keyword";
import { saveMeetingRelation } from "../utils/saveMeetingRelation";
import { saveOrganisationRelation } from "../utils/saveOrganisationRelation";

export const importOrganization = async (organization: Organization) => {
  process.stdout.write("O");
  let organizationsCollection = db.collection(ORGANISATION_COLLECTION);

  const organizationKey = oparlIdToArangoKey(organization.id);
  const {
    body,
    meeting,
    membership,
    consultation,
    location: locationObj,
    keyword,
    ...organizationRest
  } = organization;

  const meetings = meeting ? await importMeetingEl(meeting) : [];
  const memberships = membership;
  const consultations = consultation
    ? await importConsultationEl(consultation)
    : [];
  const location = locationObj ? await importLocation(locationObj) : undefined;

  // Keyword edge
  if (keyword) {
    await map(keyword, (k) =>
      importKeyword({
        keyword: k,
        fromId: `${ORGANISATION_COLLECTION}/${organizationKey}`,
      })
    );
  }

  // Meetings edge
  if (meetings) {
    await map(meetings, (id) =>
      saveMeetingRelation({
        toKey: oparlIdToArangoKey(id),
        fromId: `${ORGANISATION_COLLECTION}/${organizationKey}`,
      })
    );
  }

  const result = await organizationsCollection
    .save(
      {
        ...organizationRest,
        meetings,
        memberships,
        consultations,
        location,
        _key: organizationKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => organization.id);

  if (body) {
    await saveOrganisationRelation({
      fromId: `${BODY_COLLECTION}/${oparlIdToArangoKey(body)}`,
      toKey: `${organizationKey}`,
    });
  }

  return result;
};

export const importOrganizationEl = async (
  organizationEl: string
): Promise<string[]> => {
  let organizationsList = await oparl.getData<ExternalList<Organization>>(
    organizationEl
  );
  let hasNext = true;
  let organizationIds: string[] = [];
  do {
    const organizations = await map(
      organizationsList.data,
      async (organization) => {
        return importOrganization(organization);
      }
    );
    organizationIds = [...organizationIds, ...organizations];
    if (organizationsList?.next) {
      organizationsList = await organizationsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return organizationIds;
};
