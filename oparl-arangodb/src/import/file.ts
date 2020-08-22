import { File, ExternalList } from "oparl-sdk/dist/types";
import { FILE_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { oparl } from "./oparl";
import { mapSeries } from "p-iteration";

export const importFile = async (file: File) => {
  process.stdout.write("F");
  let filesCollection = db.collection(FILE_COLLECTION);

  const fileKey = oparlIdToArangoKey(file.id);

  const {
    derivativeFile: derivativeFiles,
    meeting: meetings,
    agendaItem: agendaItems,
    paper: papers,
    ...fileRest
  } = file;

  return filesCollection
    .save(
      {
        ...fileRest,
        derivativeFiles,
        meetings,
        agendaItems,
        papers,
        _key: fileKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => file.id);
};

export const importFileEl = async (fileEl: string): Promise<String[]> => {
  let filesList = await oparl.getData<ExternalList<File>>(fileEl);
  let hasNext = true;
  let fileIds: string[] = [];
  do {
    const files = await mapSeries(filesList.data, async (file) => {
      return await importFile(file);
    });
    fileIds = [...fileIds, ...files];
    if (filesList?.next) {
      filesList = await filesList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return fileIds;
};
