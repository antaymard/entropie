import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

/**
 * Hook pour gérer un thread de conversation avec Nole
 */
export function useNoleThread() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const latestThread = useQuery(api.ia.nole.getLatestThread);
  const startThread = useAction(api.ia.nole.startThread);

  useEffect(() => {
    const initThread = async () => {
      try {
        // First, check if there's an existing thread
        if (latestThread !== undefined) {
          if (latestThread && "threadId" in latestThread) {
            // Use the existing thread
            setThreadId(latestThread.threadId);
            setIsLoading(false);
          } else {
            // No existing thread, create a new one
            const result = await startThread({});
            if ("threadId" in result) {
              setThreadId(result.threadId);
            } else if ("error" in result) {
              console.error(
                "Erreur lors de la création du thread:",
                result.error
              );
            }
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation du thread:", error);
        setIsLoading(false);
      }
    };

    void initThread();
  }, [startThread, latestThread]);

  const resetThread = async () => {
    setIsLoading(true);
    setThreadId(null);
    try {
      const result = await startThread({});
      if ("threadId" in result) {
        setThreadId(result.threadId);
      }
    } catch (error) {
      console.error("Erreur lors du reset du thread:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { threadId, isLoading, resetThread };
}
