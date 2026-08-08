import { useEffect, useRef, useState } from "react";

const PROMPTS = [
  "Tell us a little about yourself.",
  "What are you passionate about?",
  "What are you looking for in a partner?",
];

const MAX_DURATION_SEC = 30;

interface Props {
  existingUrl?: string | null;
  onSave: (blob: Blob, durationSec: number) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function VoiceRecorder({ existingUrl, onSave, onDelete }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  // Release the mic and any object URL if the component unmounts mid-recording.
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  function stopRecording() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setRecording(true);
      setElapsedSec(0);

      timerRef.current = window.setInterval(() => {
        setElapsedSec((prev) => {
          const next = prev + 1;
          if (next >= MAX_DURATION_SEC) stopRecording();
          return next;
        });
      }, 1000);
    } catch {
      setError("Couldn't access your microphone — check your browser's permission settings.");
    }
  }

  function discardRecording() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setElapsedSec(0);
  }

  async function handleSave() {
    if (!recordedBlob) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(recordedBlob, elapsedSec);
      discardRecording();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  const actionButtonClass =
    "rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900";
  const primaryButtonClass =
    "rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60";

  if (existingUrl && !recordedUrl) {
    return (
      <div className="flex flex-col gap-3">
        <audio controls src={existingUrl} className="w-full" />
        <div className="flex gap-2">
          <button type="button" onClick={startRecording} className={actionButtonClass}>
            Re-record
          </button>
          {onDelete && (
            <button type="button" onClick={onDelete} className={actionButtonClass}>
              Delete
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="list-inside list-disc text-sm text-neutral-600 dark:text-neutral-400">
        {PROMPTS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!recordedUrl && (
        <div className="flex gap-2">
          {!recording ? (
            <button type="button" onClick={startRecording} className={primaryButtonClass}>
              Start recording
            </button>
          ) : (
            <button type="button" onClick={stopRecording} className={primaryButtonClass}>
              Stop ({MAX_DURATION_SEC - elapsedSec}s left)
            </button>
          )}
        </div>
      )}

      {recordedUrl && (
        <>
          <audio controls src={recordedUrl} className="w-full" />
          <div className="flex gap-2">
            <button type="button" onClick={discardRecording} disabled={saving} className={actionButtonClass}>
              Discard
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className={primaryButtonClass}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
