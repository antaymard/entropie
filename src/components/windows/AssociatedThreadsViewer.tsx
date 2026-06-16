import { useState } from "react";
import type { Id } from "@/types";
import useRichQuery from "../utils/useRichQuery";
import { api } from "@/../convex/_generated/api";
import { formatDistanceToNow } from "@/lib/date-utils";
import { TbMessage } from "react-icons/tb";
import { cn } from "@/lib/utils";

export default function AssociatedThreadsViewer({
  nodeDataId,
}: {
  nodeDataId: Id<"nodeDatas">;
  closeModale?: () => void;
}) {
  const { data, isSuccess, isPending } = useRichQuery(
    api.nodeDataVersions.getThreadsThatCreatedVersions,
    { nodeDataId },
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!isSuccess) {
    return <div>Error loading associated threads.</div>;
  }

  if (data.length === 0) {
    return <div>No threads have modified this node.</div>;
  }

  // Sélection par défaut : le premier thread de la liste.
  const selectedThreadId = selectedId ?? data[0]._id;
  const selected =
    data.find((thread) => thread._id === selectedThreadId) ?? data[0];

  return (
    <div className="flex min-h-0 flex-1 gap-3">
      {/* Liste des threads */}
      <div className="flex w-56 shrink-0 flex-col gap-1 overflow-auto border-r pr-2">
        {data.map((thread) => {
          const isSelected = selected._id === thread._id;

          return (
            <button
              key={thread._id}
              type="button"
              onClick={() => setSelectedId(thread._id)}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm",
                isSelected ? "bg-slate-100" : "hover:bg-slate-50",
              )}
            >
              <TbMessage className="size-4 shrink-0 text-slate-500" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">
                  {thread.title ?? "Untitled thread"}
                </span>
                <span
                  className="truncate text-xs text-slate-400"
                  title={new Date(thread._creationTime).toLocaleString()}
                >
                  {formatDistanceToNow(new Date(thread._creationTime), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Infos du thread sélectionné */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-auto rounded border bg-white p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-medium text-slate-800">
            {selected.title ?? "Untitled thread"}
          </h3>
          <span
            className="text-xs text-slate-400"
            title={new Date(selected._creationTime).toLocaleString()}
          >
            Created{" "}
            {formatDistanceToNow(new Date(selected._creationTime), {
              addSuffix: true,
            })}
          </span>
        </div>

        {selected.summary ? (
          <p className="whitespace-pre-wrap text-sm text-slate-600">
            {selected.summary}
          </p>
        ) : (
          <p className="text-sm text-slate-400">No summary available.</p>
        )}
      </div>
    </div>
  );
}
