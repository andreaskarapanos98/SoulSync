import { useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 300;

function touchDistance(touches: React.TouchList): number {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const lastTapAt = useRef(0);

  function toggleZoom() {
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(DOUBLE_TAP_ZOOM);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchStartDist.current = touchDistance(e.touches);
      pinchStartScale.current = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapAt.current < DOUBLE_TAP_MS) {
        lastTapAt.current = 0;
        toggleZoom();
      } else {
        lastTapAt.current = now;
      }
      if (scale > 1) {
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: translate.x, ty: translate.y };
      }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchStartDist.current) {
      const next = (pinchStartScale.current * touchDistance(e.touches)) / pinchStartDist.current;
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)));
    } else if (e.touches.length === 1 && panStart.current) {
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setTranslate({ x: panStart.current.tx + dx, y: panStart.current.ty + dy });
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinchStartDist.current = null;
    if (e.touches.length === 0) {
      panStart.current = null;
      if (scale <= 1) setTranslate({ x: 0, y: 0 });
    }
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale - e.deltaY * 0.01));
    setScale(next);
    if (next <= 1) setTranslate({ x: 0, y: 0 });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/90"
      style={{ touchAction: "none" }}
      onClick={() => scale === 1 && onClose()}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-xl text-white"
      >
        ✕
      </button>
      <img
        src={src}
        alt=""
        draggable={false}
        className={`max-h-full max-w-full select-none object-contain ${scale === 1 ? "cursor-zoom-in" : "cursor-grab"}`}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transition: pinchStartDist.current || panStart.current ? "none" : "transform 150ms ease-out",
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (scale === 1) toggleZoom();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          toggleZoom();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      />
    </div>
  );
}
