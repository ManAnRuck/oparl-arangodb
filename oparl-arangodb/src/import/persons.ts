import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { PERSON_COLLECTION } from "../utils/collections";
import { ExternalList, Person } from "oparl-sdk/dist/types";
import { map } from "p-iteration";
import { importMembership } from "./membership";
import { importLocation } from "./location";
import { importKeyword } from "./keyword";
import { alreadyImported } from "../utils/alreadyImported";

export const importPerson = async (person: Person) => {
  process.stdout.write("Pe");
  if (alreadyImported(person.id)) {
    return person.id;
  }
  let personsCollection = db.collection(PERSON_COLLECTION);

  const personKey = oparlIdToArangoKey(person.id);

  const {
    membership,
    location: locationId,
    locationObject,
    keyword,
    ...personRest
  } = person;

  membership ? map(membership, importMembership) : [];
  locationObject ? importLocation(locationObject) : locationId;

  // Keyword edge
  if (keyword) {
    map(keyword, (k) =>
      importKeyword({ keyword: k, fromId: `${PERSON_COLLECTION}/${personKey}` })
    );
  }

  return personsCollection
    .save(
      {
        ...personRest,
        _key: personKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => person.id);
};

export const importPersonEl = async (personEl: string): Promise<string[]> => {
  let personsList = await oparl.getData<ExternalList<Person>>(personEl);
  let hasNext = true;
  let pagePromises: Promise<string[]>[] = [];
  do {
    const persons = map(personsList.data, async (person) => {
      return importPerson(person);
    });
    pagePromises.push(persons);
    if (personsList?.next) {
      personsList = await personsList.next();
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
