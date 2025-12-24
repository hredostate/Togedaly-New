
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];

export const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameIdRef = useRef<number>(0);

  useEffect(() => {
    const trigger = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Burst origin (bottom center-ish)
      const originX = window.innerWidth / 2;
      const originY = window.innerHeight * 0.8;

      for (let i = 0; i < 100; i++) {
        particlesRef.current.push({
          x: originX,
          y: originY,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 1) * 20 - 5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 1,
          size: Math.random() * 8 + 4,
        });
      }
      
      if (!frameIdRef.current) {
        loop();
      }
    };

    window.addEventListener('trigger-confetti', trigger);
    
    const loop = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // Gravity
        p.vx *= 0.96; // Air resistance
        p.alpha -= 0.01; // Fade out

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Remove dead particles
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0 && p.y < canvas.height);

      if (particlesRef.current.length > 0) {
        frameIdRef.current = requestAnimationFrame(loop);
      } else {
        frameIdRef.current = 0;
      }
    };

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('trigger-confetti', trigger);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[10000]"
    />
  );
};
