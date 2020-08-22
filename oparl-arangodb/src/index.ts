import { importSystems } from "./import";
import { ensureCollections } from "./utils/collections";

(async () => {
  const start = new Date();
  // ensure collections are existing
  await ensureCollections();
  //   await ensureEdges();

  await importSystems();
  console.log("### DONE ###");
  console.log("### DONE ###");
  console.log("### DONE ###");
  const end = (new Date() as any) - (start as any);
  console.info("Execution time: %dms", end);
})();
