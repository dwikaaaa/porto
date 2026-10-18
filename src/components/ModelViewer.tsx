import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface ModelViewerProps {
  scrollProgress: number; // 0 (Hero) to 1 (About Me) and beyond
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
  const scrollProgressRef = useRef<number>(0);

  // Keep scrollProgressRef updated
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

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

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

    // 8. Resize handler
    const onResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', onResize);

    // 9. Animation loop
    let animationFrameId: number;

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

      const progress = scrollProgressRef.current;
      const isMobile = window.innerWidth < 960;

      if (isMobile) {
        if (progress <= 0.25) {
          targetPositionXRef.current = 0;
          targetPositionYRef.current = fixedY;
          targetScaleRef.current = 0.95;
          container.style.opacity = '1';
          container.style.pointerEvents = 'auto';
        } else if (progress <= 1.15) {
          targetPositionXRef.current = 0;
          targetPositionYRef.current = fixedY;
          targetScaleRef.current = 0.85;
          container.style.opacity = '1';
          container.style.pointerEvents = 'auto';
        } else {
          // Beyond About Me: Disappear in Projects and down
          const exit = Math.min(1, Math.max(0, (progress - 1.15) / 0.35));
          targetScaleRef.current = Math.max(0, 0.85 * (1 - exit));
          container.style.opacity = (1 - exit).toString();
          container.style.pointerEvents = exit > 0.6 ? 'none' : 'auto';
        }
      } else {
        // Desktop
        if (progress <= 0.05) {
          // Centered on First Page (Hero)
          targetPositionXRef.current = 0;
          targetPositionYRef.current = fixedY;
          targetPositionZRef.current = 0;
          targetScaleRef.current = 1.0;
          container.style.opacity = '1';
          container.style.pointerEvents = 'auto';
        } else if (progress <= 1.0) {
          // Transition smoothly from Center to Left (About Me)
          const t = progress;
          const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          targetPositionXRef.current = -2.35 * eased;
          targetPositionYRef.current = fixedY;
          targetPositionZRef.current = 0.25 * eased;
          targetScaleRef.current = 1.0 + 0.12 * eased;
          container.style.opacity = '1';
          container.style.pointerEvents = 'auto';
        } else if (progress <= 1.1) {
          // Pinned on About Me
          targetPositionXRef.current = -2.35;
          targetPositionYRef.current = fixedY;
          targetPositionZRef.current = 0.25;
          targetScaleRef.current = 1.12;
          container.style.opacity = '1';
          container.style.pointerEvents = 'auto';
        } else {
          // Model stops at About Me, disappears from Projects downwards
          const exit = Math.min(1, Math.max(0, (progress - 1.1) / 0.35));
          targetPositionXRef.current = -2.35 - exit * 1.5;
          targetPositionYRef.current = fixedY;
          targetPositionZRef.current = 0.25;
          targetScaleRef.current = Math.max(0, 1.12 * (1 - exit));
          container.style.opacity = (1 - exit).toString();
          container.style.pointerEvents = exit > 0.6 ? 'none' : 'auto';
        }
      }

      // Smooth position lerp (responsive to scroll)
      rootGroup.position.x += (targetPositionXRef.current - rootGroup.position.x) * 0.18;
      rootGroup.position.y += (targetPositionYRef.current - rootGroup.position.y) * 0.18;
      rootGroup.position.z += (targetPositionZRef.current - rootGroup.position.z) * 0.18;

      // Smooth scale lerp
      const currentScale = rootGroup.scale.x;
      const newScale = currentScale + (targetScaleRef.current - currentScale) * 0.18;
      rootGroup.scale.setScalar(newScale);

      renderer.render(scene, camera);
    };

    animate();

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
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
