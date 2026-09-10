import { ClaimType, ResearchClaim } from '../types/research.types';

export interface ExtractedClaimInput {
  text: string;
  sourceId: string;
  reportId: string;
}

export class ClaimExtractorService {
  public extractClaims(input: ExtractedClaimInput): Partial<ResearchClaim>[] {
    return [
      {
        reportId: input.reportId,
        sourceId: input.sourceId,
        claim: input.text.trim(),
        claimType: 'general' as ClaimType,
        evidence: `Extracted from source: ${input.sourceId}`,
        confidence: 0.85,
        extractedAt: new Date()
      }
    ];
  }
}