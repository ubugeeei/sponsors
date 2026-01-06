/**
 * GitHub GraphQL API クライアント
 * スポンサーシップデータの取得
 * GitHub CLI (gh) または PAT を使用
 */

import { graphql } from '@octokit/graphql';
import type { Sponsor, GitHubSponsorship, GitHubSponsorshipResponse } from '../types';
import { execSync } from 'child_process';

const SPONSORS_QUERY = `
  query($login: String!, $cursor: String) {
    user(login: $login) {
      sponsorshipsAsMaintainer(first: 100, after: $cursor) {
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
 * GitHub Sponsors API からスポンサーデータを取得
 */
export async function fetchSponsors(
  token: string | undefined,
  login: string
): Promise<Sponsor[]> {
  const sponsors: Sponsor[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

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
    while (hasNextPage) {
      const response = await graphql<GitHubSponsorshipResponse>(SPONSORS_QUERY, {
        headers: {
          authorization: `token ${authToken}`,
        },
        login,
        cursor,
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
  } catch (error) {
    console.error('Failed to fetch sponsors:', error);
    throw error;
  }
}

/**
 * スポンサーをティアで分類
 */
export function classifySponsors(
  sponsors: Sponsor[],
  tiers: Array<{ title: string; monthlyDollars: number }>
): Map<string, Sponsor[]> {
  const classified = new Map<string, Sponsor[]>();

  // ティアを初期化
  for (const tier of tiers) {
    classified.set(tier.title, []);
  }

  // スポンサーを分類
  for (const sponsor of sponsors) {
    let placed = false;

    // ティアを昇順で確認
    for (let i = tiers.length - 1; i >= 0; i--) {
      const tier = tiers[i];
      if (sponsor.monthlyDollars >= tier.monthlyDollars) {
        const tierSponsors = classified.get(tier.title);
        if (tierSponsors) {
          tierSponsors.push(sponsor);
        }
        placed = true;
        break;
      }
    }

    // どのティアにも該当しない場合は最初のティアに
    if (!placed && tiers.length > 0) {
      const firstTier = tiers[0];
      const tierSponsors = classified.get(firstTier.title);
      if (tierSponsors) {
        tierSponsors.push(sponsor);
      }
    }
  }

  return classified;
}
