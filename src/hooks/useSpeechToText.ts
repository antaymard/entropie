import { useCallback, useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAudioRecorder } from "./useAudioRecorder";

export type SpeechToTextStatus = "idle" | "recording" | "transcribing";

export function useSpeechToText(onTranscript: (text: string) => void) {
  const { status: recorderStatus, startRecording, stopRecording, audioBlob, reset } =
    useAudioRecorder();
  const transcribe = useAction(api.speech.transcribe);

  const [status, setStatus] = useState<SpeechToTextStatus>("idle");
  const isTranscribingRef = useRef(false);

  // Start recording when called
  const start = useCallback(async () => {
    if (status !== "idle") return;
    setStatus("recording");
    await startRecording();
  }, [status, startRecording]);

  // Stop recording - transcription will happen via the effect below
  const stop = useCallback(() => {
    if (recorderStatus === "recording") {
      stopRecording();
    }
  }, [recorderStatus, stopRecording]);

  // When audioBlob is available after stopping, send it for transcription
  useEffect(() => {
    if (!audioBlob || isTranscribingRef.current) return;

    isTranscribingRef.current = true;
    setStatus("transcribing");

    const doTranscribe = async () => {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const result = await transcribe({ audio: arrayBuffer });
        if (result.text.trim()) {
          onTranscript(result.text.trim());
        }
      } catch (err) {
        console.error("Transcription failed:", err);
      } finally {
        isTranscribingRef.current = false;
        setStatus("idle");
        reset();
      }
    };

    void doTranscribe();
  }, [audioBlob, transcribe, onTranscript, reset]);

  return { status, start, stop };
}
