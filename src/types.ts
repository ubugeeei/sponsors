/**
 * スポンサーシップシステムの型定義
 */

export interface Sponsor {
  /** GitHub ユーザー名またはオーガニゼーション名 */
  login: string;

  /** 表示名 */
  name: string;

  /** アバター画像 URL */
  avatarUrl: string;

  /** GitHub プロフィール URL */
  profile: string;

  /** 月額サポート額（ドル） */
  monthlyDollars: number;

  /** ティア情報 */
  tier?: {
    title: string;
    monthlyPriceInDollars: number;
  };
}

export interface Tier {
  /** ティアタイトル */
  title: string;

  /** 月額最小金額（ドル） */
  monthlyDollars: number;
}

export interface SponsorData {
  /** スポンサーリスト */
  sponsors: Sponsor[];

  /** ティアリスト */
  tiers: Tier[];
}

/** GitHub GraphQL レスポンスの型 */
export interface GitHubSponsorship {
  createdAt: string;
  privacyLevel: 'PUBLIC' | 'PRIVATE';
  tier: {
    name: string;
    monthlyPriceInCents: number;
  };
  sponsorEntity: {
    __typename: 'User' | 'Organization';
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
