import { Oparl } from "oparl-sdk";

export const oparl = new Oparl({
  entrypoint: "https://ris-oparl.itk-rheinland.de/Oparl/system",
  withCache: true,
  retryConfig: {
    retries: 60,
    retryDelay: (retryCount) => retryCount * 1000,
  },
  // limit: {
  //   maxRequests: 5,
  //   perMilliseconds: 1000,
  // },
});
