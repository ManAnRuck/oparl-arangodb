import { Oparl } from "oparl-sdk";

export const oparlConfig: any = {
  withCache: true,
  retryConfig: {
    retries: 60,
    retryDelay: (retryCount: number) => {
      process.stdout.write("R");
      return retryCount * 1000;
    },
  },
  // limit: {
  //   maxRequests: 5,
  //   perMilliseconds: 1000,
  // },
};

export const oparl = new Oparl({
  entrypoint: "https://ris-oparl.itk-rheinland.de/Oparl/system",
  ...oparlConfig,
});
