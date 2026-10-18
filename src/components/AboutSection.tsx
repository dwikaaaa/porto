import React, { useEffect, useRef, useState } from 'react';
import type { PortfolioSkill } from '../types/portfolio';
import { getMediaUrl } from '../utils/media';

interface AboutSectionProps {
  name?: string | null;
  desc?: string | null;
  profileUrl?: string | null;
  skills?: PortfolioSkill[];
  isLoading?: boolean;
}

/**
 * Extracts plain text paragraphs from HTML string
 */
function parseParagraphs(htmlOrText?: string | null): string[] {
  if (!htmlOrText || !htmlOrText.trim()) {
    return [];
  }

  // Parse HTML string in browser environment
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(htmlOrText, 'text/html');
    const pElements = Array.from(doc.querySelectorAll('p'));
    const texts = pElements
      .map((el) => el.textContent?.trim() || '')
      .filter((txt) => txt.length > 0);

    if (texts.length > 0) {
      return texts;
    }

    const bodyText = doc.body.textContent?.trim();
    if (bodyText) {
      return bodyText.split(/\n\s*\n/).filter((t) => t.trim().length > 0);
    }
  }

  return [htmlOrText.replace(/<[^>]*>?/gm, '').trim()];
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  name,
  desc,
  profileUrl,
  skills,
  isLoading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const paragraphs = parseParagraphs(desc);
  const activeSkills = skills ? skills.map((s) => s.name) : [];
  const isPending = isLoading || (!desc && activeSkills.length === 0);

  const [stageIndex, setStageIndex] = useState(0);
  const [scrollPercentage, setScrollPercentage] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const handleScroll = () => {
      // On mobile viewports, About Me is a natural vertical stacked layout (Photo on top, description below)
      if (window.innerWidth <= 960) {
        track.style.transform = 'none';
        return;
      }

      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;
      const totalDistance = container.offsetHeight - vh;

      if (totalDistance <= 0) return;

      const currentDistance = -rect.top;
      const progress = Math.min(1, Math.max(0, currentDistance / totalDistance));

      // Calculate translation using physical visible panel offset distance
      const visibleChildren = Array.from(track.children).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && (el as HTMLElement).offsetWidth > 0;
      }) as HTMLElement[];

      let shiftDistance = 0;
      if (visibleChildren.length >= 2) {
        shiftDistance = visibleChildren[1].offsetLeft - visibleChildren[0].offsetLeft;
      }
      if (shiftDistance <= 0) {
        const padding = Math.max(20, window.innerWidth * 0.04);
        shiftDistance = window.innerWidth - padding * 2;
      }

      track.style.transform = `translate3d(-${progress * shiftDistance}px, 0, 0)`;

      const pct = Math.round(progress * 100);
      setScrollPercentage(pct);

      setStageIndex(progress >= 0.5 ? 1 : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    // Continuous update loop for Lenis smooth-scroll synchronization
    let rafId: number;
    const loop = () => {
      handleScroll();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const goToStage = (idx: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const totalDistance = container.offsetHeight - window.innerHeight;
    const targetProgress = idx === 0 ? 0 : 1;
    const containerTop = container.offsetTop;
    const targetScrollY = containerTop + targetProgress * totalDistance;
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  };

  return (
    <section id="about-me" ref={containerRef} className="about-scroll-wrapper">
      <div className="about-sticky-viewport">
        {/* Header with stage indicators and controls */}
        <div className="about-horizontal-header">
          <div className="header-meta">
            <span className="section-eyebrow">
              {stageIndex === 0
                ? 'Chronicle & Philosophy • 01 of 02'
                : 'Artisan Portrait • 02 of 02'}
            </span>

            <div className="header-controls-row">
              {/* Stage Indicators */}
              <div className="card-indicators-list">
                <button
                  type="button"
                  className={`indicator-dot ${stageIndex === 0 ? 'is-active' : ''}`}
                  onClick={() => goToStage(0)}
                  aria-label="Chronicle & Philosophy"
                />
                <button
                  type="button"
                  className={`indicator-dot ${stageIndex === 1 ? 'is-active' : ''}`}
                  onClick={() => goToStage(1)}
                  aria-label="Artisan Portrait"
                />
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
                  onClick={() => goToStage(0)}
                  aria-label="Previous Stage"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="arrow-btn"
                  onClick={() => goToStage(1)}
                  aria-label="Next Stage"
                >
                  →
                </button>
              </div>
            </div>
          </div>

          <div className="header-content">
            <h2 className="section-title gothic-heading">About The Artisan</h2>
          </div>
        </div>

        {/* Horizontal Multi-Panel Moving Track */}
        <div className="about-track-container">
          <div ref={trackRef} className="about-horizontal-track">
            {/* Panel 1: Left column initially reserved for 3D model */}
            <div className="about-panel about-panel-model" aria-hidden="true">
              <div className="about-model-spacer" />
            </div>

            {/* Panel 2: Gothic Blackletter Description & Skills (Starts Right, shifts to Left without card) */}
            <div className="about-panel about-panel-text">
              <div className="about-plain-container">
                <div className="about-plain-eyebrow">
                  <span className="about-eyebrow-line" />
                  <span className="about-eyebrow-text">DISCIPLE OF THE CODE</span>
                </div>

                {isPending ? (
                  <div className="about-skeleton-block" aria-busy="true">
                    <div className="skeleton-line skeleton-w-full" />
                    <div className="skeleton-line skeleton-w-90" />
                    <div className="skeleton-line skeleton-w-95" />
                    <div className="skeleton-line skeleton-w-75" />
                    <div className="skeleton-spacer" />
                    <div className="skeleton-line skeleton-w-full" />
                    <div className="skeleton-line skeleton-w-90" />
                    <div className="skeleton-line skeleton-w-80" />
                  </div>
                ) : (
                  <div className="about-plain-paragraphs">
                    {paragraphs.map((para, idx) => (
                      <p key={idx} className="gothic-paragraph-plain">
                        {para}
                      </p>
                    ))}
                  </div>
                )}

                {/* Technical skill badges from API (plain minimal badges) */}
                <div className="tech-stack-row-plain">
                  {isPending ? (
                    <>
                      <div className="skeleton-badge" />
                      <div className="skeleton-badge" />
                      <div className="skeleton-badge" />
                      <div className="skeleton-badge" />
                      <div className="skeleton-badge" />
                    </>
                  ) : (
                    activeSkills.map((skillName, idx) => (
                      <span key={idx} className="tech-badge-plain">
                        {skillName}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Panel 3: Creator Profile Portrait Photo from API profile_url */}
            <div className="about-panel about-panel-photo">
              <div className="about-photo-wrapper">
                <div className="about-photo-frame">
                  {profileUrl ? (
                    <img
                      src={getMediaUrl(profileUrl)}
                      alt={name ? `${name} Portrait` : 'Creator Portrait'}
                      className="about-profile-image"
                      loading="eager"
                    />
                  ) : (
                    <div className="about-photo-placeholder">
                      <span className="portrait-monogram">{name ? name.slice(0, 2).toUpperCase() : 'AD'}</span>
                    </div>
                  )}
                  <div className="photo-vignette-overlay" aria-hidden="true" />
                  <div className="photo-corner photo-corner-tl" aria-hidden="true" />
                  <div className="photo-corner photo-corner-tr" aria-hidden="true" />
                  <div className="photo-corner photo-corner-bl" aria-hidden="true" />
                  <div className="photo-corner photo-corner-br" aria-hidden="true" />
                </div>

                <div className="about-photo-info">
                  <h3 className="photo-artisan-name">{name || 'Andikas'}</h3>
                  <p className="photo-artisan-role">Software Engineer & Web Artisan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
