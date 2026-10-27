import type { PortfolioArticle, PortfolioConfig } from '../types/portfolio';
import { getMediaUrl } from './media';

export interface SeoOptions {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  imageUrl?: string;
  type?: 'website' | 'article';
  author?: string;
  jsonLd?: Record<string, unknown> | null;
}

export const SITE_URL = 'https://dwika.my.id';
export const DEFAULT_AUTHOR = 'Andika Dwi Prasetyo';
export const DEFAULT_TITLE =
  'Andika Dwi Prasetyo — Web Developer & Software Craftsman | Portfolio';
export const DEFAULT_DESCRIPTION =
  'Official portfolio of Andika Dwi Prasetyo (Dwika), a passionate Web Developer crafting robust web applications with PHP, Laravel, React.js, and immersive modern interactivity.';
export const DEFAULT_KEYWORDS =
  'Andika Dwi Prasetyo, Dwika, Web Developer, Software Craftsman, Fullstack Developer, Laravel, React, TypeScript, Sukoharjo, Indonesia, Portfolio';
export const DEFAULT_IMAGE =
  'https://back.dwika.my.id/photos/background/1792239627_background.jpg';

/**
 * Safely creates or updates a <meta> element in document.head
 */
export function setMetaTag(
  selectorAttr: 'name' | 'property',
  attrValue: string,
  content: string | null | undefined
): void {
  if (typeof document === 'undefined') return;

  let meta = document.head.querySelector<HTMLMetaElement>(
    `meta[${selectorAttr}="${attrValue}"]`
  );

  if (!content) {
    if (meta) meta.remove();
    return;
  }

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(selectorAttr, attrValue);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
}

/**
 * Safely creates or updates a <link> element in document.head
 */
export function setLinkTag(rel: string, href: string | null | undefined): void {
  if (typeof document === 'undefined') return;

  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!href) {
    if (link) link.remove();
    return;
  }

  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.href = href;
}

/**
 * Injects or updates structured JSON-LD in document.head
 */
export function setJsonLd(id: string, data: Record<string, unknown> | null): void {
  if (typeof document === 'undefined') return;

  let script = document.head.querySelector<HTMLScriptElement>(`script#${id}`);

  if (!data) {
    if (script) script.remove();
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

/**
 * Strips HTML tags and normalizes spaces for clean meta description snippet
 */
export function cleanTextSnippet(htmlOrText?: string | null, maxLength = 160): string {
  if (!htmlOrText) return '';
  let plain = htmlOrText;
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(htmlOrText, 'text/html');
    plain = doc.body.textContent || '';
  } else {
    plain = htmlOrText.replace(/<[^>]*>?/gm, '');
  }
  const normalized = plain.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength - 3) + '...';
}

/**
 * Generates Schema.org JSON-LD for Home (Person + WebSite)
 */
export function generateHomeJsonLd(config: PortfolioConfig | null): Record<string, unknown> {
  const name = config?.name || DEFAULT_AUTHOR;
  const description = config?.short_desc || cleanTextSnippet(config?.desc) || DEFAULT_DESCRIPTION;
  const profileImg = config?.profile_url
    ? getMediaUrl(config.profile_url)
    : config?.background_url
      ? getMediaUrl(config.background_url)
      : DEFAULT_IMAGE;

  const sameAs: string[] = [
    config?.github_url || 'https://github.com/dwikaaaa',
    config?.instagram_url || 'https://instagram.com/dwikandika__',
    config?.youtube_url || 'https://youtube.com/@wewed_V',
    config?.letterboxd_url || 'https://letterboxd.com/dwikandika',
    config?.whatsapp_url,
  ].filter((url): url is string => Boolean(url));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: `${name} Portfolio`,
        description,
        inLanguage: 'en-US',
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        name,
        alternateName: ['Dwika', 'Andika Dwi Prasetyo'],
        url: SITE_URL,
        image: profileImg,
        jobTitle: 'Web Developer & Software Craftsman',
        description,
        email: config?.email ? `mailto:${config.email}` : undefined,
        sameAs,
      },
    ],
  };
}

/**
 * Generates Schema.org JSON-LD for an Article / Project
 */
export function generateArticleJsonLd(
  article: PortfolioArticle,
  authorName = DEFAULT_AUTHOR
): Record<string, unknown> {
  const articleUrl = `${SITE_URL}/articles/${article.slug}`;
  const thumbnail = article.thumbnail_url
    ? getMediaUrl(article.thumbnail_url)
    : DEFAULT_IMAGE;
  const description =
    article.sub_title || cleanTextSnippet(article.desc) || article.title;

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    headline: article.title,
    description,
    image: thumbnail,
    datePublished: article.created_at || article.date || undefined,
    dateModified: article.updated_at || article.date || undefined,
    author: {
      '@type': 'Person',
      name: authorName,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: authorName,
      url: SITE_URL,
    },
    articleSection: article.category?.name || 'Project',
  };
}

/**
 * Applies dynamic SEO metadata to the DOM
 */
export function updatePageSeo(options: SeoOptions): void {
  if (typeof document === 'undefined') return;

  const title = options.title || DEFAULT_TITLE;
  const description = options.description || DEFAULT_DESCRIPTION;
  const keywords = options.keywords || DEFAULT_KEYWORDS;
  const canonicalUrl = options.canonicalUrl || SITE_URL;
  const imageUrl = options.imageUrl || DEFAULT_IMAGE;
  const type = options.type || 'website';
  const author = options.author || DEFAULT_AUTHOR;

  // Title
  document.title = title;

  // Standard Meta Tags
  setMetaTag('name', 'description', description);
  setMetaTag('name', 'keywords', keywords);
  setMetaTag('name', 'author', author);
  setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // Canonical Link
  setLinkTag('canonical', canonicalUrl);

  // Open Graph
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:image', imageUrl);
  setMetaTag('property', 'og:type', type);
  setMetaTag('property', 'og:site_name', `${author} Portfolio`);
  setMetaTag('property', 'og:locale', 'en_US');

  // Twitter Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', imageUrl);
  setMetaTag('name', 'twitter:creator', '@dwikandika__');

  // Structured Data (JSON-LD)
  if (options.jsonLd) {
    setJsonLd('seo-jsonld', options.jsonLd);
  }
}
