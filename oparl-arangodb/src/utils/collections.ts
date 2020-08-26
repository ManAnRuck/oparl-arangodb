import { forEach } from "p-iteration";
import { db } from "../db";

// Edges
export const CONSULTATION_EDGE_COLLECTION = "consultation_edge";
export const FILE_EDGE_COLLECTION = "file_edge";
export const KEYWORD_EDGE_COLLECTION = "keyword_edge";
export const AGENDA_ITEM_EDGE_COLLECTION = "agenda_item_edge";
export const MEETING_EDGE_COLLECTION = "meeting_edge";
export const PAPER_EDGE_COLLECTION = "paper_edge";
export const ORGANISATION_EDGE_COLLECTION = "organisation_edge";
export const MEMBERSHIP_EDGE_COLLECTION = "membership_edge";
export const PERSON_EDGE_COLLECTION = "person_edge";
// BODY_EDGE_COLLECTION
// LEGISLATIVE_TERM_EDGE_COLLECTION
// LOCATION_EDGE_COLLECTION

const edges = [
  CONSULTATION_EDGE_COLLECTION,
  FILE_EDGE_COLLECTION,
  KEYWORD_EDGE_COLLECTION,
  AGENDA_ITEM_EDGE_COLLECTION,
  MEETING_EDGE_COLLECTION,
  PAPER_EDGE_COLLECTION,
  ORGANISATION_EDGE_COLLECTION,
  MEMBERSHIP_EDGE_COLLECTION,
  PERSON_EDGE_COLLECTION,
];

// Collections
export const SYSTEM_COLLECTION = "systems";
export const BODY_COLLECTION = "bodies";
export const LEGISLATIVE_TERM_COLLECTION = "legislativeTerms";
export const ORGANISATION_COLLECTION = "organisations";
export const PERSON_COLLECTION = "persons";
export const MEMBERSHIP_COLLECTION = "memberships";
export const MEETING_COLLECTION = "meetings";
export const AGENDA_ITEM_COLLECTION = "agendaItems";
export const PAPER_COLLECTION = "papers";
export const CONSULTATION_COLLECTION = "consultations";
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
  AGENDA_ITEM_COLLECTION,
  PAPER_COLLECTION,
  CONSULTATION_COLLECTION,
  FILE_COLLECTION,
  LOCATION_COLLECTION,
  KEYWORD_COLLECTION,
];

export const ensureEdges = async () => {
  return await forEach(edges, async (edge) => {
    const edgeColection = db.edgeCollection(edge);
    if (!(await edgeColection.exists())) {
      await edgeColection.create();
    }
  });
};

export const ensureCollections = async () => {
  return await forEach(collections, async (collection) => {
    const collectionCol = db.collection(collection);
    if (!(await collectionCol.exists())) {
      await collectionCol.create();
    }
  });
};
