// src/types/deployment.ts

export type DeploymentStatus =
  | "queued"
  | "generating"
  | "validating"
  | "deploying"
  | "ready"
  | "failed";

export interface DeploymentResult {
  deploymentId: string;
  deploymentUrl: string;
  previewUrl: string;
  projectId: string;
}

export interface StatusResponse {
  requestId: string;
  status: DeploymentStatus;
  previewUrl?: string;
  errorMessage?: string;
  updatedAt: string;
}
