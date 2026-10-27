import React from 'react';

interface HeroSectionProps {
  name?: string | null;
  shortDesc?: string | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ name, shortDesc }) => {
  const displayName = name || 'Andika Dwi Prasetyo';

  return (
    <section id="home" className="section hero-section" aria-label="Introduction">
      {/* Semantic H1 for Search Engines and Accessibility */}
      <h1 className="sr-only">
        {displayName} — Web Developer &amp; Software Craftsman
      </h1>

      <div className="hero-content">
        {/* Subtle background atmospheric gradient glow */}
        <div className="hero-glow-backdrop" aria-hidden="true" />

        {/* Minimalist bio badge from database config.short_desc */}
        {shortDesc && (
          <div className="hero-intro-badge" tabIndex={0}>
            <p className="hero-intro-text">{shortDesc}</p>
          </div>
        )}
      </div>
    </section>
  );
};
