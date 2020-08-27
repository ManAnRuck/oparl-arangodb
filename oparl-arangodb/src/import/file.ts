import { File, ExternalList } from "oparl-sdk/dist/types";
import { FILE_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { oparl } from "./oparl";
import { map } from "p-iteration";
import { saveFileRelation } from "../utils/saveFileRelation";
import { importKeyword } from "./keyword";
import { alreadyImported } from "../utils/alreadyImported";

export const importFile = async (file: File) => {
  process.stdout.write("F");
  if (alreadyImported(file.id)) {
    return file.id;
  }
  let filesCollection = db.collection(FILE_COLLECTION);

  const fileKey = oparlIdToArangoKey(file.id);

  const {
    derivativeFile: derivativeFiles,
    meeting: meetings,
    agendaItem: agendaItems,
    paper: papers,
    masterFile,
    derivativeFile,
    keyword,
    ...fileRest
  } = file;

  // file edges
  if (masterFile) {
    saveFileRelation({
      fromId: `${FILE_COLLECTION}/${fileKey}`,
      toKey: oparlIdToArangoKey(masterFile),
      type: "masterFile",
    });
  }
  if (derivativeFile) {
    map(derivativeFile, (rel) => {
      return saveFileRelation({
        fromId: `${FILE_COLLECTION}/${fileKey}`,
        toKey: oparlIdToArangoKey(rel),
        type: "derivativeFile",
      });
    });
  }

  // Keyword edge
  if (keyword) {
    map(keyword, (k) =>
      importKeyword({ keyword: k, fromId: `${FILE_COLLECTION}/${fileKey}` })
    );
  }

  return filesCollection
    .save(
      {
        ...fileRest,
        _key: fileKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => file.id);
};

export const importFileEl = async (fileEl: string): Promise<string[]> => {
  let filesList = await oparl.getData<ExternalList<File>>(fileEl);
  let hasNext = true;
  let pagePromises: Promise<string[]>[] = [];
  do {
    const files = map(filesList.data, async (file) => {
      return importFile(file);
    });
    pagePromises.push(files);
    if (filesList?.next) {
      filesList = await filesList.next();
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
