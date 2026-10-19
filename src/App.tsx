import { useEffect, useState, useRef } from 'react';
import Lenis from 'lenis';
import { Navbar } from './components/Navbar';
import { ModelViewer } from './components/ModelViewer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ContactSection } from './components/ContactSection';
import { CursorTracker } from './components/CursorTracker';
import {
  fetchPortfolioConfig,
  fetchPortfolioSkills,
  fetchPortfolioArticles,
} from './services/api';
import type {
  PortfolioArticle,
  PortfolioConfig,
  PortfolioSkill,
} from './types/portfolio';
import { getMediaUrl } from './utils/media';
import './App.css';
import { Analytics } from '@vercel/analytics/react';

const SECTIONS = ['home', 'about-me', 'projects', 'contacts'];

export function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [config, setConfig] = useState<PortfolioConfig | null>(null);
  const [skills, setSkills] = useState<PortfolioSkill[]>([]);
  const [articles, setArticles] = useState<PortfolioArticle[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const lenisRef = useRef<Lenis | null>(null);
  const activeSectionIndexRef = useRef(0);

  // Fetch individual endpoints concurrently from baseurl
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch config (baseurl/config)
    fetchPortfolioConfig()
      .then((cfg) => {
        if (!isMounted) return;
        if (cfg) {
          setConfig(cfg);

          // Dynamic Document Title based on config.name
          if (cfg.name) {
            document.title = `${cfg.name} — Portfolio`;
          }

          // Dynamic Favicon using config.logo_url
          const faviconUrl = cfg.logo_url ? getMediaUrl(cfg.logo_url) : '';
          if (faviconUrl) {
            let favicon = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
            if (!favicon) {
              favicon = document.createElement('link');
              favicon.rel = 'icon';
              document.head.appendChild(favicon);
            }
            favicon.href = faviconUrl;
          }
        }
      })
      .catch((err) => console.warn('Error fetching config:', err))
      .finally(() => {
        if (isMounted) setIsLoadingConfig(false);
      });

    // 2. Fetch skills (baseurl/skills)
    fetchPortfolioSkills()
      .then((skillsData) => {
        if (isMounted && Array.isArray(skillsData)) {
          setSkills(skillsData);
        }
      })
      .catch((err) => console.warn('Error fetching skills:', err))
      .finally(() => {
        if (isMounted) setIsLoadingSkills(false);
      });

    // 3. Fetch articles (baseurl/articles)
    fetchPortfolioArticles()
      .then((articlesData) => {
        if (isMounted && Array.isArray(articlesData)) {
          setArticles(articlesData);
        }
      })
      .catch((err) => console.warn('Error fetching articles:', err))
      .finally(() => {
        if (isMounted) setIsLoadingArticles(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Smooth cinematic scroll transition on navbar navigation
  const handleNavigate = (sectionId: string) => {
    const targetEl = document.getElementById(sectionId);
    if (!targetEl) return;

    const idx = SECTIONS.indexOf(sectionId);
    if (idx !== -1) {
      activeSectionIndexRef.current = idx;
      setActiveSection(sectionId);
    }

    if (lenisRef.current) {
      // Smooth animated scroll with custom easing
      lenisRef.current.scrollTo(targetEl, {
        offset: 0,
        duration: 1.4,
        easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
        immediate: false,
        force: true,
      });
    } else {
      // Fallback
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Initialize Lenis with respectReducedMotion: false to guarantee smooth transitions
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.6,
      autoRaf: true, // Use Lenis internal optimized RAF loop
      respectReducedMotion: false, // Ensures programmatic scrollTo always animates smoothly
      infinite: false,
    });
    lenisRef.current = lenis;

    // Continuous real-time scroll synchronization
    const onScroll = () => {
      const vh = window.innerHeight || 1;

      // Determine active section based on proximity to center
      let bestIdx = 0;
      let minDiff = Infinity;
      SECTIONS.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();

          // If inside tall sticky sections (projects or about-me)
          if (id === 'projects' || id === 'about-me') {
            if (rect.top <= 100 && rect.bottom >= vh * 0.45) {
              bestIdx = idx;
              minDiff = -1;
              return;
            }
          }

          const diff = Math.abs(rect.top);
          if (diff < minDiff) {
            minDiff = diff;
            bestIdx = idx;
          }
        }
      });

      if (bestIdx !== activeSectionIndexRef.current) {
        activeSectionIndexRef.current = bestIdx;
        setActiveSection(SECTIONS[bestIdx]);
      }
    };

    lenis.on('scroll', onScroll);

    // Keyboard navigation (ArrowDown / ArrowUp / PageDown / PageUp)
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (['ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        const nextIdx = Math.min(SECTIONS.length - 1, activeSectionIndexRef.current + 1);
        handleNavigate(SECTIONS[nextIdx]);
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        const prevIdx = Math.max(0, activeSectionIndexRef.current - 1);
        handleNavigate(SECTIONS[prevIdx]);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    // Initial sync
    onScroll();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="portfolio-app">
      <Analytics />
      {/* Sleek circular white-border cursor tracker */}
      <CursorTracker />

      {/* Glassmorphic floating navbar with dynamic brand name */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        brandName={config?.name || 'Portfolio'}
      />

      {/* Fixed 3D canvas positioned in the background / layer with crash protection */}
      <ErrorBoundary>
        <ModelViewer />
      </ErrorBoundary>

      {/* Page Sections matching frontend template */}
      <main className="content-container">
        <HeroSection
          name={config?.name}
          shortDesc={config?.short_desc}
        />
        <AboutSection
          name={config?.name}
          desc={config?.desc}
          profileUrl={config?.profile_url}
          skills={skills}
          isLoading={isLoadingConfig || isLoadingSkills}
        />
        <ProjectsSection
          articles={articles}
          githubUrl={config?.github_url}
          isLoading={isLoadingArticles}
        />
        <ContactSection config={config} />
      </main>
    </div>
  );
}

export default App;
