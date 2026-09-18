// Bound the complete multipart request, including fields and multipart overhead.
// Do not rely on Content-Length: chunked requests can omit it entirely.
export const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

export class BookingRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function validateRequestHeaders(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).origin !== new URL(request.url).origin) {
      throw new Error("origin mismatch");
    }
  } catch {
    throw new BookingRequestError(403, "this submission could not be verified.");
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    throw new BookingRequestError(403, "this submission could not be verified.");
  }
  if (!/^multipart\/form-data\s*;/i.test(request.headers.get("content-type") ?? "")) {
    throw new BookingRequestError(415, "invalid form submission.");
  }
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_REQUEST_BYTES)) {
    throw new BookingRequestError(413, "this submission is too large. please attach smaller photos.");
  }
}

export async function readBookingForm(request: Request): Promise<FormData> {
  const reader = request.body?.getReader();
  if (!reader) throw new BookingRequestError(400, "the form could not be read. please try again.");

  let expired = false;
  const timer = setTimeout(() => {
    expired = true;
    void reader.cancel().catch(() => {});
  }, 10_000);

  try {
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (expired) throw new BookingRequestError(408, "the upload timed out. please try again.");
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        void reader.cancel().catch(() => {});
        throw new BookingRequestError(413, "this submission is too large. please attach smaller photos.");
      }
      chunks.push(new Uint8Array(value));
    }
    return await new Response(new Blob(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
  } catch (error) {
    if (error instanceof BookingRequestError) throw error;
    throw new BookingRequestError(400, "the form could not be read. please try again.");
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
