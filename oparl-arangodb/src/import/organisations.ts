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
import { alreadyImported } from "../utils/alreadyImported";

export const importOrganization = async (organization: Organization) => {
  process.stdout.write("O");
  if (alreadyImported(organization.id)) {
    return organization.id;
  }
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

  meeting
    ? importMeetingEl(meeting).then(async (meetings) => {
        // Meetings edge
        if (meetings) {
          map(meetings, (id) =>
            saveMeetingRelation({
              toKey: oparlIdToArangoKey(id),
              fromId: `${ORGANISATION_COLLECTION}/${organizationKey}`,
            })
          );
        }
        return meetings;
      })
    : [];

  consultation ? importConsultationEl(consultation) : [];
  locationObj ? importLocation(locationObj) : undefined;

  // Keyword edge
  if (keyword) {
    map(keyword, (k) =>
      importKeyword({
        keyword: k,
        fromId: `${ORGANISATION_COLLECTION}/${organizationKey}`,
      })
    );
  }

  const result = await organizationsCollection
    .save(
      {
        ...organizationRest,
        _key: organizationKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => organization.id);

  if (body) {
    saveOrganisationRelation({
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
  let pagePromises: Promise<string[]>[] = [];
  do {
    const organizations = map(organizationsList.data, async (organization) => {
      return importOrganization(organization);
    });
    pagePromises.push(organizations);
    if (organizationsList?.next) {
      organizationsList = await organizationsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  console.log("\n\n Start await all organization pages");
  const pageResults = await Promise.all(pagePromises).then((pageResults) => {
    return pageResults.reduce<string[]>((prev, arr) => {
      return [...prev, ...arr];
    }, []);
  });
  console.log("\n\n Finish await all organization pages");
  return pageResults;
};
