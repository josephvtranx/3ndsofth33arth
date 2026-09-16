# 3ndsofth33arth

A code repository for building a portfolio and tattoo-booking platform around
an artist's real creative practice.

## Overview

3ndsofth33arth is a collaboration between **Esther Ko** and **Joseph Tran**.

This repository documents both the finished product and the reasoning behind
it: how ambiguous creative ideas become product requirements, how the system
is structured, and which tradeoffs shape the implementation.

## What I Am Building

The product combines two experiences that have different user needs:

1. **A creative portfolio** that gives Esther's work enough visual space and
   preserves her artistic identity.
2. **A tattoo-booking experience** that helps prospective clients understand
   her work, prepare the right information, and submit a useful inquiry.

The challenge is to make the booking flow clear and dependable without making
the portfolio feel like a generic service-business website.

## Why I Am Building It

Artists often have to split their presence across social platforms, portfolio
tools, form builders, and direct messages. That fragmentation makes it harder
to control presentation, maintain accurate information, and consistently
collect the details needed from potential clients.

3ndsofth33arth creates one intentional home for the work and the workflow
around it. For me, the project is also an opportunity to demonstrate product
thinking alongside implementation: requirements discovery, interface design,
architecture, integration work, testing, deployment, and iteration with a real
stakeholder.

## Product Requirements

The initial product is expected to support:

- A responsive, image-led portfolio for artwork and selected projects.
- A dedicated tattoo portfolio and information area.
- A structured booking inquiry that gathers actionable client requirements.
- Clear communication of process, policies, availability, and contact options.
- A content workflow that does not require an engineer for routine updates.
- A high-quality experience on both mobile and desktop.

## Engineering Priorities

- **Creative flexibility:** the implementation should support expressive
  layouts without sacrificing usability or maintainability.
- **Content ownership:** Esther should be able to keep important content
  current without editing source code.
- **Accessible interaction:** navigation, media, forms, and feedback should be
  usable with keyboards, assistive technology, and reduced-motion settings.
- **Performance:** image-heavy pages should remain fast on mobile networks.
- **Reliable inquiries:** booking submissions must be validated, protected
  against abuse, and delivered without losing client information.
- **Privacy:** collect only the information needed for the tattoo inquiry and
  define how that information is retained.

## Architecture

The application is initialized with Next.js 16, the App Router, TypeScript,
Tailwind CSS 4, and pnpm. The content-management and booking infrastructure
will be selected after the editing workflow, booking process, integration
needs, and deployment constraints are clarified.

Architecture documentation will cover:

- Application and rendering strategy.
- Content modeling and content-management approach.
- Media storage, optimization, and delivery.
- Booking form validation, persistence, and notifications.
- Authentication and authorization, if an administrative interface is needed.
- Hosting, deployment, observability, backups, and recovery.

## Decision Log

Significant decisions will be recorded here as the project develops.

| Status | Decision | Rationale |
| --- | --- | --- |
| Accepted | Treat the portfolio and booking flow as one product. | Visitors should be able to move from discovering Esther's work to making an inquiry without switching platforms or losing context. |
| Accepted | Separate creative ownership from technical ownership. | Esther retains control of the artistic direction while I remain accountable for feasibility, implementation quality, and system operation. |
| Accepted | Use Next.js with the App Router and TypeScript. | One application can support portfolio rendering, interactive experiences, and server-side booking workflows while maintaining a shared type system. |
| Pending | Choose the content-management approach. | The editing experience must be evaluated with the person who will maintain the content. |
| Pending | Define the booking architecture. | The workflow may require forms, scheduling, notifications, deposits, or manual approval; discovery will determine the correct boundary. |

## Planned Delivery

1. Define users, content, booking rules, and success criteria.
2. Establish the visual system and information architecture with Esther.
3. Select and document the technical architecture.
4. Build the portfolio and content workflow.
5. Implement and secure the tattoo inquiry flow.
6. Test accessibility, responsiveness, performance, and failure states.
7. Deploy, observe real usage, and iterate.

## Current Status

**Frontend integration.** The initial portfolio and booking design has been
ported into the current Next.js application. The booking form is still a
client-side email prototype; persistent submissions, private uploads, content
management, and production integrations remain to be implemented.
