import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { components } from "./_generated/api";
import { getThreadMetadata } from "@convex-dev/agent";
import * as MessageMetadataModels from "./models/messageMetadataModels";
import errors from "./config/errorsConfig";

export const getThreadMessageMetadata = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const authUserId = await requireAuth(ctx);

    const thread = await getThreadMetadata(ctx, components.agent, {
      threadId,
    });
    if (!thread || thread.userId !== authUserId) {
      throw new Error(errors.THREAD_NOT_FOUND_OR_FORBIDDEN);
    }

    return await MessageMetadataModels.listByThreadId(ctx, { threadId });
  },
});
