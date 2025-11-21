"use client";

import { useRef, useEffect } from "react";

export function EnergyWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
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
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      // Fade effect for trails
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      timeRef.current += 0.05;
      
      const lines = 20;
      const step = canvas.height / lines;

      for (let i = 0; i < lines; i++) {
        ctx.beginPath();
        const yBase = i * step;
        
        for (let x = 0; x < canvas.width; x += 20) {
          // Distance from mouse influence
          const dx = mouseRef.current.x - x;
          const dy = mouseRef.current.y - yBase;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, (300 - dist) / 300);
          
          const yOffset = Math.sin(x * 0.01 + timeRef.current + i) * 20;
          const mouseOffset = Math.sin(dist * 0.05 - timeRef.current * 2) * influence * 50;
          
          const y = yBase + yOffset + mouseOffset;
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        ctx.strokeStyle = `hsla(${200 + i * 5}, 80%, 60%, 0.3)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none -z-10 mix-blend-screen"
    />
  );
}
