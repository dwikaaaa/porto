import type {
  ApiResponse,
  PortfolioArticle,
  PortfolioConfig,
  PortfolioData,
  PortfolioSkill,
} from '../types/portfolio';

// Retrieve base API URL from environment variable without hardcoding
// Retrieve base API URL strictly from environment variable
const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

/**
 * Generic fetcher with JSON error handling and timeout
 */
async function fetchEndpoint<T>(endpoint: string, timeoutMs = 8000): Promise<T | null> {
  if (!API_BASE_URL) {
    console.warn('VITE_API_URL is not set.');
    return null;
  }

  const url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`API [${res.status}] fetching ${url}: ${res.statusText}`);
      return null;
    }

    const json = (await res.json()) as ApiResponse<T>;
    const data = json?.data;

    // Detect broken PHP serialized cache from backend
    if (
      data &&
      typeof data === 'object' &&
      '__PHP_Incomplete_Class_Name' in (data as Record<string, unknown>)
    ) {
      console.warn(`Corrupted PHP cache returned from ${url}.`);
      return null;
    }

    return data ?? null;
  } catch (err) {
    clearTimeout(timer);
    console.warn(`Failed to fetch from ${url}:`, err);
    return null;
  }
}

/**
 * Fetch complete portfolio bundle in a single call (/portfolio)
 */
export async function fetchPortfolioBundle(): Promise<PortfolioData | null> {
  const data = await fetchEndpoint<PortfolioData>('portfolio');
  if (!data) return null;

  return {
    config: data.config ?? null,
    skills: Array.isArray(data.skills) ? data.skills : [],
    articles: Array.isArray(data.articles) ? data.articles : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
  };
}

/**
 * Fetch site configuration and contact links directly (/config)
 */
export async function fetchPortfolioConfig(): Promise<PortfolioConfig | null> {
  return await fetchEndpoint<PortfolioConfig>('config');
}

/**
 * Fetch skills list directly (/skills), falling back to live bundle (/portfolio) if /skills is corrupted
 */
export async function fetchPortfolioSkills(): Promise<PortfolioSkill[]> {
  const data = await fetchEndpoint<PortfolioSkill[]>('skills');
  if (Array.isArray(data) && data.length > 0) {
    return data;
  }

  // If /skills returned non-array or corrupted cache, fetch live skills from /portfolio bundle
  const bundle = await fetchEndpoint<PortfolioData>('portfolio');
  if (bundle && Array.isArray(bundle.skills) && bundle.skills.length > 0) {
    return bundle.skills;
  }

  return [];
}

/**
 * Fetch articles / projects list directly (/articles)
 */
export async function fetchPortfolioArticles(category?: string, search?: string): Promise<PortfolioArticle[]> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (search) params.append('search', search);

  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await fetchEndpoint<PortfolioArticle[]>(`articles${query}`);

  if (Array.isArray(data) && data.length > 0) {
    return data;
  }

  // If unfiltered request returned non-array, fallback to search=% query
  if (!category && !search) {
    const fallbackData = await fetchEndpoint<PortfolioArticle[]>('articles?search=%25');
    if (Array.isArray(fallbackData) && fallbackData.length > 0) {
      return fallbackData;
    }
  }

  return Array.isArray(data) ? data : [];
}
