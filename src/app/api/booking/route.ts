import { renderEmail } from "@/lib/email-template";
import { ARTIST_EMAIL } from "@/lib/site";
import { formatBookingInquiry, validateBookingForm } from "@/lib/booking";
import { prepareEmailAttachments, type EmailAttachment } from "./images";
import { BookingRequestError, readBookingForm, validateRequestHeaders } from "./request";

export const runtime = "nodejs";

function jsonError(error: string, status: number, fieldErrors?: Record<string, string>) {
  return Response.json({ success: false, error, fieldErrors }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    validateRequestHeaders(request);
    formData = await readBookingForm(request);
  } catch (error) {
    if (error instanceof BookingRequestError) return jsonError(error.message, error.status);
    return jsonError("the form could not be read. please try again.", 400);
  }

  // Quietly accept bot submissions that fill the hidden honeypot field.
  if (String(formData.get("website") ?? "").trim()) {
    return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
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
  let attachments: EmailAttachment[];
  try {
    attachments = await prepareEmailAttachments(images);
  } catch {
    return jsonError("please check your reference photos and try again.", 400, {
      images: "one or more photos could not be verified. please choose still JPG, PNG, or WebP images.",
    });
  }

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
        html: renderEmail({
          eyebrow: "BOOKING INQUIRY", title: "A new inquiry.",
          paragraphs: [`${inquiry.name} has submitted a tattoo inquiry.`],
          details: [["NAME", inquiry.name], ["EMAIL", inquiry.email], ["INSTAGRAM", inquiry.instagram], ["PLACEMENT", inquiry.placement], ["SIZE", inquiry.size], ["DESIGN TYPE", inquiry.designType], ["DESIGN", inquiry.design], ["BUDGET", inquiry.budget], ["AVAILABILITY", inquiry.availability], ["REFERENCE PHOTOS", attachments.length ? `${attachments.length} attached to this email` : "None attached"]],
          note: "This is an inquiry, not a confirmed appointment.",
        }),
        text: formatBookingInquiry(inquiry, attachments.map((attachment) => attachment.filename)),
        attachments,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    console.error(JSON.stringify({ event: "booking_email_request_failed" }));
    return jsonError("your inquiry could not be sent right now. please try again or email esther directly.", 502);
  }

  if (!response.ok) {
    console.error(
      JSON.stringify({
        event: "booking_email_failed",
        status: response.status,
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
        html: renderEmail({
          eyebrow: "BOOKING INQUIRY RECEIVED", title: "Your idea is in my inbox.",
          paragraphs: [`hi ${inquiry.name},`, "your tattoo inquiry made it to esther’s inbox. she will get back to you via instagram dm."],
          details: [["INSTAGRAM", inquiry.instagram], ["PLACEMENT", inquiry.placement], ["SIZE", inquiry.size], ["DESIGN", inquiry.design]],
          note: "please don’t send a follow-up while you wait; it can prolong your spot in the waitlist.",
        }),
        text: [
          `hi ${inquiry.name},`,
          "",
          "your tattoo inquiry made it to esther's inbox. she will get back to you via instagram dm.",
          "",
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
  } catch {
    console.warn(JSON.stringify({ event: "booking_confirmation_request_failed" }));
  }

  return Response.json({ success: true, confirmationSent }, { headers: { "Cache-Control": "no-store" } });
}
