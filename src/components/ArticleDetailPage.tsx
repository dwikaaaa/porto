import React, { useEffect, useState } from 'react';
import type { PortfolioArticle } from '../types/portfolio';
import { fetchArticleBySlug } from '../services/api';
import { getMediaUrl } from '../utils/media';
import './ArticleDetailPage.css';

interface ArticleDetailPageProps {
  slug: string;
  onBack: () => void;
  initialArticle?: PortfolioArticle | null;
  brandName?: string;
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  slug,
  onBack,
  initialArticle,
  brandName = 'Portfolio',
}) => {
  const [article, setArticle] = useState<PortfolioArticle | null>(initialArticle || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialArticle);
  const [error, setError] = useState<string | null>(null);
  const [curtainDone, setCurtainDone] = useState<boolean>(false);

  useEffect(() => {
    // Scroll to top when opening detail page
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Precise timer matching the curtain animation (0.8s) so card entrance triggers smoothly
    const curtainTimer = setTimeout(() => {
      setCurtainDone(true);
    }, 800);

    let isMounted = true;
    fetchArticleBySlug(slug)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setArticle(data);
          if (data.title) {
            document.title = `${data.title} — ${brandName}`;
          }
        } else if (!initialArticle) {
          setError('Article not found.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load article detail:', err);
        if (!initialArticle) {
          setError('Failed to fetch article detail from server.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(curtainTimer);
    };
  }, [slug, brandName, initialArticle]);

  return (
    <article className="article-detail-page">
      {/* Background color transition curtain: wipes from bottom to top from black to white */}
      <div
        className="article-color-curtain"
        aria-hidden="true"
        onAnimationEnd={() => setCurtainDone(true)}
      />

      <div className="article-detail-container">
        <div className={`article-content-wrapper ${curtainDone ? 'is-visible' : 'is-hidden'}`}>
          {isLoading ? (
            <div className="article-content-main" aria-busy="true">
              <div className="article-header-meta">
                <div className="article-skeleton-line short" style={{ width: '120px' }} />
              </div>
              <div className="article-skeleton-header" />
              <div className="article-skeleton-line short" style={{ width: '40%' }} />
              <div className="article-skeleton-thumb" />
              <div className="article-skeleton-line" />
              <div className="article-skeleton-line" />
              <div className="article-skeleton-line short" />
            </div>
          ) : error || !article ? (
            <div className="article-content-main article-error-card">
              <h2 className="article-error-title">Article Not Found</h2>
              <p className="article-error-msg">
                {error || `The requested article with slug "${slug}" could not be retrieved.`}
              </p>
              <button
                type="button"
                className="article-back-btn"
                onClick={onBack}
              >
                ← Back to Projects
              </button>
            </div>
          ) : (
            <div className="article-content-main">
              {/* Category & Tanggal */}
              <div className="article-header-meta">
                {article.category?.name && (
                  <span className="article-category-badge">
                    {article.category.name}
                  </span>
                )}

                {article.date && (
                  <div className="article-date-row">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <time dateTime={article.date}>{formatDate(article.date)}</time>
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <header className="article-header-content">
                <h1 className="article-main-title gothic-heading">
                  {article.title}
                </h1>
                {article.sub_title && (
                  <p className="article-subtitle">{article.sub_title}</p>
                )}
              </header>

              {/* Thumbnail */}
              {article.thumbnail_url && (
                <figure className="article-thumbnail-box">
                  <img
                    src={getMediaUrl(article.thumbnail_url)}
                    alt={article.title}
                    className="article-thumbnail-img"
                    loading="eager"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                    }}
                  />
                </figure>
              )}

              {/* Deskripsi */}
              <section className="article-description-wrapper">
                <h2 className="article-section-heading">Description</h2>
                {article.desc ? (
                  <div
                    className="article-rich-content"
                    dangerouslySetInnerHTML={{ __html: article.desc }}
                  />
                ) : (
                  <p className="article-empty-desc">
                    {article.sub_title || 'No extended description available for this project.'}
                  </p>
                )}
              </section>

              {/* Bottom Back Action */}
              <footer className="article-bottom-actions">
                <button
                  type="button"
                  className="article-back-btn"
                  onClick={onBack}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back to Portfolio</span>
                </button>
              </footer>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
