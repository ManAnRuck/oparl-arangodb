import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { BODY_COLLECTION } from "../utils/collections";
import { ExternalList, Body } from "oparl-sdk/dist/types";
import { map } from "p-iteration";
import { importOrganizationEl } from "./organisations";
import { importPersonEl } from "./persons";
import { importMeetingEl } from "./meetings";
import { importPaperEl } from "./papers";
import { importLegislativeTerm } from "./legislativeTerm";
import { importAgendaItemEl } from "./agendaItems";
import { importFileEl } from "./file";
import { importLocationEl, importLocation } from "./location";
import { importMembershipEl } from "./membership";
import { importKeyword } from "./keyword";

export const importBodyEl = async (bodiesEl: string): Promise<string[]> => {
  let bodiesList = await oparl.getData<ExternalList<Body>>(bodiesEl);
  let bodiesCollection = db.collection(BODY_COLLECTION);
  let hasNext = true;
  let bodyIds: string[] = [];
  do {
    const bodies = await map(bodiesList.data, async (body) => {
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
        keyword,
        ...bodyRest
      } = body;

      const result = await bodiesCollection
        .save(
          {
            ...bodyRest,
            _key: bodyKey,
          },
          {
            overwrite: true,
          }
        )
        .then(() => body.id);

      console.log("\nImport Organisations");
      await importOrganizationEl(organization).catch((e) =>
        console.log("ERROR Body->Organization ", e)
      );
      console.log("\nImport Persons");
      await importPersonEl(person).catch((e) =>
        console.log("ERROR Body->Person ", e)
      );
      console.log("\nImport Meetings");
      await importMeetingEl(meeting).catch((e) =>
        console.log("ERROR Body->Meeting ", e)
      );
      console.log("\nImport Papers");
      await importPaperEl(paper).catch((e) =>
        console.log("\nERROR Body->Paper ", e)
      );
      console.log("\nImport LegislativeTerms");
      legislativeTerm
        ? await map(legislativeTerm, importLegislativeTerm).catch((e) =>
            console.log("\nERROR Body->LegislativeTerm ", e)
          )
        : [];
      console.log("\nImport AgendaItems");
      agendaItem
        ? await importAgendaItemEl(agendaItem).catch((e) =>
            console.log("\nERROR Body->AgendaItem ", e)
          )
        : [];
      // const consultations = consultation
      //   ? await importConsultationEl(consultation).catch((e) =>
      //       console.log("ERROR Body->Consultation ", e)
      //     )
      //   : [];
      console.log("\nImport Files");
      file
        ? await importFileEl(file).catch((e) =>
            console.log("\nERROR Body->File ", e)
          )
        : [];
      console.log("\nImport LocationList");
      locationList
        ? await importLocationEl(locationList).catch((e) =>
            console.log("\nERROR Body->Location ", e)
          )
        : [];
      // dublicate https://dev.oparl.org/spezifikation/1.1#entity-body
      // const legislativeTerms = legislativeTermList ? await importLegislativeTermEl(legislativeTermList) : [];
      console.log("\nImport Memberships");
      membership
        ? await importMembershipEl(membership).catch((e) =>
            console.log("\nERROR Body->Membership ", e)
          )
        : [];
      console.log("\nImport LocationObj");
      locationObj
        ? await importLocation(locationObj).catch((e) =>
            console.log("\nERROR Body->Location ", e)
          )
        : undefined;

      equivalent?.filter((e) => !!e);

      // Keyword edge
      if (keyword) {
        await map(keyword, (k) =>
          importKeyword({ keyword: k, fromId: `${BODY_COLLECTION}/${bodyKey}` })
        );
      }

      return result;
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
