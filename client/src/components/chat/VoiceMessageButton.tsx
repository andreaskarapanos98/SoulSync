import { useRef, useState } from "react";

interface Props {
  onSend: (blob: Blob, durationSec: number) => Promise<void>;
}

const MAX_DURATION_SEC = 60;

// Click to start, click again to stop and send immediately (or the ✕ to discard).
export function VoiceMessageButton({ onSend }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sending, setSending] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  function clearTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        setSending(true);
        try {
          await onSend(blob, durationSec);
        } finally {
          setSending(false);
          setElapsed(0);
        }
      };

      startTimeRef.current = Date.now();
      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_DURATION_SEC) stopRecording();
          return next;
        });
      }, 1000);
    } catch {
      // Mic permission denied or unavailable — no-op.
    }
  }

  function stopRecording() {
    clearTimer();
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function cancelRecording() {
    clearTimer();
    if (mediaRecorderRef.current) mediaRecorderRef.current.onstop = null;
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
    setElapsed(0);
  }

  if (recording) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-xs font-medium text-red-500">{elapsed}s</span>
        <button
          type="button"
          onClick={cancelRecording}
          title="Discard"
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={stopRecording}
          title="Stop and send"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
        >
          ⏹
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={sending}
      title="Record a voice message"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
    >
      {sending ? "…" : "🎤"}
    </button>
  );
}
