import { AgendaItem, ExternalList } from "oparl-sdk/dist/types";
import { AGENA_ITEM_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { map, mapSeries } from "p-iteration";
import { importFile } from "./file";
import { oparl } from "./oparl";

export const importAgendaItem = async (agendaItem: AgendaItem) => {
  process.stdout.write("A");
  let agendaItemsCollection = db.collection(AGENA_ITEM_COLLECTION);

  const agendaItemKey = oparlIdToArangoKey(agendaItem.id);

  const {
    auxiliaryFile,
    resolutionFile: resolutionFileObj,
    ...agendaItemRest
  } = agendaItem;

  const auxiliaryFiles = auxiliaryFile
    ? await map(auxiliaryFile, importFile)
    : [];
  const resolutionFile = resolutionFileObj
    ? await importFile(resolutionFileObj)
    : undefined;

  return agendaItemsCollection
    .save(
      {
        ...agendaItemRest,
        auxiliaryFiles,
        resolutionFile,
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
): Promise<String[]> => {
  let agendaItemsList = await oparl.getData<ExternalList<AgendaItem>>(
    agendaItemEl
  );
  let hasNext = true;
  let agendaItemIds: string[] = [];
  do {
    const agendaItems = await mapSeries(
      agendaItemsList.data,
      async (agendaItem) => {
        return await importAgendaItem(agendaItem);
      }
    );
    agendaItemIds = [...agendaItemIds, ...agendaItems];
    if (agendaItemsList?.next) {
      agendaItemsList = await agendaItemsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return agendaItemIds;
};
