import { ENV } from '../env';

export type IdentityVerificationRequest = {
  applicantId: string;
  legalName: string;
  email: string;
  country: string;
  referenceId: string;
  webhookUrl?: string;
};

export type IdentityVerificationResult = {
  status: 'pending' | 'verified' | 'failed';
  provider: string;
  reference: string;
  score?: number;
  reason?: string;
};

export class IdentityProviderClient {
  async submitVerification(request: IdentityVerificationRequest): Promise<IdentityVerificationResult> {
    if (ENV.identityProvider === 'mock') {
      return {
        status: 'pending',
        provider: 'mock',
        reference: `mock-${request.referenceId}`,
        score: 1,
      };
    }

    if (!ENV.identityApiKey) {
      throw new Error('IDENTITY_API_KEY is required for non-mock provider');
    }

    const response = await fetch(`${ENV.identityProvider}/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ENV.identityApiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Identity provider error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    return {
      status: data.status,
      provider: ENV.identityProvider,
      reference: data.reference,
      score: data.score,
      reason: data.reason,
    };
  }
}
