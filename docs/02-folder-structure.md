# Part 2 — Folder Structure

```
simplersite/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── site-requests/
│   │       │   ├── route.ts                          # POST /api/site-requests
│   │       │   └── [id]/
│   │       │       ├── route.ts                      # GET  /api/site-requests/[id]
│   │       │       ├── generate/
│   │       │       │   └── route.ts                  # POST /api/site-requests/[id]/generate
│   │       │       ├── status/
│   │       │       │   └── route.ts                  # GET  /api/site-requests/[id]/status
│   │       │       └── deploy/
│   │       │           └── route.ts                  # POST /api/site-requests/[id]/deploy
│   │       ├── uploads/
│   │       │   └── route.ts                          # POST /api/uploads
│   │       └── domains/
│   │           └── connect/
│   │               └── route.ts                      # POST /api/domains/connect
│   ├── lib/
│   │   ├── prisma.ts                                 # Prisma client singleton
│   │   ├── env.ts                                    # Environment variable validation
│   │   └── logger.ts                                 # Safe structured logger
│   ├── types/
│   │   ├── site-request.ts                           # Zod schemas for input
│   │   ├── generated-content.ts                      # Zod schemas for Claude output
│   │   ├── template.ts                               # Template config types
│   │   └── deployment.ts                             # Deployment status types
│   ├── services/
│   │   ├── claude.service.ts                         # Claude integration
│   │   ├── template.service.ts                       # Template selection + config
│   │   ├── file-assembly.service.ts                  # Build deployable files in memory
│   │   ├── validation.service.ts                     # Output validation
│   │   ├── vercel-deploy.service.ts                  # Vercel REST API deployment
│   │   ├── generation-pipeline.service.ts            # Orchestrates the full pipeline
│   │   ├── upload.service.ts                         # Asset upload handling
│   │   └── domain.service.ts                         # Domain connection (placeholder)
│   └── templates/
│       ├── base/                                     # Shared template files
│       │   ├── package.json.ts
│       │   ├── tsconfig.json.ts
│       │   ├── next-config.ts
│       │   └── layout.tsx.ts
│       └── verticals/                                # Vertical-specific templates
│           ├── contractor.ts
│           ├── restaurant.ts
│           ├── therapist.ts
│           ├── consultant.ts
│           ├── photographer.ts
│           └── local-service.ts
├── .env.example
├── package.json
├── tsconfig.json
└── next.config.js
```
