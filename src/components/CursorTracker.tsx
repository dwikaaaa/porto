import { useEffect, useRef, useState } from 'react';
import './CursorTracker.css';

export function CursorTracker() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  // Coordinate and state refs to prevent re-renders during high-frequency mouse movements
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const dotPos = useRef({ x: -100, y: -100 });
  const isHovered = useRef(false);
  const isClicking = useRef(false);
  const isVisible = useRef(false);
  const [isSupportedDevice, setIsSupportedDevice] = useState(true);

  useEffect(() => {
    // Check if the device uses touch / coarse pointer
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsSupportedDevice(false);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

      if (!isVisible.current) {
        isVisible.current = true;
        // Snap initial position so it does not sweep in from top-left
        ringPos.current.x = e.clientX;
        ringPos.current.y = e.clientY;
        dotPos.current.x = e.clientX;
        dotPos.current.y = e.clientY;
        if (ringRef.current) ringRef.current.style.opacity = '1';
        if (dotRef.current) dotRef.current.style.opacity = '1';
      }

      // Check whether hovering over interactive clickable targets
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'a, button, input, textarea, select, [role="button"], [data-cursor-hover], .clickable, .social-pill, .nav-item, .project-card, .filter-chip'
        );
        isHovered.current = !!interactive;
      }
    };

    const onMouseDown = () => {
      isClicking.current = true;
    };

    const onMouseUp = () => {
      isClicking.current = false;
    };

    const onMouseLeave = () => {
      isVisible.current = false;
      if (ringRef.current) ringRef.current.style.opacity = '0';
      if (dotRef.current) dotRef.current.style.opacity = '0';
    };

    const onMouseEnter = () => {
      isVisible.current = true;
      if (ringRef.current) ringRef.current.style.opacity = '1';
      if (dotRef.current) dotRef.current.style.opacity = '1';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    let animationFrameId: number;

    const render = () => {
      // Lerp calculations for ultra-smooth fluid trailing
      const ringLerp = 0.16;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * ringLerp;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * ringLerp;

      const dotLerp = 0.65;
      dotPos.current.x += (mousePos.current.x - dotPos.current.x) * dotLerp;
      dotPos.current.y += (mousePos.current.y - dotPos.current.y) * dotLerp;

      if (ringRef.current) {
        const ringScale = isClicking.current ? 0.82 : isHovered.current ? 1.45 : 1;
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%) scale(${ringScale})`;

        if (isHovered.current) {
          ringRef.current.classList.add('cursor-ring--hover');
        } else {
          ringRef.current.classList.remove('cursor-ring--hover');
        }
      }

      if (dotRef.current) {
        const dotScale = isHovered.current ? 0.45 : isClicking.current ? 1.3 : 1;
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%) scale(${dotScale})`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  if (!isSupportedDevice) return null;

  return (
    <div className="cursor-tracker-root" aria-hidden="true">
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}

export default CursorTracker;
