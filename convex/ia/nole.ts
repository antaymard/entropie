import { v } from "convex/values";
import { action, internalAction, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { createNoleAgent } from "./agents";
import {
  createThread,
  listUIMessages,
  syncStreams,
  vStreamArgs,
} from "@convex-dev/agent";
import { components } from "../_generated/api";
import { paginationOptsValidator } from "convex/server";
import { requireAuth } from "../lib/auth";
import { encode } from "@toon-format/toon";
import z from "zod";
import { mistral } from "@ai-sdk/mistral";

// Get the latest thread for the user
export const getLatestThread = query({
  args: {},
  returns: v.union(
    v.object({
      threadId: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const authUserId = await requireAuth(ctx);
    if (!authUserId) {
      return null;
    }

    // Get the latest thread from the agent component
    const result = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId: authUserId,
        order: "desc",
        paginationOpts: { numItems: 1, cursor: null },
      },
    );

    if (!result || result.page.length === 0) {
      return null;
    }

    return { threadId: result.page[0]._id };
  },
});

// Create a new thread for the user
export const startThread = action({
  args: {},
  returns: v.union(
    v.object({
      threadId: v.string(),
    }),
    v.object({
      success: v.boolean(),
      error: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const authUserId = await requireAuth(ctx);
    if (!authUserId) {
      return {
        success: false,
        error: "Utilisateur non authentifié",
      };
    }
    const threadId = await createThread(ctx, components.agent, {
      userId: authUserId,
    });
    return { threadId };
  },
});

// Save user message, then stream response asynchronously
export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    context: v.optional(v.any()),
  },
  returns: v.union(
    v.object({
      messageId: v.string(),
    }),
    v.object({
      success: v.boolean(),
      error: v.string(),
    }),
  ),
  handler: async (ctx, { threadId, prompt, context }) => {
    const authUserId = await requireAuth(ctx);
    if (!authUserId) {
      return {
        success: false,
        error: "Utilisateur non authentifié",
      };
    }

    // Save the user message
    const noleAgent = createNoleAgent();
    const { messageId } = await noleAgent.saveMessage(ctx, {
      threadId,
      prompt,
    });

    // Schedule the streaming action (no await needed for scheduler)
    void ctx.scheduler.runAfter(0, internal.ia.nole.streamResponse, {
      authUserId: authUserId,
      threadId,
      promptMessageId: messageId,
      metadata: {
        context,
      },
    });

    return { messageId };
  },
});

// Internal action that handles streaming
export const streamResponse = internalAction({
  args: {
    authUserId: v.string(),
    promptMessageId: v.string(),
    threadId: v.string(),
    metadata: v.optional(
      v.object({
        context: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, { authUserId, promptMessageId, threadId, metadata }) => {
    const optimizedCanvas = {
      canvasId: metadata?.context?.canvas?._id || null,
      name: metadata?.context?.canvas?.name || null,
      description: metadata?.context?.canvas?.description || null,
      nodesNb: metadata?.context?.canvas?.nodes
        ? metadata?.context?.canvas?.nodes.length
        : 0,
    };
    const noleAgent = createNoleAgent();
    const result = await noleAgent.streamText(
      ctx,
      { threadId, userId: authUserId },
      {
        promptMessageId,
        system: `${noleAgent.options.instructions}

        # ======== Contexte utilisateur lors de la question ========

        ## Canvas actuel (utilise tes tools pour plus de détails si besoin)
        ${encode(optimizedCanvas ?? null) || "N/A"}
        
        ## Pièces jointes
        L'utilisateur a joint les éléments suivants à sa question. Si des nodes sont fournis, utilise-les pour mieux comprendre le contexte et répondre à la question. Si une position est fournie, utilise-la pour situer la question dans le canvas ou générer des nodes à cet endroit.

        ### Nodes attachés
        ${encode(metadata?.context?.attachedNodes ?? null) || "N/A"}

        ### Position attachée
        ${encode(metadata?.context?.attachedPosition ?? null) || "N/A"}
        
        ========= Fin du contexte ========
        
        Si l'utilisateur te dit de mettre de l'info ou de placer une info ou d'écrire ou quelque chose, ton réflexe doit être de passer par la création de nodes sur le canvas. Surtout quand l'information est complexe. C'est mieux qu'une longue réponse texte dans le chat.
        `,
      },
      {
        saveStreamDeltas: {
          chunking: "word", // Stream word by word
          throttleMs: 100, // 50ms between each update
        },
      },
    );

    // Consume the stream to ensure it finishes
    await result.consumeStream();
    return null;
  },
});

// Query to retrieve and subscribe to messages
export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  // returns: v.object({
  //   page: v.array(v.any()),
  //   isDone: v.boolean(),
  //   continueCursor: v.string(),
  //   streams: v.any(),
  // }),
  handler: async (ctx, { threadId, paginationOpts, streamArgs }) => {
    // Sync ongoing streams
    const streams = await syncStreams(ctx, components.agent, {
      threadId,
      streamArgs,
    });

    // Retrieve messages with pagination
    const paginated = await listUIMessages(ctx, components.agent, {
      threadId,
      paginationOpts,
    });

    return {
      ...paginated,
      streams,
    };
  },
});

export const updateThreadTitle = action({
  args: { threadId: v.string(), onlyIfUntitled: v.optional(v.boolean()) },
  handler: async (ctx, { threadId, onlyIfUntitled }) => {
    // await authorizeThreadAccess(ctx, threadId);
    await requireAuth(ctx);
    const noleAgent = createNoleAgent({ model: mistral("ministral-14b-2512") });
    const { thread } = await noleAgent.continueThread(ctx, { threadId });
    if (onlyIfUntitled) {
      const metadata = await thread.getMetadata();
      if (metadata.title && metadata.title.trim().length > 0) {
        return;
      }
    }
    const {
      object: { title },
    } = await thread.generateObject(
      {
        mode: "json",
        schemaDescription:
          "Generate a title for the thread. The title should be a single sentence that captures the main topic of the thread. **Must be in French.**",
        schema: z.object({
          title: z.string().describe("The new title for the thread"),
          // summary: z.string().describe("The new summary for the thread"),
        }),
        prompt: "Generate a title for this thread.",
      },
      { storageOptions: { saveMessages: "none" } },
    );
    await thread.updateMetadata({ title });
  },
});

export const deleteThread = action({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await requireAuth(ctx);
    const noleAgent = createNoleAgent();
    await noleAgent.deleteThreadAsync(ctx, { threadId });
    return { success: true };
  },
});
