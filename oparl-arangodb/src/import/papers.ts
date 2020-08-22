import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { PAPER_COLLECTION } from "../utils/collections";
import { ExternalList, Paper } from "oparl-sdk/dist/types";
import { mapSeries, map } from "p-iteration";
import { importFile } from "./file";
import { importConsultation } from "./consultation";
import { importLocation } from "./location";

export const importPaper = async (paper: Paper) => {
  process.stdout.write("Pap");
  let papersCollection = db.collection(PAPER_COLLECTION);

  const paperKey = oparlIdToArangoKey(paper.id);

  const {
    mainFile: mainFileFile,
    auxiliaryFile,
    consultation,
    relatedPaper: relatedPapers,
    superordinatedPaper: superordinatedPapers,
    subordinatedPaper: subordinatedPapers,
    location,
    originatorPerson: originatorPersons,
    underDirectionOf: underDirectionsOf,
    originatorOrganization: originatorOrganizations,
    ...paperRest
  } = paper;

  const auxiliaryFiles = auxiliaryFile
    ? await map(auxiliaryFile, importFile).catch((e) =>
        console.log("ERROR Paper->auxiliaryFile ", e)
      )
    : [];

  const consultations = consultation
    ? await map(consultation, importConsultation).catch((e) =>
        console.log("ERROR Paper->consultations ", e, consultation)
      )
    : [];

  const mainFile = mainFileFile
    ? await importFile(mainFileFile).catch((e) =>
        console.log("ERROR Paper->mainFile ", e)
      )
    : undefined;
  const locations = location
    ? await map(location, importLocation).catch((e) =>
        console.log("ERROR Paper->locations ", e)
      )
    : [];

  return papersCollection
    .save(
      {
        ...paperRest,
        mainFile,
        auxiliaryFiles,
        consultations,
        relatedPapers,
        superordinatedPapers,
        subordinatedPapers,
        locations,
        originatorPersons,
        underDirectionsOf,
        originatorOrganizations,
        _key: paperKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => paper.id);
};

export const importPaperEl = async (paperEl: string): Promise<String[]> => {
  let papersList = await oparl.getData<ExternalList<Paper>>(paperEl);
  let hasNext = true;
  let paperIds: string[] = [];
  do {
    const papers = await mapSeries(papersList.data, async (paper) => {
      return await importPaper(paper);
    });
    paperIds = [...paperIds, ...papers];
    if (papersList?.next) {
      papersList = await papersList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return paperIds;
};
