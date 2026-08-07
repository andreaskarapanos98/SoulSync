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

  if (existingUrl && !recordedUrl) {
    return (
      <div className="voice-recorder">
        <audio controls src={existingUrl} />
        <div className="voice-recorder-actions">
          <button type="button" onClick={startRecording}>
            Re-record
          </button>
          {onDelete && (
            <button type="button" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="voice-recorder">
      <ul className="voice-prompts">
        {PROMPTS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!recordedUrl && (
        <div className="voice-recorder-actions">
          {!recording ? (
            <button type="button" onClick={startRecording}>
              Start recording
            </button>
          ) : (
            <button type="button" onClick={stopRecording}>
              Stop ({MAX_DURATION_SEC - elapsedSec}s left)
            </button>
          )}
        </div>
      )}

      {recordedUrl && (
        <>
          <audio controls src={recordedUrl} />
          <div className="voice-recorder-actions">
            <button type="button" onClick={discardRecording} disabled={saving}>
              Discard
            </button>
            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
