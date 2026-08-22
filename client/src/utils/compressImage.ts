// Phone camera photos are routinely 3-8 MB, and chat was uploading them byte-for-byte —
// the dominant cost of sending a picture on mobile data. Downscaling to something a
// chat bubble can actually display and re-encoding as JPEG typically cuts that by 10x
// or more, which is the difference between a multi-second wait and a near-instant send.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
// Below this, re-encoding costs more (in CPU and in quality) than the bytes it saves.
const SKIP_BELOW_BYTES = 300 * 1024;

export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < SKIP_BELOW_BYTES) return file;

  try {
    // from-image applies the EXIF orientation, so portrait photos don't upload sideways
    // once the canvas strips that metadata.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    // An already-optimised image can come out bigger after re-encoding — keep the original.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    // Anything unsupported (exotic format, no canvas) just uploads as-is.
    return file;
  }
}
