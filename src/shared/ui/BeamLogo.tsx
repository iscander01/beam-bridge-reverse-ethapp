import { useState, useRef, useEffect } from 'react';

export function BeamLogo({ className = 'h-10 w-10' }: { className?: string }) {
  const [hover, setHover] = useState(false);
  const maskCircleRef = useRef<SVGCircleElement>(null);
  const animationRef = useRef<number | null>(null);
  const animationStateRef = useRef<{
    startRadius: number;
    endRadius: number;
    currentRadius: number;
    startTime: number | null;
    duration: number;
    direction: 'forward' | 'reverse' | null;
  }>({
    startRadius: 0,
    endRadius: 30,
    currentRadius: 0,
    startTime: null,
    duration: 600,
    direction: null,
  });

  // Initialize animation state (like GSAP's paused: true)
  useEffect(() => {
    if (!maskCircleRef.current) return;
    animationStateRef.current.currentRadius = 0;
    maskCircleRef.current.setAttribute('r', '0');
  }, []);

  // Control animation play/reverse based on hover (matching GSAP behavior)
  useEffect(() => {
    if (!maskCircleRef.current) return;

    const state = animationStateRef.current;
    const targetRadius = hover ? state.endRadius : state.startRadius;
    const currentRadius = state.currentRadius;

    // If already at target, don't animate
    if (Math.abs(currentRadius - targetRadius) < 0.01) {
      return;
    }

    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const direction = hover ? 'forward' : 'reverse';
    state.direction = direction;
    state.startTime = null;

    const animate = (timestamp: number) => {
      if (state.startTime === null) {
        state.startTime = timestamp;
      }

      const elapsed = timestamp - state.startTime;
      const progress = Math.min(elapsed / state.duration, 1);

      // Linear easing (matching GSAP ease: "linear")
      if (maskCircleRef.current) {
        if (direction === 'forward') {
          // Play: current -> end (30)
          state.currentRadius = currentRadius + (state.endRadius - currentRadius) * progress;
        } else {
          // Reverse: current -> start (0)
          state.currentRadius = currentRadius - currentRadius * progress;
        }

        maskCircleRef.current.setAttribute('r', String(state.currentRadius));
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        state.currentRadius = targetRadius;
        animationRef.current = null;
        state.direction = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [hover]);

  const handleTouchEnd = () => {
    setTimeout(() => {
      setHover(false);
    }, 1000);
  };

  return (
    <div
      className={`grid items-center justify-center ${className} transition-transform duration-[600ms] hover:will-change-transform select-none ${
        hover ? 'scale-125' : ''
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchEnd={handleTouchEnd}
      style={{ gridColumn: 1, gridRow: 1 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 57 40"
        className={`${className} -mt-0.5 z-50`}
        style={{ gridColumn: 1, gridRow: 1 }}
        aria-label="BEAM Logo"
      >
        <defs>
          <linearGradient id="x" x1="0%" x2="100%" y1="50%" y2="50%">
            <stop offset="0%" stopColor="#24C1FF" />
            <stop offset="48.99%" stopColor="#24C1FF" />
            <stop offset="49%" stopColor="#0B76FF" />
            <stop offset="100%" stopColor="#0B76FF" />
          </linearGradient>
          <linearGradient id="z" x1="0%" x2="100%" y1="50%" y2="50%">
            <stop offset="0%" stopColor="#6BFFFA" />
            <stop offset="49.99%" stopColor="#6BFFFA" />
            <stop offset="50%" stopColor="#00E2C2" />
            <stop offset="100%" stopColor="#00E2C2" />
          </linearGradient>
          <linearGradient id="aa" x1="0%" x2="54.8%" y1="50.2%" y2="50.2%">
            <stop offset="0%" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFF" />
          </linearGradient>
          <linearGradient id="bb" x1="99.4%" x2="35.8%" y1="49.8%" y2="49.8%">
            <stop offset="0%" stopOpacity="0" />
            <stop offset="100%" stopColor="#FF51FF" />
          </linearGradient>
          <linearGradient id="cc" x1="100.4%" x2="48.9%" y1="50.1%" y2="50.1%">
            <stop offset="0%" stopOpacity="0" />
            <stop offset="100%" stopColor="#A18CFF" />
          </linearGradient>
          <linearGradient id="dd" x1="99.9%" x2="41.1%" y1="50.2%" y2="50.2%">
            <stop offset="0%" stopOpacity="0" />
            <stop offset="100%" stopColor="#AB38E6" />
          </linearGradient>
        </defs>
        <g fill="none">
          <path fill="url(#x)" d="M28 0L52 40H4L28 0Zm0 13L17 33h22L28 13Z" />
          <path fill="url(#z)" d="M28 18l8 13H21z" />
          <mask id="raysMask">
            <rect width="100%" height="100%" fill="white" />
            <circle
              id="maskCircle"
              ref={maskCircleRef}
              cx="28.5"
              cy="20"
              r="0"
              fill="black"
            />
          </mask>
        </g>
        <g fill="none" mask="url(#raysMask)">
          <path id="ray1" fill="url(#aa)" d="m0 13 28 13v1L0 21z" />
          <path id="ray2" fill="url(#bb)" d="M57 9 28 26l29-12z" />
          <path id="ray3" fill="url(#cc)" d="m57 25-29 2 29-7z" />
          <path id="ray4" fill="url(#dd)" d="M57 14 28 26v1l29-7z" />
        </g>
      </svg>
    </div>
  );
}
