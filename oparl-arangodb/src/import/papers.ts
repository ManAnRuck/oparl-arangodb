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
import { alreadyImported } from "../utils/alreadyImported";

export const importPaper = async (paper: Paper) => {
  process.stdout.write("Pa");
  if (alreadyImported(paper.id)) {
    return paper.id;
  }
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

  auxiliaryFile
    ? map(auxiliaryFile, importFile)
        .then(async (auxiliaryFiles) => {
          if (auxiliaryFiles) {
            map(auxiliaryFiles, (rel) => {
              return saveFileRelation({
                fromId: `${PAPER_COLLECTION}/${paperKey}`,
                toKey: oparlIdToArangoKey(rel),
                type: "auxiliaryFile",
              });
            });
          }
          return auxiliaryFiles;
        })
        .catch((e) => console.log("\nERROR Paper->auxiliaryFile ", e))
    : [];

  consultation
    ? map(consultation, importConsultation).catch((e) =>
        console.log("\nERROR Paper->consultations ", e, consultation)
      )
    : [];

  mainFileFile
    ? importFile(mainFileFile)
        .then(async (mainFile) => {
          if (mainFile) {
            saveFileRelation({
              fromId: `${PAPER_COLLECTION}/${paperKey}`,
              toKey: oparlIdToArangoKey(mainFile),
              type: "mainFile",
            });
          }
          return mainFile;
        })
        .catch((e) => console.log("\nERROR Paper->mainFile ", e))
    : undefined;
  location
    ? map(location, importLocation).catch((e) =>
        console.log("\nERROR Paper->locations ", e)
      )
    : [];

  // file edges

  // person edges
  if (originatorPersons) {
    map(originatorPersons, async (originatorPerson) =>
      savePersonRelation({
        fromId: `${PAPER_COLLECTION}/${paperKey}`,
        toKey: oparlIdToArangoKey(originatorPerson),
        type: "originatorPerson",
      })
    );
  }

  // Keyword edge
  if (keyword) {
    map(keyword, (k) =>
      importKeyword({ keyword: k, fromId: `${PAPER_COLLECTION}/${paperKey}` })
    );
  }

  return papersCollection
    .save(
      {
        ...paperRest,
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
  let pagePromises: Promise<string[]>[] = [];
  do {
    const papers = map(papersList.data, async (paper) => {
      return importPaper(paper);
    });
    pagePromises.push(papers);
    if (papersList?.next) {
      papersList = await papersList.next();
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
