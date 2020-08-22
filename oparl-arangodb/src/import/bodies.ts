import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { BODY_COLLECTION } from "../utils/collections";
import { ExternalList, Body } from "oparl-sdk/dist/types";
import { mapSeries, map } from "p-iteration";
import { importOrganizationEl } from "./organisations";
import { importPersonEl } from "./persons";
import { importMeetingEl } from "./meetings";
import { importPaperEl } from "./papers";
import { importLegislativeTerm } from "./legislativeTerm";
import { importAgendaItemEl } from "./agendaItems";
import { importConsultationEl } from "./consultation";
import { importFileEl } from "./file";
import { importLocationEl, importLocation } from "./location";
import { importMembershipEl } from "./membership";

export const importBodyEl = async (bodiesEl: string): Promise<String[]> => {
  let bodiesList = await oparl.getData<ExternalList<Body>>(bodiesEl);
  let bodiesCollection = db.collection(BODY_COLLECTION);
  let hasNext = true;
  let bodyIds: string[] = [];
  do {
    const bodies = await mapSeries(bodiesList.data, async (body) => {
      process.stdout.write("B");

      const bodyKey = oparlIdToArangoKey(body.id);

      const {
        system,
        equivalent,
        organization,
        person,
        meeting,
        paper,
        legislativeTerm,
        agendaItem,
        consultation,
        file,
        locationList,
        legislativeTermList,
        membership,
        location: locationObj,
        ...bodyRest
      } = body;

      const organisations = await importOrganizationEl(
        organization
      ).catch((e) => console.log("ERROR Body->Organization ", e));
      const persons = await importPersonEl(person).catch((e) =>
        console.log("ERROR Body->Person ", e)
      );
      const meetings = await importMeetingEl(meeting).catch((e) =>
        console.log("ERROR Body->Meeting ", e)
      );
      const papers = await importPaperEl(paper).catch((e) =>
        console.log("ERROR Body->Paper ", e)
      );
      const legislativeTerms = legislativeTerm
        ? await map(legislativeTerm, importLegislativeTerm).catch((e) =>
            console.log("ERROR Body->LegislativeTerm ", e)
          )
        : [];
      const agendaItems = agendaItem
        ? await importAgendaItemEl(agendaItem).catch((e) =>
            console.log("ERROR Body->AgendaItem ", e)
          )
        : [];
      const consultations = consultation
        ? await importConsultationEl(consultation).catch((e) =>
            console.log("ERROR Body->Consultation ", e)
          )
        : [];
      const files = file
        ? await importFileEl(file).catch((e) =>
            console.log("ERROR Body->File ", e)
          )
        : [];
      const locations = locationList
        ? await importLocationEl(locationList).catch((e) =>
            console.log("ERROR Body->Location ", e)
          )
        : [];
      // dublicate https://dev.oparl.org/spezifikation/1.1#entity-body
      // const legislativeTerms = legislativeTermList ? await importLegislativeTermEl(legislativeTermList) : [];
      const memberships = membership
        ? await importMembershipEl(membership).catch((e) =>
            console.log("ERROR Body->Membership ", e)
          )
        : [];
      const location = locationObj
        ? await importLocation(locationObj).catch((e) =>
            console.log("ERROR Body->Location ", e)
          )
        : undefined;

      const equivalentCleaned = equivalent?.filter((e) => !!e);

      return bodiesCollection
        .save(
          {
            ...bodyRest,
            organisations,
            persons,
            meetings,
            papers,
            legislativeTerms,
            agendaItems,
            consultations,
            files,
            locations,
            memberships,
            location,
            equivalent: equivalentCleaned,
            _key: bodyKey,
          },
          {
            overwrite: true,
          }
        )
        .then(() => body.id);
    });
    bodyIds = [...bodyIds, ...bodies];
    if (bodiesList?.next) {
      bodiesList = await bodiesList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return bodyIds;
};
