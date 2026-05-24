import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { getModelMaxContext } from "@/lib/getModelLabel";
import type { ChatModelOption } from "@/types/convex";

export type ThreadStats = {
  isLoading: boolean;
  totalTokens: number;
  totalCostUsd: number;
  maxContext: number | undefined;
  contextPercent: number | undefined;
  perModel: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
  }[];
};

export function useThreadStats({
  threadId,
  selectedModel,
  modelOptions,
}: {
  threadId: string | null | undefined;
  selectedModel: string | undefined;
  modelOptions: readonly ChatModelOption[] | undefined;
}): ThreadStats {
  const metadata = useQuery(
    api.messageMetadata.getThreadMessageMetadata,
    threadId ? { threadId } : "skip",
  );

  return useMemo(() => {
    const isLoading = metadata === undefined;
    const rows = metadata ?? [];

    const perModelMap = new Map<
      string,
      {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        costUsd: number;
      }
    >();
    let totalTokens = 0;
    let totalCostUsd = 0;

    for (const row of rows) {
      if (row.role !== "assistant" || !row.usage) continue;
      totalTokens += row.usage.totalTokens;
      totalCostUsd += row.costUsd ?? 0;

      const modelKey = row.model ?? "unknown";
      const prev = perModelMap.get(modelKey) ?? {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costUsd: 0,
      };
      perModelMap.set(modelKey, {
        inputTokens: prev.inputTokens + row.usage.inputTokens,
        outputTokens: prev.outputTokens + row.usage.outputTokens,
        totalTokens: prev.totalTokens + row.usage.totalTokens,
        costUsd: prev.costUsd + (row.costUsd ?? 0),
      });
    }

    const maxContext = getModelMaxContext(selectedModel, modelOptions);
    const contextPercent =
      maxContext && maxContext > 0
        ? (totalTokens / maxContext) * 100
        : undefined;

    return {
      isLoading,
      totalTokens,
      totalCostUsd,
      maxContext,
      contextPercent,
      perModel: Array.from(perModelMap.entries()).map(([model, v]) => ({
        model,
        ...v,
      })),
    };
  }, [metadata, selectedModel, modelOptions]);
}
