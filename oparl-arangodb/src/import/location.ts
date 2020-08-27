import { Location, ExternalList } from "oparl-sdk/dist/types";
import { LOCATION_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { oparl } from "./oparl";
import { map } from "p-iteration";
import { importKeyword } from "./keyword";
import { alreadyImported } from "../utils/alreadyImported";

export const importLocation = async (location: Location) => {
  process.stdout.write("Loc");
  if (alreadyImported(location.id)) {
    return location.id;
  }
  let locationsCollection = db.collection(LOCATION_COLLECTION);

  const locationKey = oparlIdToArangoKey(location.id);

  const { keyword, ...locationRest } = location;

  // Keyword edge
  if (keyword) {
    map(keyword, (k) =>
      importKeyword({
        keyword: k,
        fromId: `${LOCATION_COLLECTION}/${locationKey}`,
      })
    );
  }

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
): Promise<string[]> => {
  let locationsList = await oparl.getData<ExternalList<Location>>(locationEl);
  let hasNext = true;
  let locationIds: string[] = [];
  do {
    const locations = await map(locationsList.data, async (location) => {
      return importLocation(location);
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
