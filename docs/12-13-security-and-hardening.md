# Part 12 — Security & Reliability Notes

## Prompt Injection from User Content

User-supplied fields (businessName, about, services, etc.) are passed to Claude's prompt.
Mitigations:
- All strings are sanitized (HTML stripped, trimmed) at the Zod validation layer
- Claude's system prompt is explicit: "output ONLY JSON, no code, no HTML"
- Claude's output is validated against a strict Zod schema — anything unexpected is rejected
- Content fields are length-bounded to prevent prompt stuffing
- The `containsUnsafeContent()` validator catches script injection, event handlers, eval(), etc.

## Malicious Uploads

- File uploads are validated by MIME type (only image/* types allowed)
- File size is capped at 10MB per upload, max 10 images per request
- Files are stored in S3 with randomized keys — never executed server-side
- In production, add: virus scanning, image reprocessing (strip EXIF/metadata), CDN-only serving

## Invalid Claude Output

- All Claude output passes through `GeneratedContentSchema` (Zod discriminated union)
- Section types are checked against an explicit allowlist
- Text fields are scanned for code injection patterns
- Color values must match exact hex regex
- Font names must come from the template's allowed list
- Retry logic: up to 3 attempts for transient failures; validation errors fail fast

## Failed Deployment Retries

- V1: no automatic retry. If deployment fails, status is set to FAILED with error message.
- The client can re-trigger via POST /deploy (allowed when status is FAILED).
- Post-V1: implement dead-letter queue and alerting for repeated failures.

## Abuse Prevention

- Auth required on all endpoints (x-user-id header; replace with real auth in production)
- Rate limiting should be added at the API gateway level (Vercel edge middleware or similar)
- Suggested limits: 5 site requests/hour, 2 generations/hour, 10 uploads/hour per user
- Monitor Claude API spend per user

## Rate Limits

- Anthropic API: respect rate limits with exponential backoff (already in retry logic)
- Vercel API: file uploads are parallelized but individual failures don't block others
- Database: connection pooling via Prisma; use PgBouncer in production

## Safe Logging

- The logger redacts sensitive fields (apiKey, token, password, secret, authorization)
- Error messages from Claude output are truncated before logging
- User PII (email, phone) is not logged in production — only request IDs

## API Key Handling

- All secrets loaded from environment variables, validated at startup
- Never passed in request bodies or query strings
- Never logged (redacted by logger)
- Use Vercel encrypted environment variables in production


# Part 13 — Production Hardening After V1

Priority order for post-MVP improvements:

1. **Real authentication** — Replace x-user-id header with proper auth (NextAuth.js, Clerk, etc.)

2. **Job queue** — Move generation and deployment to BullMQ/Inngest/Trigger.dev workers
   instead of fire-and-forget async calls

3. **S3 integration** — Complete the upload service with real presigned URLs and image processing

4. **Retry with backoff** — Automatic retry for failed deployments with exponential backoff
   and dead-letter queue

5. **Rate limiting** — Per-user rate limits on generation, deployment, and upload endpoints

6. **Monitoring & alerting** — Track generation success rate, deployment time, Claude API
   latency, and error rates (Sentry, Datadog, etc.)

7. **Template improvements** — Add more verticals, improve responsive design, add dark mode
   option, support gallery sections for photographer vertical

8. **Revision support** — Allow users to re-generate with adjusted brief (new generation,
   new deployment)

9. **Custom domain automation** — Full Vercel domain API integration with automatic
   verification polling and user notification

10. **Analytics** — Basic site analytics for generated sites (pageviews, contact form submissions)

11. **Form handling** — Actual contact form backend for generated sites (email forwarding,
    webhook, or managed form service)

12. **CDN for assets** — Serve uploaded images through CDN with automatic resizing/optimization

13. **A/B template testing** — Generate 2 variations and let user pick, tracking which
    performs better

14. **Billing** — Stripe integration for paid tiers (free preview, paid custom domain, etc.)

15. **SEO** — Auto-generate sitemap.xml, robots.txt, and structured data (LocalBusiness schema)
    for generated sites
