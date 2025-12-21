import { useEffect, useState, type Key } from "react";
import { useNoleThread } from "@/hooks/useNoleThread";
import { api } from "@/../convex/_generated/api";
import ChatInterface from "./chat-interface/ChatInterface";
import { Tooltip, TooltipContent, TooltipTrigger } from "../shadcn/tooltip";
import { cn } from "@/lib/utils";
import {
  TbHistory,
  TbCirclePlus,
  TbLoader,
  TbX,
  TbArrowBack,
  TbTrash,
} from "react-icons/tb";
import { useAction, useMutation, useQuery } from "convex/react";
import { useCanvasStore } from "@/stores/canvasStore";
import { toastError } from "../utils/errorUtils";

export function NoleChat() {
  const { threadId: _threadId, isLoading, resetThread } = useNoleThread();
  const setIsAiPanelOpen = useCanvasStore((s) => s.setIsAiPanelOpen);

  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [threadId, setThreadId] = useState<string | null>(_threadId);

  useEffect(() => {
    setThreadId(_threadId);
  }, [_threadId]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <TbLoader className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!threadId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Erreur lors du chargement du chat
      </div>
    );
  }

  const buttonCn =
    "p-2 rounded-md text-white hover:bg-white/20 transition font-medium flex items-center gap-2";

  return (
    <div className="bg-primary h-full flex flex-col overflow-hidden">
      <div className="flex p-2 items-center justify-between border-b border-white/20">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(buttonCn)}
              onClick={resetThread}
            >
              <TbCirclePlus size={15} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Nouveau chat</TooltipContent>
        </Tooltip>
        <div className="flex">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  buttonCn,
                  showHistory && "bg-white text-primary hover:bg-white/80"
                )}
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? (
                  <TbArrowBack size={15} />
                ) : (
                  <TbHistory size={15} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {showHistory
                ? "Retour au chat"
                : "Afficher l'historique des conversations"}
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(buttonCn)}
                onClick={() => setIsAiPanelOpen(false)}
              >
                <TbX size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Fermer Nolë</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {!showHistory ? (
          <ChatInterface
            threadId={threadId}
            useAttachments
            autoUpdateThreadTitleAndSummary
          />
        ) : (
          <ChatHistory
            closeHistory={() => setShowHistory(false)}
            setThreadId={setThreadId}
          />
        )}
      </div>
    </div>
  );
}

function ChatHistory({
  closeHistory,
  setThreadId,
}: {
  closeHistory: () => void;
  setThreadId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const userThreads = useQuery(api.threads.listUserThreads, {
    paginationOpts: {
      numItems: 20,
      cursor: null,
    },
  });
  const deleteThread = useAction(api.ia.nole.deleteThread);

  if (!userThreads) {
    return <div>Loading...</div>;
  }
  if (!userThreads.success) {
    return <div>Error: {userThreads.error}</div>;
  }

  const { page, continueCursor } = userThreads.threads || {};

  return (
    <div>
      <div className="flex flex-col divide-y divide-white/20">
        {page.map(
          (
            thread: {
              _id: string;
              _creationTime: string | number | Date;
              title: string | null;
            },
            i: Key | null | undefined
          ) => (
            <button
              key={i}
              type="button"
              className="group p-4 text-white w-full flex hover:bg-white/10"
              onClick={() => {
                setThreadId(thread._id);
                closeHistory();
              }}
            >
              <div className="flex flex-col items-start gap-1 flex-1">
                <div className="font-semibold truncate w-full text-left">
                  {thread.title || "Sans titre"}
                </div>
                <div className="text-sm">
                  Créé le {new Date(thread._creationTime).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                className="p-2 rounded-sm hidden group-hover:block hover:text-red-400"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await deleteThread({ threadId: thread._id });
                  } catch (error) {
                    toastError(
                      error,
                      "Erreur lors de la suppression du thread."
                    );
                  }
                }}
              >
                <TbTrash size={16} />
              </button>
            </button>
          )
        )}
      </div>
    </div>
  );
}
