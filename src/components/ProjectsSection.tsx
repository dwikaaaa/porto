import React, { useEffect, useRef, useState } from 'react';
import type { PortfolioArticle } from '../types/portfolio';
import { getMediaUrl } from '../utils/media';

export interface DisplayProject {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  link: string;
  github: string;
  thumbnailUrl?: string | null;
  rawHtmlDesc?: string | null;
  date?: string | null;
}

interface ProjectsSectionProps {
  articles?: PortfolioArticle[];
  githubUrl?: string | null;
  isLoading?: boolean;
  onInspectArticle?: (slug: string) => void;
}

function stripHtml(html?: string | null): string {
  if (!html) return '';
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent?.trim() || '';
  }
  return html.replace(/<[^>]*>?/gm, '').trim();
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  articles,
  githubUrl,
  isLoading = false,
  onInspectArticle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const isPending = isLoading || articles === undefined;

  // Map API articles to display project format
  const projects: DisplayProject[] = React.useMemo(() => {
    if (!articles || articles.length === 0) {
      return [];
    }

    return articles.map((art) => {
      const plainDesc = stripHtml(art.desc);
      const description =
        plainDesc.length > 0
          ? plainDesc
          : art.sub_title || 'Project creation and architecture.';

      const tags: string[] = [];
      if (art.category?.name) {
        tags.push(art.category.name);
      }

      return {
        id: String(art.id),
        slug: art.slug,
        title: art.title,
        subtitle: art.category?.name || 'Project',
        description,
        tags,
        link: '#',
        github: githubUrl || '',
        thumbnailUrl: art.thumbnail_url,
        rawHtmlDesc: art.desc,
        date: art.date,
      };
    });
  }, [articles, githubUrl]);

  const TOTAL_CARDS = Math.max(1, projects.length);
  const [cardIndex, setCardIndex] = useState(0);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [showMobileExplore, setShowMobileExplore] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;
      const totalDistance = container.offsetHeight - vh;

      if (totalDistance <= 0) return;

      const currentDistance = -rect.top;
      const progress = Math.min(1, Math.max(0, currentDistance / totalDistance));

      const isMobile = window.innerWidth <= 960;
      // Filter out desktop-only see-more container from mobile card stack
      const cardElements = (Array.from(track.children) as HTMLElement[]).filter(
        (el) => !el.classList.contains('see-more-action-container')
      );
      const totalItems = cardElements.length;

      if (isMobile) {
        // Mobile Stack Animation: cards rise from bottom and stack onto each other leaving top trail
        track.style.transform = 'none';

        if (totalItems <= 1) {
          if (cardElements[0]) {
            cardElements[0].style.transform = 'translate3d(0, 0, 0)';
            cardElements[0].style.opacity = '1';
            cardElements[0].style.zIndex = '10';
          }
          setCardIndex(0);
          setShowMobileExplore(true);
        } else {
          // Dynamic trail offset: calculated so even with multiple cards, total trail doesn't exceed 90px
          const maxTotalTrail = 90;
          const trailOffset = Math.min(26, Math.max(16, Math.floor(maxTotalTrail / (totalItems - 1))));
          const numSteps = totalItems - 1;

          // Base card (card 0) rests at top = 0
          if (cardElements[0]) {
            cardElements[0].style.transform = 'translate3d(0, 0px, 0)';
            cardElements[0].style.opacity = '1';
            cardElements[0].style.zIndex = '10';
            cardElements[0].style.pointerEvents = 'auto';
          }

          let activeIdx = 0;
          const offscreenY = Math.max(vh * 0.85, 550);

          for (let i = 1; i < totalItems; i++) {
            const el = cardElements[i];
            const startP = (i - 1) / numSteps;
            const endP = i / numSteps;
            const restingY = i * trailOffset;

            if (progress <= startP) {
              el.style.transform = `translate3d(0, ${offscreenY}px, 0)`;
              el.style.opacity = '0';
              el.style.pointerEvents = 'none';
              el.style.zIndex = String(10 + i);
            } else if (progress >= endP) {
              el.style.transform = `translate3d(0, ${restingY}px, 0)`;
              el.style.opacity = '1';
              el.style.pointerEvents = 'auto';
              el.style.zIndex = String(10 + i);
              activeIdx = i;
            } else {
              const t = (progress - startP) / (endP - startP);
              // Cubic ease out for smooth deceleration onto stack
              const eased = 1 - Math.pow(1 - t, 3);
              const currentY = offscreenY + (restingY - offscreenY) * eased;
              const opacity = Math.min(1, t * 3.5);

              el.style.transform = `translate3d(0, ${currentY.toFixed(1)}px, 0)`;
              el.style.opacity = opacity.toFixed(2);
              el.style.pointerEvents = 'auto';
              el.style.zIndex = String(10 + i);
              if (t > 0.35) {
                activeIdx = i;
              }
            }
          }

          setCardIndex(Math.min(TOTAL_CARDS - 1, activeIdx));
          // Reveal button below project list once all project cards have stacked
          setShowMobileExplore(progress >= 0.88 || activeIdx === TOTAL_CARDS - 1);
        }
      } else {
        // Desktop: Clean horizontal track translation and reset card transforms
        cardElements.forEach((el) => {
          el.style.transform = '';
          el.style.opacity = '';
          el.style.zIndex = '';
          el.style.pointerEvents = 'auto';
        });

        const containerWidth = track.parentElement ? track.parentElement.clientWidth : window.innerWidth;
        const maxTranslate = Math.max(0, track.scrollWidth - containerWidth);
        track.style.transform = `translate3d(-${progress * maxTranslate}px, 0, 0)`;

        const activeIdx = Math.min(TOTAL_CARDS - 1, Math.floor(progress * TOTAL_CARDS));
        setCardIndex(activeIdx);
        setShowMobileExplore(false);
      }

      const pct = Math.round(progress * 100);
      setScrollPercentage(pct);
    };

    const onScrollOrResize = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        handleScroll();
        rafId = null;
      });
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    handleScroll();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [TOTAL_CARDS, isPending, projects.length]);

  const goToCard = (idx: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const totalDistance = container.offsetHeight - window.innerHeight;
    const targetProgress = TOTAL_CARDS > 1 ? idx / (TOTAL_CARDS - 1) : 0;
    const containerTop = container.offsetTop;
    const targetScrollY = containerTop + targetProgress * totalDistance;
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  };

  return (
    <section
      id="projects"
      ref={containerRef}
      className="projects-scroll-wrapper"
      style={{ '--mobile-stack-count': Math.max(1, projects.length) } as React.CSSProperties}
    >
      <div className="projects-sticky-viewport">
        {/* Header with pill indicators and controls */}
        <div className="projects-horizontal-header">
          <div className="header-meta">
            <span className="section-eyebrow">
              Portfolio Works • {Math.min(cardIndex + 1, TOTAL_CARDS)} of {TOTAL_CARDS}
            </span>

            <div className="header-controls-row">
              {/* Pagination Dots */}
              <div className="card-indicators-list">
                {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`indicator-dot ${cardIndex === i ? 'is-active' : ''}`}
                    onClick={() => goToCard(i)}
                    aria-label={`Go to project ${i + 1}`}
                  />
                ))}
              </div>

              {/* Progress bar */}
              <div className="horizontal-progress-bar">
                <div className="progress-fill" style={{ width: `${scrollPercentage}%` }} />
              </div>

              {/* Navigation Arrows */}
              <div className="gallery-arrows">
                <button
                  type="button"
                  className="arrow-btn"
                  onClick={() => goToCard(Math.max(0, cardIndex - 1))}
                  aria-label="Previous Project"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="arrow-btn"
                  onClick={() => goToCard(Math.min(TOTAL_CARDS - 1, cardIndex + 1))}
                  aria-label="Next Project"
                >
                  →
                </button>
              </div>
            </div>
          </div>

          <div className="header-content">
            <h2 className="section-title gothic-heading">Selected Creations</h2>
          </div>
        </div>

        {/* Horizontal Moving Track */}
        <div className="projects-track-container">
          <div ref={trackRef} className="projects-horizontal-track">
            {isPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="project-horizontal-card project-skeleton-card" aria-busy="true">
                  <div className="card-glass-glow" aria-hidden="true" />
                  <div className="card-stack-trail-bar">
                    <div className="trail-left">
                      <span className="trail-idx">0{i + 1}</span>
                      <span className="trail-divider">•</span>
                      <span className="trail-title">Loading Project...</span>
                    </div>
                  </div>
                  <div className="skeleton-image-box" />
                  <div className="project-card-body">
                    <div className="card-top">
                      <div className="skeleton-line skeleton-w-40" />
                      <div className="skeleton-line skeleton-title-bar" />
                    </div>
                    <div className="skeleton-line skeleton-w-full" />
                    <div className="skeleton-line skeleton-w-80" />
                    <div className="skeleton-badge-row">
                      <div className="skeleton-badge" />
                      <div className="skeleton-badge" />
                    </div>
                  </div>
                </div>
              ))
            ) : projects.length === 0 ? (
              <div className="project-horizontal-card project-empty-card">
                <div className="card-glass-glow" aria-hidden="true" />
                <div className="card-stack-trail-bar">
                  <div className="trail-left">
                    <span className="trail-idx">01</span>
                    <span className="trail-divider">•</span>
                    <span className="trail-title">No Projects Found</span>
                  </div>
                </div>
                <h3 className="project-title">No Projects Found</h3>
                <p className="project-description">
                  Articles and project showcases have not been published yet.
                </p>
              </div>
            ) : (
              projects.map((project, idx) => (
                <div
                  key={project.id}
                  className={`project-horizontal-card ${cardIndex === idx ? 'is-active-card' : ''}`}
                  onClick={() => goToCard(idx)}
                >
                  <div className="card-glass-glow" aria-hidden="true" />

                  {/* Mobile Stack Trail Bar (Revealed when card is underneath subsequent cards) */}
                  <div className="card-stack-trail-bar">
                    <div className="trail-left">
                      <span className="trail-idx">0{idx + 1}</span>
                      <span className="trail-divider">•</span>
                      <span className="trail-title">{project.title}</span>
                    </div>
                    <span className="trail-badge">{project.subtitle}</span>
                  </div>

                  {/* Thumbnail Image from API articles.thumbnail_url */}
                  {project.thumbnailUrl && (
                    <div className="project-card-image-box">
                      <img
                        src={getMediaUrl(project.thumbnailUrl)}
                        alt={project.title}
                        className="project-card-image"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="project-card-body">
                    <div className="card-top">
                      <div className="card-index-row">
                        <span className="card-index">0{idx + 1}</span>
                      </div>
                      <h3 className="project-title">{project.title}</h3>
                    </div>

                    <p className="project-description">{project.description}</p>

                    <div className="project-tags">
                      {project.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="tag-pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="project-actions">
                    <button
                      type="button"
                      className="project-btn project-btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onInspectArticle) {
                          onInspectArticle(project.slug);
                        }
                      }}
                    >
                      Inspect Project →
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Standalone See More Button linked to GitHub (Desktop horizontal track) */}
            <div className="see-more-action-container">
              <a
                href={githubUrl || 'https://github.com'}
                target="_blank"
                rel="noreferrer"
                className="see-more-direct-btn"
              >
                <span>See More</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Button: Explore on GitHub (Displayed as standard button below project stack once scrolled) */}
        <div className={`projects-mobile-bottom-action ${showMobileExplore ? 'is-visible' : ''}`}>
          <a
            href={githubUrl || 'https://github.com'}
            target="_blank"
            rel="noreferrer"
            className="see-more-direct-btn"
          >
            <span>Explore on GitHub</span>
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
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};
