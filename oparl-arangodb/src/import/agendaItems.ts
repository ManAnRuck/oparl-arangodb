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

export const importAgendaItem = async (agendaItem: AgendaItem) => {
  process.stdout.write("A");
  let agendaItemsCollection = db.collection(AGENDA_ITEM_COLLECTION);

  const agendaItemKey = oparlIdToArangoKey(agendaItem.id);

  const {
    auxiliaryFile,
    resolutionFile: resolutionFileObj,
    keyword,
    consultation,
    number,
    ...agendaItemRest
  } = agendaItem;

  const auxiliaryFiles = auxiliaryFile
    ? await map(auxiliaryFile, importFile)
    : [];
  const resolutionFile = resolutionFileObj
    ? await importFile(resolutionFileObj)
    : undefined;

  // file edges
  if (resolutionFile) {
    await saveFileRelation({
      fromId: `${AGENDA_ITEM_COLLECTION}/${agendaItemKey}`,
      toKey: oparlIdToArangoKey(resolutionFile),
      type: "resolutionFile",
    });
  }
  if (auxiliaryFiles) {
    await map(auxiliaryFiles, (rel) => {
      return saveFileRelation({
        fromId: `${AGENDA_ITEM_COLLECTION}/${agendaItemKey}`,
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
        fromId: `${AGENDA_ITEM_COLLECTION}/${agendaItemKey}`,
      })
    );
  }

  // Consultation edge
  if (consultation) {
    await saveConsultationRelation({
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
  let agendaItemIds: string[] = [];
  do {
    const agendaItems = await map(agendaItemsList.data, async (agendaItem) => {
      return importAgendaItem(agendaItem);
    });
    agendaItemIds = [...agendaItemIds, ...agendaItems];
    if (agendaItemsList?.next) {
      agendaItemsList = await agendaItemsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return agendaItemIds;
};
