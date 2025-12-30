import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp({
  node: {
    externalPackages: [
      "@aws-sdk/client-s3",
      "@aws-sdk/s3-request-presigner",
    ],
  },
});
app.use(agent);

export default app;
