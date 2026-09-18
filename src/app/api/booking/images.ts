import { Buffer } from "node:buffer";
import sharp from "sharp";
import { MAX_BOOKING_IMAGES, MAX_BOOKING_IMAGE_BYTES, MAX_BOOKING_TOTAL_BYTES } from "@/lib/booking";

export type EmailAttachment = { filename: string; content: string };

function imageFormat(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function prepareEmailAttachments(images: File[]): Promise<EmailAttachment[]> {
  if (images.length > MAX_BOOKING_IMAGES || images.reduce((sum, file) => sum + file.size, 0) > MAX_BOOKING_TOTAL_BYTES) {
    throw new Error("invalid attachment limits");
  }
  const attachments: EmailAttachment[] = [];
  const perImageBudget = Math.min(MAX_BOOKING_IMAGE_BYTES, Math.floor(MAX_BOOKING_TOTAL_BYTES / Math.max(images.length, 1)));

  // Decode sequentially to bound memory. Never forward the supplied bytes or
  // filename: re-encoding strips metadata and any trailing non-image payload.
  for (const [index, file] of images.entries()) {
    if (!file.size || file.size > MAX_BOOKING_IMAGE_BYTES) throw new Error("invalid image size");
    const bytes = Buffer.from(await file.arrayBuffer());
    const format = imageFormat(bytes);
    const extension = file.name.split(".").at(-1)?.toLowerCase();
    if (!format || file.type !== `image/${format}` ||
      !(format === "jpeg" ? ["jpg", "jpeg"].includes(extension ?? "") : extension === format)) {
      throw new Error("invalid image type");
    }

    const options = { failOn: "warning" as const, limitInputPixels: 16_000_000 };
    const metadata = await sharp(bytes, options).metadata();
    if (metadata.format !== format || !metadata.width || !metadata.height || (metadata.pages ?? 1) !== 1) {
      throw new Error("invalid or animated image");
    }

    let output: Buffer | undefined;
    for (const size of [2000, 1400, 1000]) {
      const candidate = await sharp(bytes, options)
        .rotate()
        .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 80 })
        .timeout({ seconds: 3 })
        .toBuffer();
      if (candidate.byteLength <= perImageBudget) {
        output = candidate;
        break;
      }
    }
    if (!output) throw new Error("prepared image too large");
    attachments.push({ filename: `reference-${index + 1}.jpg`, content: output.toString("base64") });
  }
  return attachments;
}
