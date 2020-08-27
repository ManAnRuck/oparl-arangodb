const keys: string[] = [];

export const alreadyImported = (key: string) => {
  const exists = keys.some((k) => k === key);
  if (exists) {
    process.stdout.write(".");
  } else {
    keys.push(key);
  }
  return exists;
};
