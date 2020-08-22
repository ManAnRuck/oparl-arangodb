import { oparl } from "./oparl";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { SYSTEM_COLLECTION } from "../utils/collections";
import { importBodyEl } from "./bodies";

export const importSystems = async () => {
  const system = await oparl.system;
  const systemsCol = db.collection(SYSTEM_COLLECTION);

  const systemKey = oparlIdToArangoKey(system.id);

  const { body: bodyEl, ...systemRest } = system;

  const bodies = await importBodyEl(bodyEl);

  await systemsCol
    .save(
      { ...systemRest, bodies, _key: systemKey },
      {
        overwrite: true,
      }
    )
    .catch((e) => console.log(e.response.body));
};
