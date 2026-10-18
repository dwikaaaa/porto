import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface ModelViewerProps {
  scrollProgress?: number; // Optional: 0 (Hero) to 1 (About Me) and beyond
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ scrollProgress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // References for animation and interaction
  const targetRotationYRef = useRef<number>(0);
  const currentRotationYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const previousPointerXRef = useRef<number>(0);
  const targetPositionXRef = useRef<number>(0);
  const targetPositionYRef = useRef<number>(-0.5);
  const targetPositionZRef = useRef<number>(0);
  const targetScaleRef = useRef<number>(1);
  const scrollProgressRef = useRef<number | undefined>(scrollProgress);

  // Keep scrollProgressRef updated if provided externally
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = null;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7.8);

    // 3. Renderer setup - Optimized for mobile memory & thermal stability
    const isInitialMobile = window.innerWidth < 960;
    const renderer = new THREE.WebGLRenderer({
      antialias: !isInitialMobile, // Disable MSAA on mobile to prevent 40MB renderbuffer allocation
      alpha: true,
      powerPreference: isInitialMobile ? 'default' : 'high-performance',
      precision: isInitialMobile ? 'mediump' : 'highp',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isInitialMobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // WebGL Context Loss & Restoration Listeners
    let isContextLost = false;
    const domElement = renderer.domElement;

    const onContextLost = (e: Event) => {
      e.preventDefault(); // Prevents browser from permanently disabling WebGL
      isContextLost = true;
      console.warn('WebGL context lost. ModelViewer render paused.');
    };

    const onContextRestored = () => {
      isContextLost = false;
      console.log('WebGL context restored. ModelViewer render resumed.');
    };

    domElement.addEventListener('webglcontextlost', onContextLost, false);
    domElement.addEventListener('webglcontextrestored', onContextRestored, false);

    // 4. Lights setup (Gothic statue atmosphere)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.8);
    keyLight.position.set(3.5, 7, 5.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.4);
    fillLight.position.set(-5, 4, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.6);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    const groundBounce = new THREE.DirectionalLight(0x94a3b8, 0.5);
    groundBounce.position.set(0, -4, 3);
    scene.add(groundBounce);

    // 5. Model container group
    const rootGroup = new THREE.Group();
    const pivotGroup = new THREE.Group(); // Inner group for rotation
    rootGroup.add(pivotGroup);
    scene.add(rootGroup);

    // 6. Load frank.glb
    const loader = new GLTFLoader();
    const modelUrl = '/assets/3d/frank.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Auto-compute bounding box to center and scale uniformly
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // Slightly bigger scale as requested: 4.85 / maxDim (was 3.65)
        const scale = 4.85 / maxDim;
        model.scale.setScalar(scale);

        // Center model within pivot
        model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

        // Materials setup
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = Math.max(0.65, mat.roughness || 0.7);
              mat.metalness = Math.min(0.2, mat.metalness || 0.1);
            }
          }
        });

        pivotGroup.add(model);
        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.error('Error loading frank.glb:', err);
        setLoading(false);
      }
    );

    // 7. Pointer drag handlers - ONLY HORIZONTAL ROTATION
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isDraggingRef.current = true;
      previousPointerXRef.current = e.clientX;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousPointerXRef.current;
      previousPointerXRef.current = e.clientX;

      // Adjust target horizontal rotation (Y axis) based on delta X
      targetRotationYRef.current += deltaX * 0.0085;
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // 8. Resize handler - Guarded against mobile address bar height fluctuations
    let lastWidth = container.clientWidth;
    let lastHeight = container.clientHeight;

    const onResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Update camera aspect (inexpensive CPU math)
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // On mobile, the URL bar expands/collapses by ~50-80px during slow scroll, firing resize continuously.
      // NEVER reallocate WebGL buffers unless width changes (screen orientation) or height change is major (>180px)
      const widthChanged = Math.abs(width - lastWidth) > 2;
      const heightChangedMajor = Math.abs(height - lastHeight) > 180;

      if (widthChanged || heightChangedMajor) {
        lastWidth = width;
        lastHeight = height;
        const isMobileNow = width < 960;
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileNow ? 1.5 : 2));
      }
    };
    window.addEventListener('resize', onResize);

    // 9. Animation loop with safety checks and conditional rendering
    let animationFrameId: number;
    let lastAppliedOpacity = -1;
    let lastAppliedPointerEvents = '';

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto-spin slowly on its own when user is not dragging
      if (!isDraggingRef.current) {
        targetRotationYRef.current += 0.003;
      }

      // Smooth horizontal rotation interpolation
      currentRotationYRef.current +=
        (targetRotationYRef.current - currentRotationYRef.current) * 0.08;
      pivotGroup.rotation.y = currentRotationYRef.current;

      // Strictly lock pitch and roll to 0 (horizontal rotation only, no vertical tilt)
      pivotGroup.rotation.x = 0;
      pivotGroup.rotation.z = 0;

      // Fixed vertical position (NO up-and-down oscillation / NO idleFloat)
      const fixedY = -0.48;

      // Determine progress using documentElement clientHeight to prevent address-bar bounce
      const vh = document.documentElement.clientHeight || window.innerHeight || 1;
      const windowProgress = Math.max(0, window.scrollY / vh);
      const progress = typeof scrollProgressRef.current === 'number' && scrollProgressRef.current > 0
        ? scrollProgressRef.current
        : windowProgress;

      const isMobile = window.innerWidth < 960;
      // On mobile: model is absolute in Hero section, visible whenever Hero is in viewport (< 1.05)
      // On desktop: model travels through Hero and About Me Stage 1 (< 2.05)
      const isVisible = isMobile ? progress < 1.05 : progress < 2.05;

      let targetOpacity = 0;
      let targetPointerEvents = 'none';

      if (isMobile) {
        // Option 1 (Natural Scroll): Model is pinned in Hero with constant opacity 1.
        // No fade-in or fade-out calculations, completely eliminating slow-scroll GPU crashes!
        targetPositionXRef.current = 0;
        targetPositionYRef.current = fixedY;
        targetPositionZRef.current = 0;
        targetScaleRef.current = 0.95;
        targetOpacity = 1;
        targetPointerEvents = 'auto';
      } else {
        // Desktop
        if (progress <= 0.05) {
          // Centered on First Page (Hero)
          targetPositionXRef.current = 0;
          targetPositionYRef.current = fixedY;
          targetPositionZRef.current = 0;
          targetScaleRef.current = 1.0;
          targetOpacity = 1;
          targetPointerEvents = 'auto';
        } else if (progress <= 1.0) {
          // Transition smoothly from Center to Left (About Me Stage 1)
          const t = progress;
          const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          targetPositionXRef.current = -2.35 * eased;
          targetPositionYRef.current = fixedY;
          targetPositionZRef.current = 0.25 * eased;
          targetScaleRef.current = 1.0 + 0.12 * eased;
          targetOpacity = 1;
          targetPointerEvents = 'auto';
        } else if (progress <= 1.15) {
          // Pinned on About Me (Stage 1: Model on Left)
          targetPositionXRef.current = -2.35;
          targetPositionYRef.current = fixedY;
          targetPositionZRef.current = 0.25;
          targetScaleRef.current = 1.12;
          targetOpacity = 1;
          targetPointerEvents = 'auto';
        } else {
          // Model fades out and translates leftwards as user scrolls into Stage 2
          const exit = Math.min(1, Math.max(0, (progress - 1.15) / 0.85));
          targetPositionXRef.current = -2.35 - exit * 2.8;
          targetPositionYRef.current = fixedY;
          targetPositionZRef.current = 0.25;
          // SAFE CLAMP: Never allow scale to reach 0 (keeps matrix determinant healthy)
          targetScaleRef.current = Math.max(0.2, 1.12 * (1 - exit * 0.8));
          targetOpacity = Math.max(0, 1 - exit * 1.4);
          targetPointerEvents = exit > 0.4 ? 'none' : 'auto';
        }
      }

      // Batch DOM mutations and avoid redundant writes
      const roundedOpacity = Math.round(targetOpacity * 100) / 100;
      if (Math.abs(roundedOpacity - lastAppliedOpacity) >= 0.01) {
        lastAppliedOpacity = roundedOpacity;
        container.style.opacity = roundedOpacity.toString();
      }
      if (lastAppliedPointerEvents !== targetPointerEvents) {
        lastAppliedPointerEvents = targetPointerEvents;
        container.style.pointerEvents = targetPointerEvents;
      }

      // Safe position lerp with NaN checks
      const targetX = targetPositionXRef.current;
      const targetY = targetPositionYRef.current;
      const targetZ = targetPositionZRef.current;

      if (Number.isFinite(targetX)) {
        const curX = Number.isFinite(rootGroup.position.x) ? rootGroup.position.x : targetX;
        rootGroup.position.x = curX + (targetX - curX) * 0.18;
      }
      if (Number.isFinite(targetY)) {
        const curY = Number.isFinite(rootGroup.position.y) ? rootGroup.position.y : targetY;
        rootGroup.position.y = curY + (targetY - curY) * 0.18;
      }
      if (Number.isFinite(targetZ)) {
        const curZ = Number.isFinite(rootGroup.position.z) ? rootGroup.position.z : targetZ;
        rootGroup.position.z = curZ + (targetZ - curZ) * 0.18;
      }

      // Safe scale lerp with NaN checks (guarantee strictly positive scale)
      const currentScale = Number.isFinite(rootGroup.scale.x) && rootGroup.scale.x > 0.05
        ? rootGroup.scale.x
        : 1.0;
      const targetScale = Number.isFinite(targetScaleRef.current) && targetScaleRef.current > 0.05
        ? targetScaleRef.current
        : 1.0;
      const newScale = currentScale + (targetScale - currentScale) * 0.18;
      if (Number.isFinite(newScale) && newScale > 0.05) {
        rootGroup.scale.setScalar(newScale);
      }

      // Toggle Three.js visibility
      rootGroup.visible = isVisible;

      // Only perform GPU render if model is visible and WebGL context is active
      if (isVisible && !isContextLost) {
        try {
          renderer.render(scene, camera);
        } catch (err) {
          console.warn('ModelViewer WebGL render error suppressed:', err);
        }
      }
    };

    animate();

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('webglcontextlost', onContextLost);
      domElement.removeEventListener('webglcontextrestored', onContextRestored);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="model-canvas-container"
      title="Click and drag horizontally to rotate the statue"
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="model-loading-overlay">
          <div className="model-loader-spinner"></div>
          <p className="model-loading-text">
            Awakening statue... {loadingProgress > 0 ? `${loadingProgress}%` : ''}
          </p>
        </div>
      )}
    </div>
  );
};
