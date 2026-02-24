import { useCallback, useState } from "react";
import { useAction } from "convex/react";
import { Mic, Square, Loader2 } from "lucide-react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/shadcn/button";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { cn } from "@/lib/utils";

export default function VoiceRecorderPanel() {
  const { status, startRecording, stopRecording, audioBlob, reset, error } =
    useAudioRecorder();

  const transcribeAction = useAction(api.ia.voice.transcribe);

  const [transcribing, setTranscribing] = useState(false);
  const [result, setResult] = useState<{
    text: string;
    segments: Array<{ text: string; start: number; end: number }>;
    language: string | null;
  } | null>(null);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const handleTranscribe = useCallback(async () => {
    if (!audioBlob) return;

    setTranscribing(true);
    setTranscribeError(null);
    setResult(null);

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const response = await transcribeAction({ audio: arrayBuffer });
      setResult(response);
    } catch (err) {
      setTranscribeError(
        err instanceof Error ? err.message : "Erreur de transcription",
      );
    } finally {
      setTranscribing(false);
    }
  }, [audioBlob, transcribeAction]);

  const handleReset = useCallback(() => {
    reset();
    setResult(null);
    setTranscribeError(null);
  }, [reset]);

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-white/90 backdrop-blur-sm border shadow-lg px-4 py-3 min-w-70">
      {/* Controls */}
      <div className="flex items-center gap-2">
        {status === "idle" && (
          <Button
            size="sm"
            variant="outline"
            onClick={startRecording}
            className="gap-1.5"
          >
            <Mic className="size-4" />
            Enregistrer
          </Button>
        )}

        {status === "recording" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={stopRecording}
            className="gap-1.5"
          >
            <Square className="size-3 fill-current" />
            <span className="flex items-center gap-1.5">
              Stop
              <span
                className={cn("size-2 rounded-full bg-white animate-pulse")}
              />
            </span>
          </Button>
        )}

        {status === "stopped" && !transcribing && (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={handleTranscribe}
              className="gap-1.5"
            >
              Transcrire
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset}>
              Reset
            </Button>
          </>
        )}

        {transcribing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Transcription...
          </div>
        )}
      </div>

      {/* Audio blob info */}
      {status === "stopped" && audioBlob && !result && !transcribing && (
        <p className="text-xs text-muted-foreground">
          Audio : {(audioBlob.size / 1024).toFixed(1)} Ko
        </p>
      )}

      {/* Error display */}
      {(error || transcribeError) && (
        <p className="text-xs text-destructive max-w-75 text-center">
          {error || transcribeError}
        </p>
      )}

      {/* Transcription result */}
      {result && (
        <div className="flex flex-col gap-1.5 max-w-100">
          <p className="text-sm leading-relaxed">{result.text}</p>
          {result.language && (
            <p className="text-xs text-muted-foreground">
              Langue : {result.language}
            </p>
          )}
          {result.segments.length > 0 && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                {result.segments.length} segments (timestamps)
              </summary>
              <ul className="mt-1 max-h-37.5 overflow-y-auto space-y-0.5">
                {result.segments.map((seg, i) => (
                  <li key={i}>
                    <span className="font-mono">
                      [{seg.start.toFixed(1)}s-{seg.end.toFixed(1)}s]
                    </span>{" "}
                    {seg.text}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="self-end mt-1"
          >
            Nouveau
          </Button>
        </div>
      )}
    </div>
  );
}
