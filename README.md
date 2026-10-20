# 3ndsofth33arth

A live portfolio and tattoo inquiry platform for **Esther Ko**, built in collaboration with **Joseph Tran**. It brings Esther’s tattoo work, writing, and mixed-media projects together and turns booking requests into organized email conversations.

**[View the portfolio](https://www.3ndsofth33arth.com/home)** · **[View the booking experience](https://www.3ndsofth33arth.com/booking)**

## My contribution

I translated Esther’s visual direction and mockups into a responsive web application, built the booking and worldwide waitlist workflows, integrated email delivery and Instagram media, and shipped the site through GitHub and Vercel on a custom domain.

The project evolved through direct feedback from Esther: refining image presentation, making navigation consistent, simplifying the mobile booking experience, and improving how inquiries arrive in her inbox. It is a working site for an artist’s practice, with ongoing changes driven by how she and her clients use it.

## What’s shipped

- **Portfolio:** an Apoptosis collection showcase, artwork details, a complete-book link, artist biography, contact page, and Instagram-powered Ink gallery.
- **Booking inquiries:** a mobile-friendly form for design ideas, placement, size, budget, availability, Instagram handle, and up to 10 reference photos.
- **Worldwide waitlist:** a separate form collecting city, country, and contact details so Esther can gauge interest in future visits. Emails include `WORLDWIDE WAITLIST` and the location in the subject for easy inbox filtering.
- **Email delivery:** structured artist notifications and customer confirmations through Resend, with a shared HTML layout and plain-text alternatives.
- **Instagram token renewal:** a scheduled server-side workflow with private token storage, reducing the need for manual token updates.
- **Production deployment:** a custom domain on Vercel, with updates published from GitHub.

The site opens directly to the portfolio. The original landing page is preserved in the code for future use. The Works page currently displays “Coming soon.” Booking (`/booking`) and the worldwide waitlist (`/waitlist`) use separate shareable, noindex routes with no links from the public navigation or between the forms. They are unlisted, not authenticated or private pages.

## Engineering decisions

| Decision | Purpose |
| --- | --- |
| Next.js 16 App Router, React 19, and TypeScript | Keep portfolio pages, interactive forms, and server endpoints in one application. |
| Tailwind CSS 4, CSS modules, and custom components | Implement Esther’s supplied visual direction without a component-library dependency. |
| Typed content and local artwork assets | Keep portfolio content and media changes reviewable in version control. |
| Browser-side image preparation plus server-side validation | Support reference photos from phones while bounding request sizes and rejecting invalid uploads. |
| Resend with server-only credentials | Deliver requests and attachments to Esther’s inbox without exposing the email API key. |
| Private Vercel Blob storage and a scheduled renewal endpoint | Persist refreshed Instagram tokens across deployments. |
| Email-based booking and waitlist workflows | Fit the artist’s existing workflow without introducing an admin dashboard or booking database. |

## From form to inbox

A booking submission goes to `POST /api/booking`. The browser prepares reference photos; the server validates the request and decodes and re-encodes accepted images as metadata-free JPEGs before attaching them to the artist’s email. A separate email confirms receipt to the client.

The endpoint includes matching-origin checks, a honeypot, a bounded 4 MiB request reader, timeouts, and email idempotency keys. Unsupported image types, invalid image contents, and excessive pixel dimensions are rejected. If the artist’s email is accepted but the client confirmation fails, the form still reports success to avoid encouraging duplicate inquiries.

The worldwide waitlist uses `POST /api/waitlist`, validates contact and location fields, and requires age and contact consent. Both workflows send to the configured artist inbox. Submitted content is escaped before being placed in the shared HTML email template.

These are **inquiry and interest workflows**, not instant reservations. Appointments, travel plans, and deposits are handled outside the application. Waitlist signup does not guarantee a visit or appointment, and requests are managed through email rather than an application database.

## Keeping the gallery connected

A Vercel cron calls `/api/cron/instagram` daily at 10:00 UTC. The endpoint is protected by a server-only secret and refreshes an eligible Instagram token when 30 days or less remain. Refreshed credentials are saved in private Blob storage; conditional writes protect against concurrent updates. Tokens refreshed within the last 24 hours are skipped.

Expired or revoked tokens still require new authorization. Renewal failures are logged without exposing credentials; email alerts are not implemented.

## Validation and practical limits

The automated suite covers image resizing, corrupt and spoofed uploads, metadata removal, request limits, origin checks, waitlist validation, mocked email delivery and failure cases, and HTML escaping. ESLint and a production build provide additional checks. Browser checks cover responsive layouts and form interactions.

Automated email tests mock the provider; they do not prove real inbox delivery. The application also does not yet have shared submission rate limiting, persistent inquiry tracking, or a strict script Content Security Policy. These are areas for further hardening as usage grows.

## Working on the project

Built with Node.js 22+ and the pnpm version pinned in `package.json`.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

`pnpm test`, `pnpm lint`, and `pnpm build` run the main verification checks. Local development uses Turbopack; the default production build uses webpack to accommodate the managed development environment.

`.env.example` documents the server-only email, Instagram, and storage configuration. Email delivery requires a Resend key and a verified sender; `BOOKING_TO_EMAIL` controls the recipient for both booking and waitlist requests. Production token renewal uses a private Blob store and `CRON_SECRET`. Credentials belong in local or hosting environment settings, never in source control.

---

**Creative direction and artwork:** Esther Ko

**Web development and deployment:** Joseph Tran
