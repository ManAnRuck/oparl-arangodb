import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { MEETING_COLLECTION } from "../utils/collections";
import { ExternalList, Meeting } from "oparl-sdk/dist/types";
import { map } from "p-iteration";
import { importFile } from "./file";
import { importAgendaItem } from "./agendaItems";
import { importLocation } from "./location";
import { saveFileRelation } from "../utils/saveFileRelation";
import { importKeyword } from "./keyword";
import { saveAgendaItemRelation } from "../utils/saveAgendaItemRelation";
import { savePersonRelation } from "../utils/savePersonRelation";
import { alreadyImported } from "../utils/alreadyImported";

export const importMeeting = async (meeting: Meeting) => {
  process.stdout.write("Mee");
  if (alreadyImported(meeting.id)) {
    return meeting.id;
  }

  let meetingsCollection = db.collection(MEETING_COLLECTION);

  const meetingKey = oparlIdToArangoKey(meeting.id);

  const {
    body,
    organization,
    auxiliaryFile,
    agendaItem,
    verbatimProtocol: verbatimProtocolFile,
    location: locationObj,
    participant: participants,
    invitation: invitationObj,
    resultsProtocol: resultsProtocolObj,
    keyword,
    start,
    end,
    created,
    modified,
    ...meetingRest
  } = meeting;

  agendaItem
    ? map(agendaItem, importAgendaItem).then(async (agendaItems) => {
        // AgendaItem edge
        if (agendaItems) {
          map(agendaItems, (id) =>
            saveAgendaItemRelation({
              toKey: oparlIdToArangoKey(id),
              fromId: `${MEETING_COLLECTION}/${meetingKey}`,
            })
          );
        }
        return agendaItems;
      })
    : [];
  auxiliaryFile
    ? map(auxiliaryFile, importFile).then(async (auxiliaryFiles) => {
        if (auxiliaryFiles) {
          map(auxiliaryFiles, (rel) => {
            return saveFileRelation({
              fromId: `${MEETING_COLLECTION}/${meetingKey}`,
              toKey: oparlIdToArangoKey(rel),
              type: "auxiliaryFile",
            });
          });
        }
        return auxiliaryFiles;
      })
    : [];
  verbatimProtocolFile
    ? importFile(verbatimProtocolFile).then(async (verbatimProtocol) => {
        if (verbatimProtocol) {
          saveFileRelation({
            fromId: `${MEETING_COLLECTION}/${meetingKey}`,
            toKey: oparlIdToArangoKey(verbatimProtocol),
            type: "verbatimProtocol",
          });
        }
        return verbatimProtocol;
      })
    : undefined;
  locationObj ? importLocation(locationObj) : undefined;
  invitationObj
    ? importFile(invitationObj).then(async (invitation) => {
        // file edges
        if (invitation) {
          saveFileRelation({
            fromId: `${MEETING_COLLECTION}/${meetingKey}`,
            toKey: oparlIdToArangoKey(invitation),
            type: "invitation",
          });
        }
        return invitation;
      })
    : undefined;
  resultsProtocolObj
    ? importFile(resultsProtocolObj).then(async (resultsProtocol) => {
        if (resultsProtocol) {
          saveFileRelation({
            fromId: `${MEETING_COLLECTION}/${meetingKey}`,
            toKey: oparlIdToArangoKey(resultsProtocol),
            type: "resultsProtocol",
          });
        }
        return resultsProtocol;
      })
    : undefined;

  // Keyword edge
  if (keyword) {
    map(keyword, (k) =>
      importKeyword({
        keyword: k,
        fromId: `${MEETING_COLLECTION}/${meetingKey}`,
      })
    );
  }

  // person edges
  if (participants) {
    map(participants, (p) =>
      savePersonRelation({
        fromId: `${MEETING_COLLECTION}/${meetingKey}`,
        toKey: oparlIdToArangoKey(p),
        type: "participant",
      })
    );
  }

  return meetingsCollection
    .save(
      {
        ...meetingRest,
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
        created: created ? new Date(created) : undefined,
        modified: modified ? new Date(modified) : undefined,
        _key: meetingKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => meeting.id);
};

export const importMeetingEl = async (meetingEl: string): Promise<string[]> => {
  let meetingsList = await oparl.getData<ExternalList<Meeting>>(meetingEl);
  let hasNext = true;
  let pagePromises: Promise<string[]>[] = [];
  do {
    const meetings = map(meetingsList.data, async (meeting) => {
      return importMeeting(meeting);
    });
    pagePromises.push(meetings);
    if (meetingsList?.next) {
      meetingsList = await meetingsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  const pageResults = await Promise.all(pagePromises).then((pageResults) => {
    return pageResults.reduce<string[]>((prev, arr) => {
      return [...prev, ...arr];
    }, []);
  });
  return pageResults;
};
