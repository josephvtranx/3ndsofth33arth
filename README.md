# 3ndsofth33arth

A portfolio and tattoo-booking platform built around an artist's real creative
practice. A collaboration between **Esther Ko** and **Joseph Tran**.

[Visit the site](https://3ndsofth33arth.com)

## Why I Built It

The goal was to give Esther's tattoo work, writing, and mixed-media projects a
shared home—and give prospective clients a clear way to start a booking inquiry.
I translated the design into a working web application, connected the inquiry
flow to email, and deployed it with a custom domain while preserving the site's
visual identity.

## What's Built

- Responsive portfolio with a tattoo gallery, artist biography, and project views.
- Apoptosis collection with individual artworks and a link to the complete book.
- Tattoo inquiries covering design, placement, size, budget, and availability.
- Up to 10 reference photos, with browser-side resizing for larger uploads.
- Server-validated inquiries sent through Resend, plus client confirmation emails.
- Homepage-based social sharing preview and deployment on Vercel.

## Stack & Decisions

| Choice | Why |
| --- | --- |
| Next.js 16 App Router, React 19, TypeScript | Keep the portfolio, interactive UI, and server-side booking endpoint in one application. |
| Tailwind CSS 4 and custom components | Implement the supplied visual direction without introducing a component-library dependency. |
| Typed project content and local media | Keep project layouts consistent and content version-controlled. Updates currently require a code change; there is no CMS. |
| Resend with a server-only API key | Deliver inquiries and reference photos to an inbox without exposing credentials to the browser. |
| Browser-side image preparation | Fit larger reference photos into a bounded upload payload without changing the client's originals. |
| Vercel with GitHub deployment | Publish updates through the repository and serve the site on its custom domain. |

## Booking Architecture

The browser prepares photos and submits the form to `POST /api/booking`.
The server validates fields and attachment limits, then decodes and re-encodes
photos as metadata-free JPEGs before sending the inquiry through Resend. It
then attempts a separate confirmation email to the client.

The endpoint requires a matching origin and includes a honeypot, a bounded
4 MiB request reader, upload/provider timeouts, and idempotency keys. Invalid
image contents, unsupported types, and oversized pixel dimensions are rejected.
If the confirmation email fails after the inquiry is accepted, the form still
reports the inquiry as successful.

Response headers block framing and content-type sniffing and limit referrer
disclosure. The baseline Content Security Policy restricts framing, plugins,
base URLs, and native form destinations; a strict script policy and shared
submission rate limits are not yet implemented.

This is an **inquiry workflow**, not an instant reservation system. Scheduling
and deposits are handled outside the app. There is no application database or
upload store; submitted details and photos are sent through email. Persistent
inquiry tracking and stronger abuse controls remain future improvements.

## Local Development

Use Node.js 22+ and the pnpm version pinned in `package.json`.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Configure the following private
variables in `.env.local` to enable email sending; never commit credentials.

<!-- AUTO-GENERATED: environment reference from .env.example and booking route -->

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Required for sending email through Resend. |
| `BOOKING_FROM_EMAIL` | Required sender address on a verified domain, optionally formatted as `Name <address>`. |
| `BOOKING_TO_EMAIL` | Inquiry recipient; defaults to the artist email in `src/lib/site.ts` if omitted. |

<!-- END AUTO-GENERATED -->

## Verification

<!-- AUTO-GENERATED: command reference from package.json -->

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start local development with Turbopack. |
| `pnpm lint` | Run ESLint. |
| `pnpm test` | Run image preparation, upload security, request validation, and mocked email-flow tests. |
| `pnpm build` | Create a production build using webpack. |
| `pnpm build:turbopack` | Run the alternative Turbopack production build. |
| `pnpm start` | Serve a completed production build locally. |

<!-- END AUTO-GENERATED -->

Production builds use webpack because Turbopack's CSS worker cannot bind its
temporary port in the managed development environment. Tests cover resizing,
corrupt and spoofed images, metadata removal, upload limits, origin checks, and
mocked email failure states; they do not verify live email delivery.
