"use client";

import { useRef, useEffect } from "react";
import { useTheme } from "next-themes";

export function ActiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      timeRef.current += 0.02;
      
      const gridSize = 40;
      const cols = Math.ceil(canvas.width / gridSize);
      const rows = Math.ceil(canvas.height / gridSize);

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * gridSize;
          const y = j * gridSize;

          // Distance from mouse
          const dx = mouseRef.current.x - x;
          const dy = mouseRef.current.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Wave effect
          const wave = Math.sin(distance * 0.05 - timeRef.current) * 5;
          
          // Highlight effect
          const maxDist = 200;
          const alpha = distance < maxDist ? (maxDist - distance) / maxDist : 0;

          if (alpha > 0) {
            ctx.beginPath();
            ctx.arc(x, y, 2 + alpha * 3, 0, Math.PI * 2);
            ctx.fillStyle =
              resolvedTheme === "dark"
                ? `rgba(59, 130, 246, ${alpha * 0.5})`
                : `rgba(37, 99, 235, ${alpha * 0.4})`;
            ctx.fill();
          } else {
            ctx.fillStyle =
              resolvedTheme === "dark"
                ? "rgba(59, 130, 246, 0.05)"
                : "rgba(37, 99, 235, 0.08)";
            ctx.fillRect(x - 1, y - 1, 2, 2);
          }
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(requestRef.current);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none -z-10"
    />
  );
}
