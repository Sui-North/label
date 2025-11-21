"use client";

import { useEffect, useRef } from "react";
import { useCursorEffect } from "@/hooks/use-cursor-effect";

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export function CursorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { effect } = useCursorEffect();
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Point[]>([]);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x, y } = mouseRef.current;

      // Update trail
      trailRef.current.push({ x, y });
      if (trailRef.current.length > 20) trailRef.current.shift();

      // Render based on effect type
      if (effect === "hero") {
        // Data Stream Effect (Glowing Line)
        ctx.beginPath();
        ctx.moveTo(trailRef.current[0]?.x || x, trailRef.current[0]?.y || y);
        for (let i = 1; i < trailRef.current.length; i++) {
          const p = trailRef.current[i];
          ctx.lineTo(p.x, p.y);
        }
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#3b82f6";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#60a5fa";
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (effect === "features") {
        // Particle Field Effect
        if (Math.random() > 0.5) {
          particlesRef.current.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1,
            color: Math.random() > 0.5 ? "#8b5cf6" : "#ec4899",
            size: Math.random() * 3,
          });
        }
      } else if (effect === "stats") {
        // Spotlight Effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 150);
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.15)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 150, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect === "cta") {
        // Sparkle/Warp Effect
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: "#fbbf24",
            size: Math.random() * 4,
          });
        }
      }

      // Update and draw particles (shared logic)
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.size *= 0.95;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(requestRef.current);
    };
  }, [effect]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
