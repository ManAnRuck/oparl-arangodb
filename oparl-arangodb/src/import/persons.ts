import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { PERSON_COLLECTION } from "../utils/collections";
import { ExternalList, Person } from "oparl-sdk/dist/types";
import { mapSeries, map } from "p-iteration";
import { importMembership } from "./membership";
import { importLocation } from "./location";

export const importPerson = async (person: Person) => {
  process.stdout.write("Per");
  let personsCollection = db.collection(PERSON_COLLECTION);

  const personKey = oparlIdToArangoKey(person.id);

  const {
    membership,
    location: locationId,
    locationObject,
    ...personRest
  } = person;

  const memberships = membership ? await map(membership, importMembership) : [];
  const location = locationObject
    ? await importLocation(locationObject)
    : locationId;

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

export const importPersonEl = async (personEl: string): Promise<String[]> => {
  let personsList = await oparl.getData<ExternalList<Person>>(personEl);
  let hasNext = true;
  let personIds: string[] = [];
  do {
    const persons = await mapSeries(personsList.data, async (person) => {
      return await importPerson(person);
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
