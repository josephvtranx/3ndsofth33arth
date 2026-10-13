import { ARTIST_EMAIL } from "@/lib/site";
import { validateWaitlist } from "@/lib/waitlist";
import { BookingRequestError, readBookingForm, validateRequestHeaders } from "../booking/request";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
const reply = (body: object, status = 200) => Response.json(body, { status, headers });

export async function POST(request: Request) {
  let form: FormData;
  try {
    validateRequestHeaders(request);
    form = await readBookingForm(request);
  } catch (error) {
    return reply({ error: error instanceof BookingRequestError ? error.message : "please try again." }, error instanceof BookingRequestError ? error.status : 400);
  }
  if (String(form.get("website") ?? "").trim()) return reply({ success: true });
  const { fields, errors, ok } = validateWaitlist(form);
  if (!ok) return reply({ error: "please check the highlighted fields.", fieldErrors: errors }, 400);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_FROM_EMAIL;
  const to = process.env.BOOKING_TO_EMAIL || ARTIST_EMAIL;
  if (!apiKey || !from) return reply({ error: "the waitlist is temporarily unavailable. please try again later." }, 503);
  const send = (body: object, suffix: string) => fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `waitlist-${fields.submissionId}-${suffix}` },
    body: JSON.stringify({ from, ...body }), signal: AbortSignal.timeout(15000),
  });
  try {
    const result = await send({ to: [to], reply_to: fields.email,
      subject: `WORLDWIDE WAITLIST — ${fields.city}, ${fields.country} — ${fields.name}`,
      text: ["WORLDWIDE WAITLIST", "", `name: ${fields.name}`, `email: ${fields.email}`, `city: ${fields.city}`, `country: ${fields.country}`, `instagram: ${fields.instagram}`, "", "18+ confirmed. Agreed to be contacted about visits to their city.", "This is an expression of interest, not a confirmed appointment."].join("\n"),
    }, "artist");
    if (!result.ok) throw new Error("Delivery failed");
  } catch {
    return reply({ error: "your waitlist request could not be sent. please try again." }, 502);
  }
  let confirmationSent = false;
  try {
    const result = await send({ to: [fields.email], reply_to: to,
      subject: "your 3ndsofth33arth worldwide waitlist request",
      text: `hi ${fields.name},\n\nyou’re on the worldwide waitlist for ${fields.city}, ${fields.country}. esther may contact you via instagram dm or email if she plans a visit.\n\nthis is not a confirmed appointment or a promise of travel. to update your city or leave the list, reply to this email.`,
    }, "confirmation");
    confirmationSent = result.ok;
  } catch { /* The artist already received the request; avoid duplicate submissions. */ }
  return reply({ success: true, confirmationSent });
}
