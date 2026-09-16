<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project guidance

## Product

3ndsofth33arth is a collaborative portfolio and tattoo-booking platform for
Esther Ko and Joseph Tran. Preserve Esther's creative direction while keeping
the booking experience clear, accessible, and dependable.

## Engineering conventions

- Use TypeScript and the Next.js App Router.
- Use Turbopack for local development. The default production script uses the
  supported webpack fallback because Turbopack's CSS worker cannot bind its
  temporary port in the current managed environment.
- Prefer Server Components. Add `"use client"` only when browser state,
  effects, or event handlers require it.
- Keep public portfolio content separate from private booking data.
- Use semantic HTML, visible focus states, keyboard-friendly interactions,
  descriptive alternative text, and reduced-motion support.
- Use `next/image` for portfolio media when practical and always provide image
  dimensions or a stable aspect ratio.
- Keep components focused and colocate route-specific code with its route.
- Validate untrusted input on the server. Never expose private environment
  variables or service credentials to client components.
- Do not add dependencies without a concrete requirement.

## Verification

Before considering a change complete, run:

```bash
pnpm lint
pnpm build
```

Add focused tests when introducing application logic or critical user flows.
