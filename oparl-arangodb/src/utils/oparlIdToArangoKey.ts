export const oparlIdToArangoKey = (id: string) =>
  id.replace(/[^0-9a-z_\-\:\.\@\(\)\+\,\=\;\$\!\*\%]/gi, "@");
