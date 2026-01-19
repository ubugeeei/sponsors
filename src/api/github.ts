/**
 * GitHub GraphQL API クライアント
 * スポンサーシップデータの取得
 * GitHub CLI (gh) または PAT を使用
 */

import { graphql } from '@octokit/graphql';
import type { Sponsor, GitHubSponsorship, GitHubSponsorshipResponse } from '../types';
import { execSync } from 'child_process';

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
 * GitHub CLI から認証トークンを取得
 * (gh がインストール済みで SSH で認証済みの場合)
 */
function getGhToken(): string | null {
  try {
    const token = execSync('gh auth token', { encoding: 'utf-8' }).trim();
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
  activeOnly: boolean
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
    const pageInfo = sponsorships.pageInfo;

    // スポンサーシップを処理
    for (const node of sponsorships.nodes) {
      // ティア情報がない場合はスキップ
      if (!node.tier) {
        continue;
      }

      sponsors.push({
        login: node.sponsorEntity.login,
        name: node.sponsorEntity.name || node.sponsorEntity.login,
        avatarUrl: node.sponsorEntity.avatarUrl,
        profile: node.sponsorEntity.url,
        monthlyDollars: node.tier.monthlyPriceInCents / 100,
        isActive: !activeOnly ? true : true, // Will be set correctly later
        tier: {
          title: node.tier.name,
          monthlyPriceInDollars: node.tier.monthlyPriceInCents / 100,
        },
      });
    }

    // ページネーション処理
    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }

  return sponsors;
}

/**
 * GitHub Sponsors API からスポンサーデータを取得
 * Uses two queries to determine active vs past sponsors
 */
export async function fetchSponsors(
  token: string | undefined,
  login: string
): Promise<Sponsor[]> {
  // トークンを決定（gh CLI を優先）
  let authToken = token;
  if (!authToken) {
    const ghToken = getGhToken();
    if (ghToken) {
      console.log('ℹ️  Using GitHub CLI authentication (SSH)');
      authToken = ghToken;
    }
  }

  if (!authToken) {
    throw new Error(
      'GitHub token is required. Either:\n' +
      '1. Set GITHUB_TOKEN or SPONSORKIT_GITHUB_TOKEN environment variable\n' +
      '2. Install GitHub CLI (gh) and authenticate with: gh auth login'
    );
  }

  try {
    // Fetch active sponsors
    const activeSponsors = await fetchSponsorsWithFlag(authToken, login, true);
    const activeLogins = new Set(activeSponsors.map(s => s.login));

    // Mark as active
    for (const sponsor of activeSponsors) {
      sponsor.isActive = true;
    }

    // Fetch all sponsors (including past)
    const allSponsors = await fetchSponsorsWithFlag(authToken, login, false);

    // Find past sponsors (in all but not in active)
    const pastSponsors: Sponsor[] = [];
    for (const sponsor of allSponsors) {
      if (!activeLogins.has(sponsor.login)) {
        sponsor.isActive = false;
        pastSponsors.push(sponsor);
      }
    }

    // Combine active and past sponsors
    const sponsors = [...activeSponsors, ...pastSponsors];

    console.log(`   Active: ${activeSponsors.length}, Past: ${pastSponsors.length}`);

    return sponsors;
  } catch (error) {
    console.error('Failed to fetch sponsors:', error);
    throw error;
  }
}

/**
 * Classify sponsors by tier
 * Priority: 1. Past sponsors (inactive) go to "Past Sponsors" tier
 *           2. Tier name matching
 *           3. Amount-based
 */
export function classifySponsors(
  sponsors: Sponsor[],
  tiers: Array<{ title: string; monthlyDollars: number }>
): Map<string, Sponsor[]> {
  const classified = new Map<string, Sponsor[]>();

  // Initialize tiers
  for (const tier of tiers) {
    classified.set(tier.title, []);
  }

  // Find Past Sponsors tier
  const pastSponsorsTier = tiers.find(t => t.title.toLowerCase().includes('past'));

  // Classify sponsors
  for (const sponsor of sponsors) {
    let placed = false;

    // 0. Inactive sponsors go to "Past Sponsors" tier
    if (!sponsor.isActive && pastSponsorsTier) {
      const pastSponsors = classified.get(pastSponsorsTier.title);
      if (pastSponsors) {
        pastSponsors.push(sponsor);
        placed = true;
      }
    }

    // 1. First try to match by tier name (only for active sponsors)
    if (!placed && sponsor.tier?.title) {
      const matchingTier = tiers.find(
        (t) => t.title.toLowerCase() === sponsor.tier!.title.toLowerCase()
      );
      if (matchingTier) {
        const tierSponsors = classified.get(matchingTier.title);
        if (tierSponsors) {
          tierSponsors.push(sponsor);
          placed = true;
        }
      }
    }

    // 2. If name matching fails, classify by amount
    if (!placed) {
      // Filter out Past Sponsors tier for amount-based matching
      const activeTiers = tiers.filter(t => !t.title.toLowerCase().includes('past'));
      for (let i = activeTiers.length - 1; i >= 0; i--) {
        const tier = activeTiers[i];
        if (sponsor.monthlyDollars >= tier.monthlyDollars) {
          const tierSponsors = classified.get(tier.title);
          if (tierSponsors) {
            tierSponsors.push(sponsor);
          }
          placed = true;
          break;
        }
      }
    }

    // If no tier matches, place in the first non-past tier
    if (!placed && tiers.length > 0) {
      const firstActiveTier = tiers.find(t => !t.title.toLowerCase().includes('past'));
      if (firstActiveTier) {
        const tierSponsors = classified.get(firstActiveTier.title);
        if (tierSponsors) {
          tierSponsors.push(sponsor);
        }
      }
    }
  }

  return classified;
}
