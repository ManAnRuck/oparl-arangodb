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

export const importMeeting = async (meeting: Meeting) => {
  process.stdout.write("Mee");

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

  const agendaItems = agendaItem ? await map(agendaItem, importAgendaItem) : [];
  const auxiliaryFiles = auxiliaryFile
    ? await map(auxiliaryFile, importFile)
    : [];
  const verbatimProtocol = verbatimProtocolFile
    ? await importFile(verbatimProtocolFile)
    : undefined;
  const location = locationObj ? await importLocation(locationObj) : undefined;
  const invitation = invitationObj
    ? await importFile(invitationObj)
    : undefined;
  const resultsProtocol = resultsProtocolObj
    ? await importFile(resultsProtocolObj)
    : undefined;

  // file edges
  if (invitation) {
    await saveFileRelation({
      fromId: `${MEETING_COLLECTION}/${meetingKey}`,
      toKey: oparlIdToArangoKey(invitation),
      type: "invitation",
    });
  }
  if (resultsProtocol) {
    await saveFileRelation({
      fromId: `${MEETING_COLLECTION}/${meetingKey}`,
      toKey: oparlIdToArangoKey(resultsProtocol),
      type: "resultsProtocol",
    });
  }
  if (verbatimProtocol) {
    await saveFileRelation({
      fromId: `${MEETING_COLLECTION}/${meetingKey}`,
      toKey: oparlIdToArangoKey(verbatimProtocol),
      type: "verbatimProtocol",
    });
  }
  if (auxiliaryFiles) {
    await map(auxiliaryFiles, (rel) => {
      return saveFileRelation({
        fromId: `${MEETING_COLLECTION}/${meetingKey}`,
        toKey: oparlIdToArangoKey(rel),
        type: "auxiliaryFile",
      });
    });
  }

  // Keyword edge
  if (keyword) {
    await map(keyword, (k) =>
      importKeyword({
        keyword: k,
        fromId: `${MEETING_COLLECTION}/${meetingKey}`,
      })
    );
  }

  // AgendaItem edge
  if (agendaItems) {
    await map(agendaItems, (id) =>
      saveAgendaItemRelation({
        toKey: oparlIdToArangoKey(id),
        fromId: `${MEETING_COLLECTION}/${meetingKey}`,
      })
    );
  }

  // person edges
  if (participants) {
    await map(
      participants,
      async (p) =>
        await savePersonRelation({
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
        location,
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
  let meetingIds: string[] = [];
  do {
    const meetings = await map(meetingsList.data, async (meeting) => {
      return importMeeting(meeting);
    });
    meetingIds = [...meetingIds, ...meetings];
    if (meetingsList?.next) {
      meetingsList = await meetingsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return meetingIds;
};
