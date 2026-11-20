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

Automated email tests mock the provider; they do not prove real inbox delivery. The application does not yet have persistent inquiry tracking or a strict script Content Security Policy. These are areas for further hardening as usage grows.

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

## Form protection setup

Before deploying the form protection changes, configure Cloudflare Turnstile and Upstash Redis. Production fails closed if protection settings are missing or either provider is unavailable; local development skips protection unless `SPAM_PROTECTION_ENABLED=true`.

1. Create a managed Turnstile widget for `www.3ndsofth33arth.com` and `3ndsofth33arth.com`. Put its public site key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and its secret in `TURNSTILE_SECRET_KEY`.
2. Set `TURNSTILE_ALLOWED_HOSTNAMES` to those same comma-separated hostnames. The server checks both the verified hostname and the form action.
3. Create an Upstash Redis database and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` using its REST credentials.
4. Generate a separate random secret of at least 32 bytes for `FORM_RATE_LIMIT_SECRET`. IP addresses are HMAC-hashed before becoming counter keys; raw IP addresses are not stored in Redis.
5. Add these variables to Vercel Production before deployment. The public site key is baked into the client build, so redeploy after setting it. Use separate test credentials and hostnames for previews.

Both forms share an atomic limit of five attempts per IP per hour, counted after field validation and a token is supplied, before token verification or email delivery. Requests over the limit return 429 with `Retry-After`. The counter expires one hour after the first attempt. Shared networks share the allowance; distributed spam still requires provider monitoring. The IP header is trusted only when running behind Vercel's proxy. Other hosts use a shared local bucket until a trusted proxy integration is added.

Turnstile tokens are verified server-side and the widget refreshes after each submission attempt. Invalid or reused tokens cannot trigger email delivery. The limit and bot check complement the existing honeypot and upload validation.

### Browser tests

Run `pnpm test:browser` with Chrome installed. The suite starts its own local server on port 3101 and uses an isolated build directory. It checks both form flows at phone and desktop sizes, required fields, upload/remove behavior, error recovery, verification reset, successful submission, unlisted routes, and public page navigation. Form requests and Turnstile are intercepted; no real inquiry emails are sent. The service tests in `pnpm test` mock provider responses to verify limits, failures, hostname/action checks, and blocked email delivery.

Provider setup references: [Turnstile verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) and [Upstash REST API](https://upstash.com/docs/redis/features/restapi).

## Private waitlist map

`/map` is the real dashboard. The standalone HTML draft remains sample-only.
The dashboard and both data endpoints require a server-verified PIN session. PINs
are salted with scrypt; only the hash is stored in configuration. Sessions are
hashed in PostgreSQL, expire after 12 hours, and are invalidated by PIN rotation.
Sign-in has persistent per-IP and global attempt limits. The map keeps the approved
city → searchable names → contact-details expansions. The Resolve button removes
a person from active names, city counts, and map circles while retaining their
record and import history with a `resolved_at` timestamp. The Resolved tab lists
these people with search, city and resolution date, and a Restore to waitlist
action that returns them to active names and map counts. Historical imports do
not restore resolved entries; a new form signup can rejoin the waitlist. Unknown city coordinates
appear in the list but are not guessed on the map.

### Enable the integration

1. Configure a PostgreSQL database with a server-only `WAITLIST_DATABASE_URL`.
   Use the provider's TLS connection URL. This integration does not provision a
   database or change the production deployment automatically.
2. Run `pnpm waitlist:migrate` (additive schema creation).
3. Run `pnpm waitlist:set-pin` in an interactive terminal. Choose an 4–12 digit
   PIN; the command writes only its hash to `.env.local`. Configure that same
   `WAITLIST_ADMIN_PIN_HASH` in Vercel for production.
4. Seed the public city catalog before enabling the form: download `cities500.zip`,
   `admin1CodesASCII.txt`, and `countryInfo.txt` from https://download.geonames.org/export/dump/;
   unzip `cities500.zip` and run `pnpm waitlist:locations /path/to/files`.
   Set `WAITLIST_STORAGE_ENABLED=true`. Location search and server validation require
   the seeded database even when email-only capture is configured.
5. For historical import, set `RESEND_IMPORT_API_KEY` to a key with permission to
   read sent emails. The existing send-only key can stay restricted.
6. Run `pnpm waitlist:import` to preview counts, then
   `pnpm waitlist:import --apply` to save matching artist notifications. This reads
   Resend directly, never Gmail. It filters by `BOOKING_TO_EMAIL` and subject,
   paginates, skips malformed or missing plain-text bodies, and prints aggregate
   counts rather than contact details. Resend's retention limits historical coverage.
7. Run `pnpm waitlist:cleanup` to review historical city normalization, then
   `pnpm waitlist:cleanup --apply`. The command backs up affected data privately in
   PostgreSQL before merging, preserves email-source links, and uses reviewed
   GeoNames IDs. Ambiguous states and multi-city entries stay unpinned.
8. Test `/map`, then configure these variables in the hosting environment and deploy.

New form submissions are saved before email delivery when storage is enabled.
A database failure returns an error without sending email. Once saved, an email
failure does not lose the signup or tell the visitor to resubmit. The
`artist_email_sent` field records notification status; automated email retries
are not yet implemented. Visitors must select a city from the searchable catalog;
the server resolves its ID to canonical labels and coordinates before saving.

Retries are keyed by form submission ID or Resend message ID. A person's email
and canonical city are unique, so retries do not inflate city counts. The earliest
signup date is retained. Reviewed historical aliases resolve to the same city.
New unknown aliases from historical emails still require cleanup/review.

The map currently uses MapLibre demo basemap tiles, suitable for the local preview;
select a production tile provider before public deployment. No credentials or
waitlist contacts are included in the basemap requests. City search runs against
the local database and sends no contact data to a geocoding provider. The GeoNames
catalog is licensed under CC BY 4.0 (https://www.geonames.org/); attribution appears
in the picker. Catalog coverage includes cities over 500 people and administrative
seats; visitors can select a nearby city for smaller places.

Verification includes embedded PostgreSQL tests for persistence/deduplication,
PIN hashing, session expiration/revocation, attempt limits, and signed-out API
access. Real database connectivity, Resend import coverage, and production
geocoding must be verified after configuration. Periodically remove expired
`waitlist_sessions` and `waitlist_login_limits` rows as operational maintenance.
