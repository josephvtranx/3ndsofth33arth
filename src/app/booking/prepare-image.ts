// Originals stay on the client's device; only the prepared copy is submitted.
export const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;

export async function prepareBookingImage(file: File, maxBytes: number): Promise<File> {
  if (!file.size) throw new Error(`${file.name} is empty. please choose another photo.`);
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error(`${file.name} is too large. please choose a photo under 20 MB.`);
  }

  let bitmap: ImageBitmap;
  try {
    // Browser decoding applies camera orientation before drawing the image.
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name} could not be opened. please try a JPG, PNG, or WebP photo.`);
  }

  const canvas = document.createElement("canvas");
  try {
    if (file.size <= maxBytes && Math.max(bitmap.width, bitmap.height) <= 2000) return file;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("photos could not be prepared in this browser. please try another browser.");

    // Keep aspect ratio and try higher-quality copies first. The per-photo budget
    // leaves room for all ten images within the server's combined upload limit.
    for (const longestEdge of [2000, 1600, 1280, 1024, 800]) {
      const scale = Math.min(1, longestEdge / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.88, 0.76, 0.64]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size > 0 && blob.size <= maxBytes) {
          const name = `${file.name.replace(/\.[^.]+$/, "") || "reference"}.jpg`;
          return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
        }
      }
    }

    throw new Error(`${file.name} could not be resized enough. please choose a smaller photo.`);
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
