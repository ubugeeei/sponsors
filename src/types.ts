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

  /** True if the sponsorship is a one-time payment (not recurring) */
  isOneTime?: boolean;

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

export interface Tool {
  /** GitHub login (used to fetch avatar) */
  login: string;

  /** Display name */
  name: string;

  /** Role label, e.g. "AI", "Font" */
  role: string;

  /** Visual emphasis within the tools cell */
  emphasis: "large" | "small";

  /** Link target */
  profile: string;

  /** Populated at runtime */
  avatarUrl?: string;
  avatarUrlBase64?: string;
}

/** GitHub GraphQL response type */
export interface GitHubSponsorship {
  createdAt?: string;
  privacyLevel?: "PUBLIC" | "PRIVATE";
  isActive: boolean;
  tier: {
    name: string;
    isOneTime?: boolean;
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
