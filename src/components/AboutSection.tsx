import React from 'react';
import type { PortfolioSkill } from '../types/portfolio';

interface AboutSectionProps {
  desc?: string | null;
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

export const AboutSection: React.FC<AboutSectionProps> = ({ desc, skills, isLoading = false }) => {
  const paragraphs = parseParagraphs(desc);
  const activeSkills = skills ? skills.map((s) => s.name) : [];
  const isPending = isLoading || (!desc && activeSkills.length === 0);

  return (
    <section id="about-me" className="section about-section">
      <div className="about-layout">
        {/* Left column reserved for the 3D model */}
        <div className="about-model-spacer" aria-hidden="true" />

        {/* Right column: Gothic blackletter text from API */}
        <div className="about-text-column">
          <div className="gothic-card">
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
              paragraphs.map((para, idx) => (
                <p key={idx} className="gothic-paragraph">
                  {para}
                </p>
              ))
            )}

            {/* Technical skill badges from API */}
            <div className="tech-stack-row">
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
                  <span key={idx} className="tech-badge">
                    {skillName}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
