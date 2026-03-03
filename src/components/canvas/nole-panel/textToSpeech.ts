import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

const client = new ElevenLabsClient({
  apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
});

/**
 * Convert text to speech using ElevenLabs and play the audio in the browser.
 * Returns the HTMLAudioElement so playback can be stopped externally.
 */
export async function playTextToSpeech(
  text: string,
  options?: { onStart?: () => void; onEnd?: () => void },
): Promise<HTMLAudioElement> {
  const response = await client.textToSpeech.convert(VOICE_ID, {
    text,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
    voiceSettings: {
      speed: 1.15,
      stability: 0.3,
    },
  });

  // Collect the ReadableStream into a Blob
  const reader = response.getReader();
  const chunks: ArrayBuffer[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value.buffer as ArrayBuffer);
  }
  const blob = new Blob(chunks, { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);

  const audio = new Audio(url);
  audio.addEventListener("ended", () => {
    URL.revokeObjectURL(url);
    options?.onEnd?.();
  });
  options?.onStart?.();
  await audio.play();
  return audio;
}

/**
 * Stop a currently playing audio element and clean up.
 */
export function stopAudio(audio: HTMLAudioElement): void {
  audio.pause();
  audio.currentTime = 0;
  audio.dispatchEvent(new Event("ended"));
}
