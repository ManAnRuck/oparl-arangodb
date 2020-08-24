import { Database } from "arangojs";

const db = new Database();
db.useDatabase("Oparl-Duesseldorf");

export { db };
