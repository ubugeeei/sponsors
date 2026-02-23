/**
 * Type definitions for the sponsorship system
 */

export interface Sponsor {
  /** GitHub username or organization name */
  login: string;

  /** Display name */
  name: string;

  /** Avatar image URL */
  avatarUrl: string;

  /** GitHub profile URL */
  profile: string;

  /** Monthly support amount (in dollars) */
  monthlyDollars: number;

  /** Whether the sponsor is currently active */
  isActive: boolean;

  /** Tier information */
  tier?: {
    title: string;
    monthlyPriceInDollars: number;
  };
}

export interface Tier {
  /** Tier title */
  title: string;

  /** Minimum monthly amount (in dollars) */
  monthlyDollars: number;
}

export interface SponsorData {
  /** List of sponsors */
  sponsors: Sponsor[];

  /** List of tiers */
  tiers: Tier[];
}

/** GitHub GraphQL response type */
export interface GitHubSponsorship {
  createdAt?: string;
  privacyLevel?: "PUBLIC" | "PRIVATE";
  isActive: boolean;
  tier: {
    name: string;
    monthlyPriceInCents: number;
  } | null;
  sponsorEntity: {
    __typename: "User" | "Organization";
    login: string;
    name: string;
    avatarUrl: string;
    url: string;
  };
}

export interface GitHubSponsorshipResponse {
  user: {
    sponsorshipsAsMaintainer: {
      totalCount: number;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: GitHubSponsorship[];
    };
  };
}
