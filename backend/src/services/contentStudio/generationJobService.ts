import { Types } from "mongoose";
import GenerationJob, { IGenerationJob } from "../../models/GenerationJob";
import { CreativeAssetType } from "../../models/CreativeAsset";
import { assertOrganizationMembership } from "../../middleware/organization.middleware";
import { GenerationJobNotFoundError, InvalidContentStudioInputError } from "./errors";

export interface CreateJobInput {
  organizationId: Types.ObjectId;
  contentPlanId: Types.ObjectId;
  contentItemId: Types.ObjectId;
  creativeBriefId: Types.ObjectId;
  assetType: CreativeAssetType;
  request?: Record<string, unknown>;
  /** Name of the provider that will run this job, when known up front (e.g. "gemini-video-v1"). Defaults to "pending" for callers that resolve it after creating the job. */
  provider?: string;
}

/**
 * Job tracking for a generation run. Most providers resolve synchronously,
 * so a job moves queued -> processing -> completed/failed within one
 * request. Providers whose generation is genuinely asynchronous (e.g. Veo's
 * long-running video operations) instead move queued -> processing and
 * STAY processing across requests, with providerJobId/providerOperationState
 * carrying what's needed to resume polling - see markJobAwaitingProvider/
 * advanceAsyncVideoJob below and videoGenerationService.ts.
 */
export async function createJob(input: CreateJobInput): Promise<IGenerationJob> {
  return GenerationJob.create({
    organizationId: input.organizationId,
    contentPlanId: input.contentPlanId,
    contentItemId: input.contentItemId,
    creativeBriefId: input.creativeBriefId,
    assetType: input.assetType,
    provider: input.provider ?? "pending",
    request: input.request ?? {},
    status: "queued",
    progress: 0,
    resultAssetIds: [],
    retryCount: 0,
  });
}

export async function markJobProcessing(job: IGenerationJob): Promise<IGenerationJob> {
  job.status = "processing";
  job.startedAt = new Date();
  job.progress = 10;
  await job.save();
  return job;
}

/** Records that an async provider has accepted the job and is running it out-of-band (e.g. a Veo operation). The job stays "processing" - see advanceAsyncVideoJob for how it later resolves. */
export async function markJobAwaitingProvider(
  job: IGenerationJob,
  input: { model?: string; providerJobId: string; providerOperationState: Record<string, unknown>; progress?: number }
): Promise<IGenerationJob> {
  job.status = "processing";
  job.providerModel = input.model;
  job.providerJobId = input.providerJobId;
  job.providerOperationState = input.providerOperationState;
  job.progress = input.progress ?? 25;
  if (!job.startedAt) job.startedAt = new Date();
  await job.save();
  return job;
}

export async function completeJob(job: IGenerationJob, resultAssetIds: Types.ObjectId[]): Promise<IGenerationJob> {
  job.status = "completed";
  job.progress = 100;
  job.resultAssetIds = resultAssetIds;
  job.completedAt = new Date();
  await job.save();
  return job;
}

export async function failJob(job: IGenerationJob, error: string): Promise<IGenerationJob> {
  job.status = "failed";
  job.error = error;
  job.completedAt = new Date();
  await job.save();
  return job;
}

export async function getJobById(userId: string, jobId: string): Promise<IGenerationJob> {
  if (!jobId || !Types.ObjectId.isValid(jobId)) {
    throw new InvalidContentStudioInputError("jobId is missing or invalid");
  }
  const job = await GenerationJob.findById(jobId);
  if (!job) {
    throw new GenerationJobNotFoundError(jobId);
  }
  await assertOrganizationMembership(userId, job.organizationId.toString());
  return job;
}
