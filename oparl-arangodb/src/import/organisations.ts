import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { ORGANISATION_COLLECTION } from "../utils/collections";
import { ExternalList, Organization } from "oparl-sdk/dist/types";
import { mapSeries } from "p-iteration";
import { importMeetingEl } from "./meetings";
import { importConsultationEl } from "./consultation";
import { importLocation } from "./location";

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
    ...organizationRest
  } = organization;

  const meetings = meeting ? await importMeetingEl(meeting) : [];
  const memberships = membership;
  const consultations = consultation
    ? await importConsultationEl(consultation)
    : [];
  const location = locationObj ? await importLocation(locationObj) : undefined;

  return organizationsCollection
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
};

export const importOrganizationEl = async (
  organizationEl: string
): Promise<String[]> => {
  let organizationsList = await oparl.getData<ExternalList<Organization>>(
    organizationEl
  );
  let hasNext = true;
  let organizationIds: string[] = [];
  do {
    const organizations = await mapSeries(
      organizationsList.data,
      async (organization) => {
        return await importOrganization(organization);
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
