import React from 'react';

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  brandName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  brandName = 'Portfolio',
}) => {
  return (
    <header className="navbar-wrapper">
      <nav className="glass-navbar">
        <div
          className="navbar-brand"
          onClick={() => onNavigate('home')}
          role="button"
          tabIndex={0}
        >
          <span className="brand-name">{brandName}</span>
        </div>

        <ul className="navbar-links">
          <li>
            <button
              type="button"
              className={`nav-item nav-item-about ${activeSection === 'about-me' ? 'is-active' : ''}`}
              onClick={() => onNavigate('about-me')}
            >
              About Me
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`nav-item ${activeSection === 'projects' ? 'is-active' : ''}`}
              onClick={() => onNavigate('projects')}
            >
              Projects
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`nav-item ${activeSection === 'contacts' ? 'is-active' : ''}`}
              onClick={() => onNavigate('contacts')}
            >
              Contacts
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};
