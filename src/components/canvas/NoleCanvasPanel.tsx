import { useCallback, useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/shadcn/button";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import {
  optimisticallySendMessage,
  useUIMessages,
} from "@convex-dev/agent/react";
import { useNoleStore } from "@/stores/noleStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { toConvexNodes } from "@/components/utils/nodeUtils";
import { useNoleThread } from "@/hooks/useNoleThread";
import { useHotkey, useKeyHold } from "@tanstack/react-hotkeys";

import NoleIcon from "@/assets/svg-components/NoleIcon";
import {
  TbCheck,
  TbKeyboard,
  TbMicrophone,
  TbPlus,
  TbSend,
  TbSettingsSpark,
  TbX,
} from "react-icons/tb";
import { Spinner } from "@/components/shadcn/spinner";
import { Kbd } from "@/components/shadcn/kbd";
import RichTextArea from "./nole-panel/RichTextArea";
import SoundWaveAnimation from "./nole-panel/SoundWaveAnimation";
import ChatResponseBubble from "./nole-panel/ChatResponseBubble";
import ThreadSelector from "./nole-panel/ThreadSelector";
import { playTextToSpeech, stopAudio } from "./nole-panel/textToSpeech";

export default function NoleCanvasPanel() {
  const {
    threadId: initialThreadId,
    isLoading: isThreadLoading,
    resetThread,
  } = useNoleThread();
  const [overrideThreadId, setOverrideThreadId] = useState<string | null>(null);
  const threadId = overrideThreadId ?? initialThreadId;

  const [richTextValue, setRichTextValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const { startRecording, stopRecording, audioBlob, reset } =
    useAudioRecorder();

  const transcribeAction = useAction(api.ia.voice.transcribe);

  const [layoutMode, setLayoutMode] = useState<
    "idle" | "recording" | "transcribing" | "text" | "responding"
  >("idle");
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  // Hotkeys management
  const isAltHeld = useKeyHold("Alt");
  useHotkey("C", () => setLayoutMode("text"), {
    enabled: layoutMode === "idle" || layoutMode === "responding",
  });
  useHotkey({ key: "Escape" }, () => setLayoutMode("idle"), {
    enabled: layoutMode !== "idle",
  });
  // Alt+Enter to send message in text mode
  useHotkey({ key: "alt+Enter" }, () => void sendMessage(), {
    enabled: layoutMode === "text",
  });

  // Thread messages (to detect if assistant is responding)
  const { results: messages } = useUIMessages(
    api.ia.nole.listMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 1, stream: true },
  );

  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;

  const isAssistantResponding =
    lastMessage !== null &&
    lastMessage.role === "assistant" &&
    lastMessage.status !== "success" &&
    lastMessage.status !== "failed";

  // Fire TTS when assistant message finishes streaming
  const prevMessageStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const wasPending = prevMessageStatusRef.current !== "success";
    const isDone =
      lastMessage?.status === "success" && lastMessage.role === "assistant";
    if (wasPending && isDone && lastMessage.text) {
      void playTextToSpeech(lastMessage.text, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          currentAudioRef.current = null;
        },
      }).then((audio) => {
        currentAudioRef.current = audio;
      });
    }
    prevMessageStatusRef.current = lastMessage?.status;
  }, [lastMessage?.status, lastMessage?.role, lastMessage?.text]);

  // Auto-switch to responding layout when assistant starts streaming
  useEffect(() => {
    if (isAssistantResponding && layoutMode === "idle") {
      setLayoutMode("responding");
    }
  }, [isAssistantResponding, layoutMode]);

  // Thread info (title)
  const threadInfo = useQuery(
    api.threads.getThreadInfo,
    threadId ? { threadId } : "skip",
  );

  // Send message mutation with optimistic update
  const sendMessageMutation = useMutation(
    api.ia.nole.sendMessage,
  ).withOptimisticUpdate(optimisticallySendMessage(api.ia.nole.listMessages));

  const updateThreadTitle = useAction(api.ia.nole.updateThreadTitle);

  // Recording flow
  const handleStartRecording = useCallback(async () => {
    setTranscribeError(null);
    await startRecording();
    setLayoutMode("recording");
  }, [startRecording]);

  const handleCancelRecording = useCallback(() => {
    reset();
    setLayoutMode("idle");
  }, [reset]);

  const handleValidateRecording = useCallback(() => {
    stopRecording();
    setLayoutMode("transcribing");
  }, [stopRecording]);

  // Alt hold-to-record: press Alt → start recording, release Alt → validate
  useEffect(() => {
    if (isAltHeld && (layoutMode === "idle" || layoutMode === "responding")) {
      handleStartRecording();
    } else if (!isAltHeld && layoutMode === "recording") {
      handleValidateRecording();
    }
  }, [isAltHeld, layoutMode, handleStartRecording, handleValidateRecording]);

  // Auto-transcribe when audioBlob is ready after validation
  useEffect(() => {
    if (layoutMode !== "transcribing" || !audioBlob) return;

    let cancelled = false;
    const doTranscribe = async () => {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const response = await transcribeAction({ audio: arrayBuffer });
        if (!cancelled) {
          setRichTextValue(response.text);
          setLayoutMode("text");
        }
      } catch (err) {
        if (!cancelled) {
          setTranscribeError(
            err instanceof Error ? err.message : "Erreur de transcription",
          );
          setLayoutMode("idle");
        }
      } finally {
        if (!cancelled) {
          reset();
        }
      }
    };
    doTranscribe();

    return () => {
      cancelled = true;
    };
  }, [layoutMode, audioBlob, transcribeAction, reset]);

  const sendMessage = useCallback(async () => {
    if (!threadId || richTextValue.trim() === "" || isSending) return;

    const prompt = richTextValue;
    setRichTextValue("");
    setIsSending(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas: any = useCanvasStore.getState().canvas;
    const context = {
      attachedNodes: toConvexNodes(useNoleStore.getState().attachedNodes),
      attachedPosition: useNoleStore.getState().attachedPosition,
      canvas: {
        _id: canvas?._id || "",
        name: canvas?.name || "",
        description: canvas?.description || "",
        nodes:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          canvas?.nodes?.map((n: any) => ({
            id: n.id,
            name: n.name,
            position: n.position,
            width: n.width,
            height: n.height,
          })) || [],
        edges: canvas?.edges || [],
      },
    };

    try {
      await sendMessageMutation({ threadId, prompt, context });
      useNoleStore.getState().resetAttachments();
      // Auto-generate title after first message
      void updateThreadTitle({ threadId, onlyIfUntitled: true });
      setLayoutMode("idle");
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      setRichTextValue(prompt);
    } finally {
      setIsSending(false);
    }
  }, [
    threadId,
    richTextValue,
    isSending,
    sendMessageMutation,
    updateThreadTitle,
  ]);

  const handleNewThread = useCallback(async () => {
    setOverrideThreadId(null);
    await resetThread();
    setRichTextValue("");
  }, [resetThread]);

  const handleSelectThread = useCallback((selectedThreadId: string) => {
    setOverrideThreadId(selectedThreadId);
    setRichTextValue("");
  }, []);

  const Separator = () => (
    <div className="bg-slate-200 h-5 w-px rounded-full" />
  );

  if (layoutMode === "idle") {
    return (
      <div className="flex flex-col items-center">
        <div className="bg-white rounded p-2 flex items-center gap-2 text-text border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLayoutMode("responding")}
          >
            <NoleIcon />
          </Button>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLayoutMode("text")}
          >
            <TbKeyboard size={20} strokeWidth={2.5} />
            <Kbd>C</Kbd>
          </Button>
          <Separator />
          <Button variant="ghost" size="sm" onClick={handleStartRecording}>
            <TbMicrophone size={19} strokeWidth={2.5} />
            <Kbd>Alt</Kbd>
          </Button>
          <Separator />
          <Button variant="ghost" size="sm">
            <TbSettingsSpark size={19} strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    );
  }

  if (layoutMode === "responding") {
    return (
      <div className="flex flex-col items-center">
        <div className="bg-white rounded p-2 flex items-center gap-2 text-text border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isSpeaking && currentAudioRef.current) {
                stopAudio(currentAudioRef.current);
              } else {
                setShowBubble((v) => !v);
              }
            }}
          >
            {isAssistantResponding ? (
              <Spinner className="size-4" />
            ) : isSpeaking ? (
              <SoundWaveAnimation />
            ) : (
              <NoleIcon />
            )}
          </Button>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLayoutMode("text")}
          >
            <TbKeyboard size={20} strokeWidth={2.5} />
            <Kbd>C</Kbd>
          </Button>
          <Separator />
          <Button variant="ghost" size="sm" onClick={handleStartRecording}>
            <TbMicrophone size={19} strokeWidth={2.5} />
            <Kbd>Alt</Kbd>
          </Button>
          <Separator />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setLayoutMode("idle")}
          >
            <TbX size={19} strokeWidth={2.5} />
          </Button>
        </div>
        {showBubble &&
          (lastMessage && lastMessage.role === "assistant" ? (
            <ChatResponseBubble message={lastMessage} />
          ) : (
            <p className="text-xs text-slate-400 mt-2">
              Aucun message pour le moment
            </p>
          ))}
      </div>
    );
  }

  if (layoutMode === "recording" || layoutMode === "transcribing") {
    return (
      <div className="bg-white rounded p-2 flex items-center gap-2 text-text border">
        <Button variant="ghost" size="sm" disabled>
          <NoleIcon />
        </Button>
        <Separator />
        {layoutMode === "recording" ? (
          <>
            <SoundWaveAnimation />
            <Separator />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCancelRecording}
            >
              <TbX size={19} strokeWidth={2.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleValidateRecording}
            >
              <TbCheck size={19} strokeWidth={2.5} />
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2 px-2">
            <Spinner className="size-4" />
            <span className="text-sm text-slate-400">Transcription...</span>
          </div>
        )}
        {transcribeError && (
          <span className="text-xs text-destructive">{transcribeError}</span>
        )}
      </div>
    );
  }

  if (layoutMode === "text") {
    const threadTitle = threadInfo?.title || "New Session";
    const canSend = richTextValue.trim() !== "" && !isSending && !!threadId;

    return (
      <div className="bg-white rounded p-3 w-2xl border shadow-md/5 flex flex-col gap-3">
        <RichTextArea
          value={richTextValue}
          onChange={setRichTextValue}
          onSubmit={sendMessage}
        />
        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setLayoutMode("idle")}
            >
              <TbX size={19} strokeWidth={2.5} />
            </Button>

            <Separator />
            <p className="text-slate-400 truncate max-w-48">
              {isThreadLoading ? "Loading..." : threadTitle}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="pl-1! text-slate-400"
              onClick={handleNewThread}
            >
              <TbPlus size={16} />
              New
            </Button>
            {threadId && (
              <ThreadSelector
                currentThreadId={threadId}
                onSelectThread={handleSelectThread}
              />
            )}
          </div>
          <Button
            variant="default"
            size="icon"
            onClick={sendMessage}
            disabled={!canSend}
          >
            {isSending ? (
              <Spinner className="size-4" />
            ) : (
              <TbSend size={19} strokeWidth={2.5} />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
