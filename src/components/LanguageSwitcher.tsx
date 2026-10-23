import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  SUPPORTED_LANGUAGES,
  getSavedLanguage,
  changeLanguage,
  initGoogleTranslate,
  type LanguageOption,
} from '../utils/translator';
import './LanguageSwitcher.css';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [mounted, setMounted] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{
    top?: number;
    bottom?: number;
    right: number;
    isMobileTrigger?: boolean;
  }>({ right: 24 });

  const desktopBtnRef = useRef<HTMLButtonElement>(null);
  const mobileBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Initialize Google Translate Client with English as default
    initGoogleTranslate();
    setCurrentLang(getSavedLanguage());

    const interval = setInterval(() => {
      const active = getSavedLanguage();
      if (active !== currentLang) {
        setCurrentLang(active);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [currentLang]);

  const openFromTrigger = (targetBtn: HTMLElement, isMobile: boolean) => {
    const rect = targetBtn.getBoundingClientRect();
    const rightOffset = Math.max(16, window.innerWidth - rect.right);

    if (isMobile) {
      setDropdownCoords({
        bottom: window.innerHeight - rect.top + 10,
        right: rightOffset,
        isMobileTrigger: true,
      });
    } else {
      setDropdownCoords({
        top: rect.bottom + 10,
        right: rightOffset,
        isMobileTrigger: false,
      });
    }
    setIsOpen(true);
  };

  // Close on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !desktopBtnRef.current?.contains(target) &&
        !mobileBtnRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const handleSelectLanguage = (lang: LanguageOption) => {
    setCurrentLang(lang.code);
    setIsOpen(false);
    changeLanguage(lang.code);
  };

  const activeLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <>
      {/* 1. Desktop Pill Button inside Navbar */}
      <div className={`lang-switcher-container ${className}`}>
        <button
          ref={desktopBtnRef}
          type="button"
          className={`lang-switcher-btn ${isOpen ? 'is-active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isOpen) {
              setIsOpen(false);
            } else if (desktopBtnRef.current) {
              openFromTrigger(desktopBtnRef.current, false);
            }
          }}
          aria-label="Select Language"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="lang-globe-icon" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </span>
          <span className="lang-current-code">{activeLangObj.code.toUpperCase()}</span>
          <svg
            className={`lang-chevron-icon ${isOpen ? 'rotate' : ''}`}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* 2. Floating Circular Button in Bottom-Right Corner (Mobile View via Portal) */}
      {mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <button
            ref={mobileBtnRef}
            type="button"
            className={`lang-floating-mobile-btn ${isOpen ? 'is-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isOpen) {
                setIsOpen(false);
              } else if (mobileBtnRef.current) {
                openFromTrigger(mobileBtnRef.current, true);
              }
            }}
            aria-label="Switch Language (Mobile)"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="mobile-btn-code">{activeLangObj.code.toUpperCase()}</span>
          </button>,
          document.body
        )}

      {/* 3. React Portal Dropdown (Directly in body, NEVER clipped by navbar overflow:hidden) */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className={`lang-dropdown-menu ${dropdownCoords.isMobileTrigger ? 'from-bottom' : 'from-top'}`}
            style={{
              position: 'fixed',
              top: dropdownCoords.top !== undefined ? `${dropdownCoords.top}px` : undefined,
              bottom: dropdownCoords.bottom !== undefined ? `${dropdownCoords.bottom}px` : undefined,
              right: `${dropdownCoords.right}px`,
              zIndex: 9999999,
            }}
            role="listbox"
          >
            <div className="lang-dropdown-header">
              <span>Select Language</span>
            </div>
            <div className="lang-options-list">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLang;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    className={`lang-option-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectLanguage(lang)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-label">{lang.label}</span>
                    {isSelected && (
                      <svg
                        className="lang-check-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
