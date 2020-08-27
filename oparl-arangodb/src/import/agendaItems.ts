import { AgendaItem, ExternalList } from "oparl-sdk/dist/types";
import { AGENDA_ITEM_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { map } from "p-iteration";
import { importFile } from "./file";
import { oparl } from "./oparl";
import { saveFileRelation } from "../utils/saveFileRelation";
import { importKeyword } from "./keyword";
import { saveConsultationRelation } from "../utils/saveConsultationRelation";
import { alreadyImported } from "../utils/alreadyImported";

export const importAgendaItem = async (agendaItem: AgendaItem) => {
  process.stdout.write("A");
  let agendaItemsCollection = db.collection(AGENDA_ITEM_COLLECTION);
  const agendaItemKey = oparlIdToArangoKey(agendaItem.id);
  if (alreadyImported(agendaItem.id)) {
    return agendaItem.id;
  }

  const {
    auxiliaryFile,
    resolutionFile: resolutionFileObj,
    keyword,
    consultation,
    number,
    ...agendaItemRest
  } = agendaItem;

  auxiliaryFile
    ? map(auxiliaryFile, importFile).then(async (auxiliaryFiles) => {
        if (auxiliaryFiles) {
          map(auxiliaryFiles, (rel) => {
            return saveFileRelation({
              fromId: `${AGENDA_ITEM_COLLECTION}/${agendaItemKey}`,
              toKey: oparlIdToArangoKey(rel),
              type: "auxiliaryFile",
            });
          });
        }
        return auxiliaryFiles;
      })
    : [];
  resolutionFileObj
    ? importFile(resolutionFileObj).then(async (resolutionFile) => {
        if (resolutionFile) {
          saveFileRelation({
            fromId: `${AGENDA_ITEM_COLLECTION}/${agendaItemKey}`,
            toKey: oparlIdToArangoKey(resolutionFile),
            type: "resolutionFile",
          });
        }
        return resolutionFile;
      })
    : undefined;

  // Keyword edge
  if (keyword) {
    map(keyword, (k) =>
      importKeyword({
        keyword: k,
        fromId: `${AGENDA_ITEM_COLLECTION}/${agendaItemKey}`,
      })
    );
  }

  // Consultation edge
  if (consultation) {
    saveConsultationRelation({
      fromId: `${AGENDA_ITEM_COLLECTION}/${agendaItemKey}`,
      toKey: oparlIdToArangoKey(consultation),
    });
  }

  return agendaItemsCollection
    .save(
      {
        ...agendaItemRest,
        number: number ? parseFloat(number) : undefined,
        _key: agendaItemKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => agendaItem.id);
};

export const importAgendaItemEl = async (
  agendaItemEl: string
): Promise<string[]> => {
  let agendaItemsList = await oparl.getData<ExternalList<AgendaItem>>(
    agendaItemEl
  );
  let hasNext = true;
  let pagePromises: Promise<string[]>[] = [];
  do {
    const agendaItems = map(agendaItemsList.data, async (agendaItem) => {
      return importAgendaItem(agendaItem);
    });
    pagePromises.push(agendaItems);
    if (agendaItemsList?.next) {
      agendaItemsList = await agendaItemsList.next();
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
