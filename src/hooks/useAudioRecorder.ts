import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type RecordingStatus = "idle" | "recording" | "stopped";

export interface AudioRecorderResult {
  /** Current recording status */
  status: RecordingStatus;
  /** Start recording audio from the microphone */
  startRecording: () => Promise<void>;
  /** Stop recording and produce the audio blob */
  stopRecording: () => void;
  /** The assembled audio Blob after stopping, null while recording or idle */
  audioBlob: Blob | null;
  /** Reset state back to idle so a new recording can begin */
  reset: () => void;
  /** Error that occurred during recording */
  error: string | null;
}

export function useAudioRecorder(): AudioRecorderResult {
  const { t } = useTranslation();
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setStatus("stopped");

        // Release the microphone
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setStatus("recording");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errors.failedMicrophone");
      setError(message);
      setStatus("idle");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    // Stop any ongoing recording
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];

    setStatus("idle");
    setAudioBlob(null);
    setError(null);
  }, []);

  return {
    status,
    startRecording,
    stopRecording,
    audioBlob,
    reset,
    error,
  };
}
