// src/services/domain.service.ts

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

/**
 * Domain connection service — placeholder for V1.
 *
 * The full flow will:
 * 1. User provides their domain
 * 2. We add it to the Vercel project via API
 * 3. We return required DNS records (CNAME/A)
 * 4. User updates their DNS
 * 5. We poll or webhook to verify
 */

export interface DomainConnectionRequest {
  domain: string;
  deploymentId: string;
}

export interface DomainConnectionResult {
  connectionId: string;
  domain: string;
  status: string;
  requiredRecords: DnsRecord[];
}

interface DnsRecord {
  type: "CNAME" | "A" | "AAAA";
  name: string;
  value: string;
}

export async function initiateDomainConnection(
  req: DomainConnectionRequest
): Promise<DomainConnectionResult> {
  const deployment = await prisma.deployment.findUniqueOrThrow({
    where: { id: req.deploymentId },
  });

  // In production: call Vercel API to add domain to project
  // POST /v10/projects/{projectId}/domains
  const requiredRecords: DnsRecord[] = [
    {
      type: "CNAME",
      name: req.domain.startsWith("www.") ? "www" : "@",
      value: "cname.vercel-dns.com",
    },
  ];

  const connection = await prisma.domainConnection.create({
    data: {
      deploymentId: req.deploymentId,
      domain: req.domain,
      status: "PENDING_VERIFICATION",
      requiredRecords: requiredRecords as any,
    },
  });

  logger.info("Domain connection initiated", {
    connectionId: connection.id,
    domain: req.domain,
  });

  return {
    connectionId: connection.id,
    domain: req.domain,
    status: "PENDING_VERIFICATION",
    requiredRecords,
  };
}

export async function checkDomainStatus(connectionId: string) {
  const connection = await prisma.domainConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  // In production: poll Vercel API for domain verification status
  // GET /v6/domains/{domain}/config

  return {
    connectionId: connection.id,
    domain: connection.domain,
    status: connection.status,
    requiredRecords: connection.requiredRecords,
  };
}
