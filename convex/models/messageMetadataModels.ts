import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { components } from "../_generated/api";
import {
  chatModelOptions,
  type ChatModelValues,
} from "../ia/agents";
import { computeCostUsd, parseModelPrice } from "../lib/parseModelPrice";

type MessageMetadata = Doc<"messageMetadata">;

export type AttachmentNodeRef = {
  id: string;
  type: string;
  title: string;
};

export type AttachmentsPayload = {
  nodes?: AttachmentNodeRef[];
  position?: { x: number; y: number };
  page?: { title?: string; url?: string };
};

export type UsagePayload = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens?: number;
};

export async function listByThreadId(
  ctx: QueryCtx,
  { threadId }: { threadId: string },
): Promise<MessageMetadata[]> {
  return await ctx.db
    .query("messageMetadata")
    .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
    .collect();
}

async function findByMessageId(
  ctx: QueryCtx,
  { messageId }: { messageId: string },
): Promise<MessageMetadata | null> {
  return await ctx.db
    .query("messageMetadata")
    .withIndex("by_messageId", (q) => q.eq("messageId", messageId))
    .unique();
}

export async function recordUserAttachments(
  ctx: MutationCtx,
  {
    messageId,
    threadId,
    attachments,
  }: {
    messageId: string;
    threadId: string;
    attachments: AttachmentsPayload;
  },
): Promise<void> {
  const hasAny =
    (attachments.nodes && attachments.nodes.length > 0) ||
    !!attachments.position ||
    !!attachments.page;
  if (!hasAny) return;

  const existing = await findByMessageId(ctx, { messageId });
  if (existing) {
    await ctx.db.patch(existing._id, { attachments });
    return;
  }

  await ctx.db.insert("messageMetadata", {
    messageId,
    threadId,
    role: "user",
    attachments,
  });
}

async function findLatestAssistantMessageId(
  ctx: QueryCtx,
  { threadId }: { threadId: string },
): Promise<string | null> {
  const result = await ctx.runQuery(
    components.agent.messages.listMessagesByThreadId,
    {
      threadId,
      order: "desc",
      excludeToolMessages: true,
      paginationOpts: { cursor: null, numItems: 5 },
    },
  );
  const assistant = result.page.find(
    (m: { role?: string; _id: string }) => m.role === "assistant",
  );
  return assistant?._id ?? null;
}

function isKnownChatModel(model: string): model is ChatModelValues {
  return chatModelOptions.some((o) => o.value === model);
}

export async function recordAssistantUsage(
  ctx: MutationCtx,
  {
    threadId,
    model,
    provider,
    usage,
  }: {
    threadId: string;
    model?: string;
    provider?: string;
    usage?: UsagePayload;
  },
): Promise<void> {
  if (!usage) return;

  const messageId = await findLatestAssistantMessageId(ctx, { threadId });
  if (!messageId) return;

  const pricing = model && isKnownChatModel(model)
    ? parseModelPrice(
        chatModelOptions.find((o) => o.value === model)!.price,
      )
    : { inputPerMtok: 0, outputPerMtok: 0 };

  const incrementalCost = computeCostUsd({
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    pricing,
  });

  const existing = await findByMessageId(ctx, { messageId });

  if (existing) {
    const prev = existing.usage ?? {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };
    await ctx.db.patch(existing._id, {
      model: model ?? existing.model,
      provider: provider ?? existing.provider,
      usage: {
        inputTokens: prev.inputTokens + usage.inputTokens,
        outputTokens: prev.outputTokens + usage.outputTokens,
        totalTokens: prev.totalTokens + usage.totalTokens,
        cachedInputTokens:
          (prev.cachedInputTokens ?? 0) + (usage.cachedInputTokens ?? 0) ||
          undefined,
      },
      costUsd: (existing.costUsd ?? 0) + incrementalCost,
    });
    return;
  }

  await ctx.db.insert("messageMetadata", {
    messageId,
    threadId,
    role: "assistant",
    model,
    provider,
    usage,
    costUsd: incrementalCost,
  });
}
