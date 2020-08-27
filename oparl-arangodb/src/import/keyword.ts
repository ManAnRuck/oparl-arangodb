import { FILE_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { saveKeywordRelation } from "../utils/saveKeywordRelation";
import { alreadyImported } from "../utils/alreadyImported";

export const importKeyword = async ({
  keyword,
  fromId,
}: {
  keyword: string;
  fromId: string;
}) => {
  process.stdout.write("F");
  if (alreadyImported(keyword + fromId)) {
    return keyword;
  }
  let keywordsCollection = db.collection(FILE_COLLECTION);

  const keywordKey = oparlIdToArangoKey(keyword);

  saveKeywordRelation({
    fromId: fromId,
    toKey: oparlIdToArangoKey(keyword),
  });

  return keywordsCollection
    .save(
      {
        name: keyword,
        _key: keywordKey,
      },
      {
        overwrite: true,
      }
    )
    .then(() => keyword);
};
