import { forEach } from "p-iteration";
import { db } from "../db";

// Edges
// export const OWNS_EDGES = "owns";
// export const MEMBERSHIP_EDGES = "memberships";
// export const FILES_EDGES = "filesEdges";
export const CONSULTATION_EDGE_COLLECTION = "consultation_edge";

const edges = [CONSULTATION_EDGE_COLLECTION];

// Collections
export const SYSTEM_COLLECTION = "systems";
export const BODY_COLLECTION = "bodies";
export const LEGISLATIVE_TERM_COLLECTION = "legislativeTerms";
export const ORGANISATION_COLLECTION = "organisations";
export const PERSON_COLLECTION = "persons";
export const MEMBERSHIP_COLLECTION = "memberships";
export const MEETING_COLLECTION = "meetings";
export const AGENA_ITEM_COLLECTION = "agendaItems";
export const PAPER_COLLECTION = "papers";
// export const CONSULTATION_COLLECTION = "consultations";
export const FILE_COLLECTION = "files";
export const LOCATION_COLLECTION = "locations";
export const KEYWORD_COLLECTION = "keywords";

const collections = [
  SYSTEM_COLLECTION,
  BODY_COLLECTION,
  LEGISLATIVE_TERM_COLLECTION,
  ORGANISATION_COLLECTION,
  PERSON_COLLECTION,
  MEMBERSHIP_COLLECTION,
  MEETING_COLLECTION,
  AGENA_ITEM_COLLECTION,
  PAPER_COLLECTION,
  // CONSULTATION_COLLECTION,
  FILE_COLLECTION,
  LOCATION_COLLECTION,
];

export const ensureEdges = async () => {
  return forEach(edges, async (edge) => {
    const edgeColection = db.edgeCollection(edge);
    if (!(await edgeColection.exists())) {
      await edgeColection.create();
    }
  });
};

export const ensureCollections = async () => {
  return forEach(collections, async (collection) => {
    const collectionCol = db.collection(collection);
    if (!(await collectionCol.exists())) {
      await collectionCol.create();
    }
  });
};
