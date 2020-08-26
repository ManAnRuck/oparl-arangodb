import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { PAPER_COLLECTION } from "../utils/collections";
import { ExternalList, Paper } from "oparl-sdk/dist/types";
import { map } from "p-iteration";
import { importFile } from "./file";
import { importConsultation } from "./consultation";
import { importLocation } from "./location";
import { saveFileRelation } from "../utils/saveFileRelation";
import { importKeyword } from "./keyword";
import { savePersonRelation } from "../utils/savePersonRelation";

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
    keyword,
    ...paperRest
  } = paper;

  const auxiliaryFiles = auxiliaryFile
    ? await map(auxiliaryFile, importFile).catch((e) =>
        console.log("\nERROR Paper->auxiliaryFile ", e)
      )
    : [];

  const consultations = consultation
    ? await map(consultation, importConsultation).catch((e) =>
        console.log("\nERROR Paper->consultations ", e, consultation)
      )
    : [];

  const mainFile = mainFileFile
    ? await importFile(mainFileFile).catch((e) =>
        console.log("\nERROR Paper->mainFile ", e)
      )
    : undefined;
  const locations = location
    ? await map(location, importLocation).catch((e) =>
        console.log("\nERROR Paper->locations ", e)
      )
    : [];

  // file edges
  if (mainFile) {
    await saveFileRelation({
      fromId: `${PAPER_COLLECTION}/${paperKey}`,
      toKey: oparlIdToArangoKey(mainFile),
      type: "mainFile",
    });
  }
  if (auxiliaryFiles) {
    await map(auxiliaryFiles, (rel) => {
      return saveFileRelation({
        fromId: `${PAPER_COLLECTION}/${paperKey}`,
        toKey: oparlIdToArangoKey(rel),
        type: "auxiliaryFile",
      });
    });
  }

  // person edges
  if (originatorPersons) {
    await map(
      originatorPersons,
      async (originatorPerson) =>
        await savePersonRelation({
          fromId: `${PAPER_COLLECTION}/${paperKey}`,
          toKey: oparlIdToArangoKey(originatorPerson),
          type: "originatorPerson",
        })
    );
  }

  // Keyword edge
  if (keyword) {
    await map(keyword, (k) =>
      importKeyword({ keyword: k, fromId: `${PAPER_COLLECTION}/${paperKey}` })
    );
  }

  return papersCollection
    .save(
      {
        ...paperRest,
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

export const importPaperEl = async (paperEl: string): Promise<string[]> => {
  let papersList = await oparl.getData<ExternalList<Paper>>(paperEl);
  let hasNext = true;
  let paperIds: string[] = [];
  do {
    const papers = await map(papersList.data, async (paper) => {
      return importPaper(paper);
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
