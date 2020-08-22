import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { MEETING_COLLECTION } from "../utils/collections";
import { ExternalList, Meeting } from "oparl-sdk/dist/types";
import { mapSeries, map } from "p-iteration";
import { importFile } from "./file";
import { importAgendaItem } from "./agendaItems";
import { importLocation } from "./location";

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
  const organizations = organization ? organization : [];
  const invitation = invitationObj
    ? await importFile(invitationObj)
    : undefined;
  const resultsProtocol = resultsProtocolObj
    ? await importFile(resultsProtocolObj)
    : undefined;

  return meetingsCollection
    .save(
      {
        ...meetingRest,
        verbatimProtocol,
        location,
        organizations,
        auxiliaryFiles,
        agendaItems,
        participants,
        invitation,
        resultsProtocol,
        _key: meetingKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => meeting.id);
};

export const importMeetingEl = async (meetingEl: string): Promise<String[]> => {
  let meetingsList = await oparl.getData<ExternalList<Meeting>>(meetingEl);
  let hasNext = true;
  let meetingIds: string[] = [];
  do {
    const meetings = await mapSeries(meetingsList.data, async (meeting) => {
      return await importMeeting(meeting);
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
