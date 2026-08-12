import { useEffect, useRef, useState } from "react";

interface Props {
  onSend: (file: File) => Promise<void>;
  onClose: () => void;
}

type FacingMode = "user" | "environment";

export function CameraCapture({ onSend, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedBlobRef = useRef<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [canFlip, setCanFlip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera(mode: FacingMode) {
    stopStream();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => setCanFlip(devices.filter((d) => d.kind === "videoinput").length > 1))
        .catch(() => {});
    } catch {
      setError("Camera access is off — enable it in your browser settings to take a photo.");
    }
  }

  useEffect(() => {
    startCamera(facingMode);
    // Release the camera if the user navigates away mid-flow — without this the stream
    // (and the browser's recording indicator) would keep running in the background.
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flipCamera() {
    const next: FacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror the capture to match the mirrored front-camera preview the user just saw.
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        capturedBlobRef.current = blob;
        setCapturedUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.85,
    );
  }

  function retake() {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    capturedBlobRef.current = null;
  }

  async function send() {
    if (!capturedBlobRef.current) return;
    setSending(true);
    try {
      await onSend(new File([capturedBlobRef.current], "photo.jpg", { type: "image/jpeg" }));
      close();
    } finally {
      setSending(false);
    }
  }

  function close() {
    stopStream();
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <canvas ref={canvasRef} className="hidden" />
      <button
        type="button"
        onClick={close}
        title="Close"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-xl text-white hover:bg-black/60"
      >
        ✕
      </button>

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center text-white">
          <p>{error}</p>
          <button
            type="button"
            onClick={close}
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30"
          >
            Close
          </button>
        </div>
      ) : capturedUrl ? (
        <>
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <img src={capturedUrl} alt="Captured" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex items-center justify-center gap-6 pb-8 pt-4">
            <button
              type="button"
              onClick={retake}
              disabled={sending}
              className="rounded-full bg-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/30 disabled:opacity-50"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
            />
          </div>
          <div className="flex items-center justify-center gap-8 pb-8 pt-4">
            {canFlip && (
              <button
                type="button"
                onClick={flipCamera}
                title="Flip camera"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-xl text-white hover:bg-white/30"
              >
                🔄
              </button>
            )}
            <button
              type="button"
              onClick={capture}
              title="Take photo"
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 hover:bg-white/30"
            >
              <span className="h-12 w-12 rounded-full bg-white" />
            </button>
            {canFlip && <span className="h-12 w-12" />}
          </div>
        </>
      )}
    </div>
  );
}
