import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

/**
 * Hook pour gérer un thread de conversation avec Nole
 */
export function useNoleThread() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const latestThread = useQuery(api.threads.getLatestThread);
  const startThread = useMutation(api.threads.startThread);

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
            setThreadId(result.threadId);
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
      setThreadId(result.threadId);
    } catch (error) {
      console.error("Erreur lors du reset du thread:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { threadId, isLoading, resetThread };
}
