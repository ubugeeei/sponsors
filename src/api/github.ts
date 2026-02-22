/**
 * GitHub GraphQL API client for fetching sponsorship data
 * Supports GitHub CLI (gh) or PAT authentication
 */

import { graphql } from "@octokit/graphql";
import type { Sponsor, GitHubSponsorshipResponse } from "../types";
import { execSync } from "child_process";

const SPONSORS_QUERY = `
  query($login: String!, $cursor: String, $activeOnly: Boolean!) {
    user(login: $login) {
      sponsorshipsAsMaintainer(first: 100, after: $cursor, activeOnly: $activeOnly) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          tier {
            name
            monthlyPriceInCents
          }
          sponsorEntity {
            __typename
            ... on User {
              login
              name
              avatarUrl
              url
            }
            ... on Organization {
              login
              name
              avatarUrl
              url
            }
          }
        }
      }
    }
  }
`;

/**
 * Get auth token from GitHub CLI (if installed and authenticated)
 */
function getGhToken(): string | null {
  try {
    const token = execSync("gh auth token", { encoding: "utf-8" }).trim();
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Fetch sponsors with specific activeOnly flag
 */
async function fetchSponsorsWithFlag(
  authToken: string,
  login: string,
  activeOnly: boolean,
): Promise<Sponsor[]> {
  const sponsors: Sponsor[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await graphql<GitHubSponsorshipResponse>(SPONSORS_QUERY, {
      headers: {
        authorization: `token ${authToken}`,
      },
      login,
      cursor,
      activeOnly,
    });

    const sponsorships = response.user.sponsorshipsAsMaintainer;

    for (const node of sponsorships.nodes) {
      if (!node.tier) continue;

      sponsors.push({
        login: node.sponsorEntity.login,
        name: node.sponsorEntity.name || node.sponsorEntity.login,
        avatarUrl: node.sponsorEntity.avatarUrl,
        profile: node.sponsorEntity.url,
        monthlyDollars: node.tier.monthlyPriceInCents / 100,
        isActive: true,
        tier: {
          title: node.tier.name,
          monthlyPriceInDollars: node.tier.monthlyPriceInCents / 100,
        },
      });
    }

    hasNextPage = sponsorships.pageInfo.hasNextPage;
    cursor = sponsorships.pageInfo.endCursor;
  }

  return sponsors;
}

/**
 * Fetch sponsor data from GitHub Sponsors API
 * Uses two queries to determine active vs past sponsors
 */
export async function fetchSponsors(token: string | undefined, login: string): Promise<Sponsor[]> {
  // Resolve auth token (prefer gh CLI)
  let authToken = token;
  if (!authToken) {
    const ghToken = getGhToken();
    if (ghToken) {
      console.log("ℹ️  Using GitHub CLI authentication (SSH)");
      authToken = ghToken;
    }
  }

  if (!authToken) {
    throw new Error(
      "GitHub token is required. Either:\n" +
        "1. Set GITHUB_TOKEN or SPONSORKIT_GITHUB_TOKEN environment variable\n" +
        "2. Install GitHub CLI (gh) and authenticate with: gh auth login",
    );
  }

  try {
    const activeSponsors = await fetchSponsorsWithFlag(authToken, login, true);
    const activeLogins = new Set(activeSponsors.map((s) => s.login));

    const allSponsors = await fetchSponsorsWithFlag(authToken, login, false);

    // Past sponsors = in all but not in active
    const pastSponsors: Sponsor[] = [];
    for (const sponsor of allSponsors) {
      if (!activeLogins.has(sponsor.login)) {
        sponsor.isActive = false;
        pastSponsors.push(sponsor);
      }
    }

    const sponsors = [...activeSponsors, ...pastSponsors];
    console.log(`   Active: ${activeSponsors.length}, Past: ${pastSponsors.length}`);

    return sponsors;
  } catch (error) {
    console.error("Failed to fetch sponsors:", error);
    throw error;
  }
}

/**
 * Classify sponsors by tier
 * Priority: 1. Past sponsors (inactive) → "Past Sponsors" tier
 *           2. Tier name matching
 *           3. Amount-based fallback
 */
export function classifySponsors(
  sponsors: Sponsor[],
  tiers: Array<{ title: string; monthlyDollars: number }>,
): Map<string, Sponsor[]> {
  const classified = new Map<string, Sponsor[]>();

  for (const tier of tiers) {
    classified.set(tier.title, []);
  }

  const pastSponsorsTier = tiers.find((t) => t.title.toLowerCase().includes("past"));

  for (const sponsor of sponsors) {
    let placed = false;

    // Inactive sponsors go to "Past Sponsors" tier
    if (!sponsor.isActive && pastSponsorsTier) {
      classified.get(pastSponsorsTier.title)?.push(sponsor);
      placed = true;
    }

    // Try to match by tier name (active sponsors only)
    if (!placed && sponsor.tier?.title) {
      const matchingTier = tiers.find(
        (t) => t.title.toLowerCase() === sponsor.tier!.title.toLowerCase(),
      );
      if (matchingTier) {
        classified.get(matchingTier.title)?.push(sponsor);
        placed = true;
      }
    }

    // Fallback: classify by amount
    if (!placed) {
      const activeTiers = tiers.filter((t) => !t.title.toLowerCase().includes("past"));
      for (let i = activeTiers.length - 1; i >= 0; i--) {
        if (sponsor.monthlyDollars >= activeTiers[i].monthlyDollars) {
          classified.get(activeTiers[i].title)?.push(sponsor);
          placed = true;
          break;
        }
      }
    }

    // Last resort: place in first non-past tier
    if (!placed) {
      const firstActiveTier = tiers.find((t) => !t.title.toLowerCase().includes("past"));
      if (firstActiveTier) {
        classified.get(firstActiveTier.title)?.push(sponsor);
      }
    }
  }

  return classified;
}
