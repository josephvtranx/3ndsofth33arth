import { Buffer } from "node:buffer";
import { ARTIST_EMAIL } from "@/lib/site";
import { formatBookingInquiry, validateBookingForm } from "@/lib/booking";

export const runtime = "nodejs";

function jsonError(error: string, status: number, fieldErrors?: Record<string, string>) {
  return Response.json({ success: false, error, fieldErrors }, { status });
}

function safeFilename(filename: string, index: number) {
  const cleaned = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100);
  return cleaned || `reference-${index + 1}.jpg`;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return jsonError("this submission could not be verified.", 403);
      }
    } catch {
      return jsonError("this submission could not be verified.", 403);
    }
  }

  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return jsonError("invalid form submission.", 415);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("the form could not be read. please try again.", 400);
  }

  // Quietly accept bot submissions that fill the hidden honeypot field.
  if (String(formData.get("website") ?? "").trim()) {
    return Response.json({ success: true });
  }

  const validation = validateBookingForm(formData);
  if (!validation.ok) {
    return jsonError("please check the highlighted information and try again.", 400, validation.fieldErrors);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_FROM_EMAIL;
  const to = process.env.BOOKING_TO_EMAIL || ARTIST_EMAIL;

  if (!apiKey || !from) {
    console.error(JSON.stringify({ event: "booking_email_not_configured" }));
    return jsonError("online booking is temporarily unavailable. please email esther directly.", 503);
  }

  const { inquiry, images } = validation;
  const subjectName = inquiry.name.replace(/[\r\n]+/g, " ");
  const attachments = await Promise.all(
    images.map(async (image, index) => ({
      filename: safeFilename(image.name, index),
      content: Buffer.from(await image.arrayBuffer()).toString("base64"),
    })),
  );

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${inquiry.submissionId}-artist`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: inquiry.email,
        subject: `booking inquiry — ${inquiry.workType} — ${subjectName}`,
        text: formatBookingInquiry(inquiry, attachments.map((attachment) => attachment.filename)),
        attachments,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "booking_email_request_failed", error: String(error) }));
    return jsonError("your inquiry could not be sent right now. please try again or email esther directly.", 502);
  }

  if (!response.ok) {
    console.error(
      JSON.stringify({
        event: "booking_email_failed",
        status: response.status,
        providerResponse: (await response.text()).slice(0, 1_000),
      }),
    );
    return jsonError("your inquiry could not be sent right now. please try again or email esther directly.", 502);
  }

  // A failed confirmation should never make a successfully delivered inquiry look unsuccessful.
  let confirmationSent = false;
  try {
    const confirmation = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${inquiry.submissionId}-confirmation`,
      },
      body: JSON.stringify({
        from,
        to: [inquiry.email],
        reply_to: to,
        subject: "your 3ndsofth33arth booking inquiry",
        text: [
          `hi ${inquiry.name},`,
          "",
          "your tattoo inquiry made it to esther's inbox. she replies in order, usually within a couple business days.",
          "",
          `work type: ${inquiry.workType}`,
          `placement: ${inquiry.placement}`,
          `size: ${inquiry.size}`,
          `design: ${inquiry.design}`,
          "",
          "please don't send a follow-up while you wait; it can prolong your spot in the waitlist.",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    confirmationSent = confirmation.ok;
    if (!confirmation.ok) {
      console.warn(JSON.stringify({ event: "booking_confirmation_failed", status: confirmation.status }));
    }
  } catch (error) {
    console.warn(JSON.stringify({ event: "booking_confirmation_request_failed", error: String(error) }));
  }

  return Response.json({ success: true, confirmationSent });
}
