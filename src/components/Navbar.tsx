import React, { useState, useEffect, useRef } from 'react';

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  brandName?: string;
  isDetailPage?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  brandName = 'Portfolio',
  isDetailPage = false,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Scroll listener on detail page: shrink when scrolled down, expand when at top
  useEffect(() => {
    if (!isDetailPage) {
      setIsScrolled(false);
      setIsManuallyOpen(false);
      return;
    }

    const checkScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollY > 60) {
        setIsScrolled(true);
      } else {
        // Automatically restore full original navbar when scrolled back to the very top
        setIsScrolled(false);
        setIsManuallyOpen(false);
      }
    };

    checkScroll();

    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, [isDetailPage]);

  // Click outside and escape key handling when manually opened while scrolled
  useEffect(() => {
    if (!isDetailPage || !isManuallyOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsManuallyOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsManuallyOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDetailPage, isManuallyOpen]);

  const isShrunk = isDetailPage && isScrolled && !isManuallyOpen;

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    if (isDetailPage) {
      setIsManuallyOpen(false);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsManuallyOpen((prev) => !prev);
  };

  return (
    <header className={`navbar-wrapper ${isDetailPage ? 'is-detail' : ''}`}>
      <nav
        ref={navRef}
        className={`glass-navbar ${isDetailPage ? 'navbar-detail-mode' : ''} ${
          isShrunk ? 'is-shrunk' : 'is-centered'
        } ${isDetailPage && isManuallyOpen ? 'is-manually-open' : ''}`}
        onClick={isShrunk ? () => setIsManuallyOpen(true) : undefined}
        role={isShrunk ? 'button' : undefined}
        tabIndex={isShrunk ? 0 : undefined}
        aria-label={isShrunk ? 'Open navigation menu' : 'Navigation menu'}
        aria-expanded={isDetailPage ? !isShrunk : undefined}
      >
        {/* Brand name */}
        <div
          className="navbar-brand"
          onClick={() => handleNavClick('home')}
          role="button"
          tabIndex={0}
        >
          <span className="brand-name">{brandName}</span>
        </div>

        {/* Navigation Links */}
        <ul className="navbar-links">
          <li>
            <button
              type="button"
              className={`nav-item nav-item-about ${activeSection === 'about-me' ? 'is-active' : ''}`}
              onClick={() => handleNavClick('about-me')}
            >
              About Me
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`nav-item ${activeSection === 'projects' ? 'is-active' : ''}`}
              onClick={() => handleNavClick('projects')}
            >
              Projects
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`nav-item ${activeSection === 'contacts' ? 'is-active' : ''}`}
              onClick={() => handleNavClick('contacts')}
            >
              Contacts
            </button>
          </li>
        </ul>

        {/* Hamburger icon when shrunk (shown on right) */}
        {isDetailPage && isShrunk && (
          <div className="navbar-hamburger-preview" aria-hidden="true">
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </div>
        )}

        {/* Close Button when manually opened while scrolled */}
        {isDetailPage && isManuallyOpen && (
          <button
            type="button"
            className="navbar-close-btn"
            onClick={handleToggle}
            aria-label="Close navigation menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </nav>
    </header>
  );
};
