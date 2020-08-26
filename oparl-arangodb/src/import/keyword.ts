import { FILE_COLLECTION } from "../utils/collections";
import { db } from "../db";
import { oparlIdToArangoKey } from "../utils/oparlIdToArangoKey";
import { saveKeywordRelation } from "../utils/saveKeywordRelation";

export const importKeyword = async ({
  keyword,
  fromId,
}: {
  keyword: string;
  fromId: string;
}) => {
  process.stdout.write("F");
  let keywordsCollection = db.collection(FILE_COLLECTION);

  const keywordKey = oparlIdToArangoKey(keyword);

  await saveKeywordRelation({
    fromId: fromId,
    toKey: oparlIdToArangoKey(keyword),
  });

  return keywordsCollection.save(
    {
      name: keyword,
      _key: keywordKey,
    },
    {
      overwrite: true,
    }
  );
};
