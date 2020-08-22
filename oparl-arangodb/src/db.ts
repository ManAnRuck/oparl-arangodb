import { Database } from "arangojs";

const db = new Database();
db.useDatabase("Getting-Started");

export { db };
