import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import durableAgents from "convex-durable-agents/convex.config.js";

const app = defineApp();
app.use(agent);
app.use(durableAgents);

export default app;
