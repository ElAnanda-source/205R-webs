import { useEffect, useRef } from 'react';

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
  layer: 0 | 1 | 2;
  opacity: number;
  width: number;
}

interface CyberParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

interface LightningBolt {
  segments: { x: number; y: number }[];
  alpha: number;
}

interface CyberRainCanvasProps {
  intensity?: 'hero' | 'subtle';
  className?: string;
}

export function CyberRainCanvas({
  intensity = 'hero',
  className = '',
}: CyberRainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let pointerX = 0;
    let drops: RainDrop[] = [];
    let particles: CyberParticle[] = [];
    let activeBolt: LightningBolt | null = null;
    let lightningFlash = 0;
    let nextLightningAt = performance.now() + 3800 + Math.random() * 6200;
    let lastDrawAt = 0;

    const buildElements = () => {
      const isMobile = width < 768;
      const dropCount =
        intensity === 'hero' ? (isMobile ? 72 : 185) : isMobile ? 26 : 64;
      const particleCount =
        intensity === 'hero' ? (isMobile ? 16 : 36) : isMobile ? 8 : 16;

      drops = Array.from({ length: dropCount }, (_, idx) => {
        const layer = (idx % 3) as 0 | 1 | 2;
        const speedScale = layer === 0 ? 0.65 : layer === 1 ? 1.0 : 1.48;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          len: (layer === 0 ? 14 : layer === 1 ? 24 : 36) + Math.random() * 18,
          speed: (12 + Math.random() * 8) * speedScale,
          layer,
          opacity:
            intensity === 'hero'
              ? layer === 0
                ? 0.08
                : layer === 1
                  ? 0.17
                  : 0.34
              : layer === 0
                ? 0.04
                : layer === 1
                  ? 0.09
                  : 0.16,
          width: layer === 2 ? 1.2 : 0.75,
        };
      });

      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.35,
        radius: 0.8 + Math.random() * 1.4,
        alpha: 0.12 + Math.random() * 0.24,
      }));
    };

    const spawnBolt = () => {
      const startX = width * (0.16 + Math.random() * 0.68);
      let cx = startX;
      let cy = 0;
      const segments: { x: number; y: number }[] = [{ x: cx, y: cy }];
      const steps = 6 + Math.floor(Math.random() * 4);
      const targetHeight = height * (0.28 + Math.random() * 0.26);

      for (let i = 1; i <= steps; i += 1) {
        cx += (Math.random() - 0.48) * 44;
        cy = (i / steps) * targetHeight;
        segments.push({ x: cx, y: cy });
      }
      activeBolt = { segments, alpha: 0.85 };
      lightningFlash = 0.22;
    };

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width || window.innerWidth;
      height = rect?.height || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildElements();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (width <= 0) return;
      pointerX = (e.clientX / width - 0.5) * 16;
    };

    const drawFrame = (now: number, animate: boolean) => {
      ctx.clearRect(0, 0, width, height);

      // Pure blackout obsidian fog with restrained electric-blue upper horizon glow
      const fog = ctx.createRadialGradient(
        width * 0.52,
        height * 0.18,
        width * 0.04,
        width * 0.5,
        height * 0.45,
        width * 0.85
      );
      fog.addColorStop(0, 'rgba(22, 139, 255, 0.09)');
      fog.addColorStop(0.38, 'rgba(9, 15, 24, 0.06)');
      fog.addColorStop(1, 'rgba(2, 3, 5, 0)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, width, height);

      // Electric lightning bolts & atmospheric storm illumination in hero
      if (animate && intensity === 'hero') {
        if (now >= nextLightningAt) {
          spawnBolt();
          nextLightningAt = now + 6500 + Math.random() * 9500;
        }

        if (lightningFlash > 0.004) {
          const flash = ctx.createRadialGradient(
            width * 0.5,
            height * 0.1,
            width * 0.05,
            width * 0.5,
            height * 0.45,
            width * 0.9
          );
          flash.addColorStop(0, `rgba(22, 139, 255, ${lightningFlash})`);
          flash.addColorStop(0.45, `rgba(0, 229, 255, ${lightningFlash * 0.42})`);
          flash.addColorStop(1, 'rgba(2, 3, 5, 0)');
          ctx.fillStyle = flash;
          ctx.fillRect(0, 0, width, height);
          lightningFlash *= 0.84;
        }

        if (activeBolt && activeBolt.alpha > 0.02) {
          ctx.save();
          ctx.beginPath();
          activeBolt.segments.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.strokeStyle = `rgba(22, 139, 255, ${activeBolt.alpha * 0.55})`;
          ctx.lineWidth = 4;
          ctx.stroke();

          ctx.strokeStyle = `rgba(234, 247, 255, ${activeBolt.alpha})`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
          ctx.restore();
          activeBolt.alpha *= 0.8;
        }
      }

      // Floating subtle cyber mist particles
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        const px = ((p.x + pointerX * 0.4) % width + width) % width;
        ctx.beginPath();
        ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha})`;
        ctx.arc(px, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        if (animate) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -6) {
            p.y = height + 6;
            p.x = Math.random() * width;
          }
        }
      }

      // Fast wind-angled rain streaks
      const windDx = -2.1;
      for (let i = 0; i < drops.length; i += 1) {
        const d = drops[i];
        const parallaxShift = (d.layer + 1) * pointerX * 0.45;
        const drawX = ((d.x + parallaxShift) % width + width) % width;

        ctx.beginPath();
        ctx.strokeStyle =
          d.layer === 2
            ? `rgba(0, 229, 255, ${d.opacity})`
            : d.layer === 1
              ? `rgba(22, 139, 255, ${d.opacity})`
              : `rgba(234, 247, 255, ${d.opacity})`;
        ctx.lineWidth = d.width;
        ctx.moveTo(drawX, d.y);
        ctx.lineTo(drawX + windDx, d.y + d.len);
        ctx.stroke();

        if (intensity === 'hero' && d.layer === 2 && d.y + d.len > height - 24) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(0, 229, 255, 0.16)';
          ctx.ellipse(drawX + windDx, height - 8, 4.5, 1.1, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        if (animate) {
          d.y += d.speed;
          d.x -= 0.75 * (d.layer + 1) * 0.4;
          if (d.y > height + 12) {
            d.y = -d.len - Math.random() * 48;
            d.x = Math.random() * width;
          }
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    if (!prefersReducedMotion) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    if (prefersReducedMotion) {
      drawFrame(performance.now(), false);
    } else {
      const loop = (now: number) => {
        if (now - lastDrawAt >= 26) {
          lastDrawAt = now;
          drawFrame(now, true);
        }
        rafId = window.requestAnimationFrame(loop);
      };
      rafId = window.requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="cyber-rain-canvas"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    />
  );
}
