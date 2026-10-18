export interface PortfolioConfig {
  name: string;
  short_desc: string | null;
  desc: string | null;
  logo: string | null;
  logo_url: string | null;
  background: string | null;
  background_url: string | null;
  profile: string | null;
  profile_url: string | null;
  video_profile: string | null;
  video_profile_url: string | null;
  email: string | null;
  whatsapp: string | null;
  whatsapp_url: string | null;
  github: string | null;
  github_url: string | null;
  instagram: string | null;
  instagram_url: string | null;
  letterboxd: string | null;
  letterboxd_url: string | null;
  youtube: string | null;
  youtube_url: string | null;
  facebook: string | null;
  updated_at?: string | null;
}

export interface PortfolioSkill {
  id: number;
  name: string;
  slug: string;
}

export interface PortfolioCategory {
  id: number;
  name: string;
  slug: string;
  articles_count?: number;
}

export interface PortfolioArticle {
  id: number;
  title: string;
  slug: string;
  sub_title: string | null;
  thumbnail: string | null;
  thumbnail_url: string | null;
  date: string | null;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  desc?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PortfolioData {
  config: PortfolioConfig | null;
  skills: PortfolioSkill[];
  articles: PortfolioArticle[];
  categories: PortfolioCategory[];
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}
