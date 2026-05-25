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
            isOneTime
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
  amountOverrides?: Record<string, number>,
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
      const sponsorLogin = node.sponsorEntity.login;
      const monthlyDollars = node.tier
        ? node.tier.monthlyPriceInCents / 100
        : (amountOverrides?.[sponsorLogin] ?? 0);
      // Detect one-time sponsorships via the tier they bought into. (Sponsorship.isOneTimePayment
      // would be more accurate but requires the read:user scope; tier.isOneTime works with repo scope.)
      const isOneTime = node.tier?.isOneTime === true;

      sponsors.push({
        login: sponsorLogin,
        name: node.sponsorEntity.name || sponsorLogin,
        avatarUrl: node.sponsorEntity.avatarUrl,
        profile: node.sponsorEntity.url,
        monthlyDollars,
        isActive: true,
        isOneTime,
        tier: node.tier
          ? {
              title: node.tier.name,
              monthlyPriceInDollars: node.tier.monthlyPriceInCents / 100,
            }
          : undefined,
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
export async function fetchSponsors(
  token: string | undefined,
  login: string,
  amountOverrides?: Record<string, number>,
): Promise<Sponsor[]> {
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
    const activeSponsors = await fetchSponsorsWithFlag(authToken, login, true, amountOverrides);
    const activeLogins = new Set(activeSponsors.map((s) => s.login));

    const allSponsors = await fetchSponsorsWithFlag(authToken, login, false, amountOverrides);

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
  const activeTiers = tiers.filter((t) => !t.title.toLowerCase().includes("past"));

  const placeByAmount = (sponsor: Sponsor): boolean => {
    for (let i = activeTiers.length - 1; i >= 0; i--) {
      if (sponsor.monthlyDollars >= activeTiers[i].monthlyDollars) {
        classified.get(activeTiers[i].title)?.push(sponsor);
        return true;
      }
    }
    return false;
  };

  for (const sponsor of sponsors) {
    let placed = false;

    // A one-time sponsorship grants benefits for 30 days; while inside that window GitHub keeps
    // it in the activeOnly list (isActive=true). After expiry the API drops it from the active
    // set and we mark isActive=false above — so this single check naturally archives stale
    // one-time payments without us needing to fetch createdAt (which requires read:user scope).
    if (sponsor.isOneTime && sponsor.isActive) {
      placed = placeByAmount(sponsor);
    }

    // Inactive sponsors (including expired one-time payments) go to the "Past Sponsors" tier.
    if (!placed && !sponsor.isActive && pastSponsorsTier) {
      classified.get(pastSponsorsTier.title)?.push(sponsor);
      placed = true;
    }

    // Try to match by tier name (active sponsors only).
    if (!placed && sponsor.tier?.title) {
      const matchingTier = tiers.find(
        (t) => t.title.toLowerCase() === sponsor.tier!.title.toLowerCase(),
      );
      if (matchingTier) {
        classified.get(matchingTier.title)?.push(sponsor);
        placed = true;
      }
    }

    // Fallback: classify by amount.
    if (!placed) {
      placed = placeByAmount(sponsor);
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
