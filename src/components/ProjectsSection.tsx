import React, { useEffect, useRef, useState } from 'react';
import type { PortfolioArticle } from '../types/portfolio';

export interface DisplayProject {
  id: string;
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
        title: art.title,
        subtitle: art.sub_title || art.category?.name || 'Project',
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
  const [selectedProject, setSelectedProject] = useState<DisplayProject | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;
      const totalDistance = container.offsetHeight - vh;

      if (totalDistance <= 0) return;

      const currentDistance = -rect.top;
      const progress = Math.min(1, Math.max(0, currentDistance / totalDistance));

      const maxTranslate = Math.max(0, track.scrollWidth - window.innerWidth + 120);
      track.style.transform = `translate3d(-${progress * maxTranslate}px, 0, 0)`;

      const pct = Math.round(progress * 100);
      setScrollPercentage(pct);

      const activeIdx = Math.min(TOTAL_CARDS - 1, Math.floor(progress * TOTAL_CARDS));
      setCardIndex(activeIdx);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [TOTAL_CARDS]);

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
    <section id="projects" ref={containerRef} className="projects-scroll-wrapper">
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
              ))
            ) : projects.length === 0 ? (
              <div className="project-horizontal-card project-empty-card">
                <div className="card-glass-glow" aria-hidden="true" />
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
                  <div className="card-top">
                    <div className="card-index-row">
                      <span className="card-index">0{idx + 1}</span>
                      <span className="project-subtitle">{project.subtitle}</span>
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

                  <div className="project-actions">
                    {project.github ? (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noreferrer"
                        className="project-btn project-btn-ghost"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        Source Code
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className="project-btn project-btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                      }}
                    >
                      Inspect Project →
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Standalone See More Button linked to GitHub from API config */}
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
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div
          className="project-modal-backdrop"
          onClick={() => setSelectedProject(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="project-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setSelectedProject(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            {selectedProject.thumbnailUrl && (
              <div className="modal-thumbnail-wrapper">
                <img
                  src={selectedProject.thumbnailUrl}
                  alt={selectedProject.title}
                  className="modal-thumbnail-img"
                  onError={(e) => {
                    // Hide thumbnail if image fails to load
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="modal-content">
              <span className="modal-eyebrow">{selectedProject.subtitle}</span>
              <h3 className="modal-title">{selectedProject.title}</h3>

              <div className="modal-tags">
                {selectedProject.tags.map((t, i) => (
                  <span key={i} className="tag-pill">
                    {t}
                  </span>
                ))}
              </div>

              <div className="modal-description">
                {selectedProject.rawHtmlDesc ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedProject.rawHtmlDesc }}
                    className="modal-rich-desc"
                  />
                ) : (
                  <p>{selectedProject.description}</p>
                )}
              </div>

              <div className="modal-actions">
                <a
                  href={selectedProject.github}
                  target="_blank"
                  rel="noreferrer"
                  className="project-btn project-btn-ghost"
                >
                  GitHub Repository
                </a>
                <button
                  type="button"
                  className="project-btn project-btn-primary"
                  onClick={() => setSelectedProject(null)}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
