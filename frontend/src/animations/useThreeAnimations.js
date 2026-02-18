import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Custom hook for Three.js 3D animations
 * Perfect for hero sections and 3D backgrounds
 */
export const useThreeScene = (containerRef, options = {}) => {
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  const {
    width = 800,
    height = 600,
    backgroundColor = 0x000000,
    enableGridHelper = false,
    enableAxis = false,
    ...restOptions
  } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(backgroundColor, 1);
    rendererRef.current = renderer;

    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

    // Optional helpers
    if (enableGridHelper) {
      const gridHelper = new THREE.GridHelper(10, 10);
      scene.add(gridHelper);
    }

    if (enableAxis) {
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);
    }

    // Default animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth || width;
      const newHeight = containerRef.current?.clientHeight || height;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height, backgroundColor, enableGridHelper, enableAxis]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    containerRef
  };
};

/**
 * Create animated 3D cube
 * Great for loading indicators or hero animations
 */
export const createAnimatedCube = (scene, options = {}) => {
  const {
    size = 2,
    color = 0x00ff00,
    rotationSpeed = { x: 0.01, y: 0.01, z: 0 }
  } = options;

  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshPhongMaterial({ color });
  const cube = new THREE.Mesh(geometry, material);

  // Add lighting for better visibility
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  scene.add(cube);

  // Rotation animation
  const animateCube = () => {
    cube.rotation.x += rotationSpeed.x;
    cube.rotation.y += rotationSpeed.y;
    cube.rotation.z += rotationSpeed.z;
    requestAnimationFrame(animateCube);
  };
  animateCube();

  return cube;
};

/**
 * Create animated floating particles
 * Perfect for background animations
 */
export const createParticles = (scene, count = 100, options = {}) => {
  const {
    size = 0.1,
    color = 0x00aaff,
    speed = 0.01
  } = options;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 20;
    positions[i + 1] = (Math.random() - 0.5) * 20;
    positions[i + 2] = (Math.random() - 0.5) * 20;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: size,
    color: color,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Animation
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    velocities[i] = (Math.random() - 0.5) * speed;
  }

  const animateParticles = () => {
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < count * 3; i++) {
      positions[i] += velocities[i];
      if (positions[i] > 10) positions[i] = -10;
      if (positions[i] < -10) positions[i] = 10;
    }
    geometry.attributes.position.needsUpdate = true;
    requestAnimationFrame(animateParticles);
  };
  animateParticles();

  return particles;
};
