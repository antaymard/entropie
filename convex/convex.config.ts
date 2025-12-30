import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp({
  node: {
    externalPackages: [
      "@aws-sdk/client-s3",
      "@aws-sdk/s3-request-presigner",
      "@aws-sdk/crc64-nvme",
    ],
  },
});
app.use(agent);

export default app;
