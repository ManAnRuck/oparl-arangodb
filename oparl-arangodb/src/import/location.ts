import { Location, ExternalList } from "oparl-sdk/dist/types";
import { LOCATION_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { oparl } from "./oparl";
import { mapSeries } from "p-iteration";

export const importLocation = async (location: Location) => {
  process.stdout.write("Loc");
  let locationsCollection = db.collection(LOCATION_COLLECTION);

  const locationKey = oparlIdToArangoKey(location.id);

  const { ...locationRest } = location;

  return locationsCollection
    .save(
      {
        ...locationRest,
        _key: locationKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => location.id);
};

export const importLocationEl = async (
  locationEl: string
): Promise<String[]> => {
  let locationsList = await oparl.getData<ExternalList<Location>>(locationEl);
  let hasNext = true;
  let locationIds: string[] = [];
  do {
    const locations = await mapSeries(locationsList.data, async (location) => {
      return await importLocation(location);
    });
    locationIds = [...locationIds, ...locations];
    if (locationsList?.next) {
      locationsList = await locationsList.next();
    } else {
      hasNext = false;
    }
  } while (hasNext);
  return locationIds;
};
