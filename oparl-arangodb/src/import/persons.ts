import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { PERSON_COLLECTION } from "../utils/collections";
import { ExternalList, Person } from "oparl-sdk/dist/types";
import { map } from "p-iteration";
import { importMembership } from "./membership";
import { importLocation } from "./location";
import { importKeyword } from "./keyword";

export const importPerson = async (person: Person) => {
  process.stdout.write("Per");
  let personsCollection = db.collection(PERSON_COLLECTION);

  const personKey = oparlIdToArangoKey(person.id);

  const {
    membership,
    location: locationId,
    locationObject,
    keyword,
    ...personRest
  } = person;

  const memberships = membership ? await map(membership, importMembership) : [];
  const location = locationObject
    ? await importLocation(locationObject)
    : locationId;

  // Keyword edge
  if (keyword) {
    await map(keyword, (k) =>
      importKeyword({ keyword: k, fromId: `${PERSON_COLLECTION}/${personKey}` })
    );
  }

  return personsCollection
    .save(
      {
        ...personRest,
        memberships,
        location,
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
  let personIds: string[] = [];
  do {
    const persons = await map(personsList.data, async (person) => {
      return importPerson(person);
    });
    personIds = [...personIds, ...persons];
    if (personsList?.next) {
      personsList = await personsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return personIds;
};
