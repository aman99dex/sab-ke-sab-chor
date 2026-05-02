import { useEffect, useRef } from "react";

export default function Background3D({ mode = "app" }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const PARTICLE_COUNT = mode === "intro" ? 180 : 120;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.2,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      alpha: Math.random() * 0.7 + 0.15,
      color: Math.random() > 0.6 ? "#ef4444" : Math.random() > 0.5 ? "#38bdf8" : "#6366f1",
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.015 + Math.random() * 0.02,
    }));

    const gridLines = Array.from({ length: 12 }, (_, i) => ({
      x: (width / 11) * i,
      alpha: 0.025 + Math.random() * 0.02,
    }));
    const hGridLines = Array.from({ length: 9 }, (_, i) => ({
      y: (height / 8) * i,
      alpha: 0.02 + Math.random() * 0.02,
    }));

    let frame = 0;

    function draw() {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Dark gradient background
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#020617");
      bg.addColorStop(0.5, "#0a0f1e");
      bg.addColorStop(1, "#0d0512");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Red glow top-right (siren effect)
      const t = frame * 0.012;
      const redX = width * 0.75 + Math.sin(t * 0.8) * 80;
      const redGrad = ctx.createRadialGradient(redX, height * 0.15, 0, redX, height * 0.15, 320);
      redGrad.addColorStop(0, `rgba(239,68,68,${0.08 + Math.sin(t * 1.3) * 0.04})`);
      redGrad.addColorStop(1, "transparent");
      ctx.fillStyle = redGrad;
      ctx.fillRect(0, 0, width, height);

      // Blue glow bottom-left
      const blueX = width * 0.2 + Math.cos(t * 0.6) * 60;
      const blueGrad = ctx.createRadialGradient(blueX, height * 0.75, 0, blueX, height * 0.75, 280);
      blueGrad.addColorStop(0, `rgba(56,189,248,${0.07 + Math.sin(t * 1.1 + 1) * 0.03})`);
      blueGrad.addColorStop(1, "transparent");
      ctx.fillStyle = blueGrad;
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      for (const gl of gridLines) {
        ctx.beginPath();
        ctx.moveTo(gl.x, 0);
        ctx.lineTo(gl.x, height);
        ctx.strokeStyle = `rgba(239,68,68,${gl.alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      for (const gl of hGridLines) {
        ctx.beginPath();
        ctx.moveTo(0, gl.y);
        ctx.lineTo(width, gl.y);
        ctx.strokeStyle = `rgba(56,189,248,${gl.alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Particles
      for (const p of particles) {
        p.pulse += p.pulseSpeed;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;
        if (p.y < -4) p.y = height + 4;
        if (p.y > height + 4) p.y = -4;

        const a = p.alpha * (0.6 + Math.sin(p.pulse) * 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(")", `,${a})`).replace("rgb(", "rgba(").replace("#ef4444", `rgba(239,68,68,${a})`).replace("#38bdf8", `rgba(56,189,248,${a})`).replace("#6366f1", `rgba(99,102,241,${a})`);
        ctx.fill();
      }

      // Wire connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const a = (1 - dist / 90) * 0.12;
            ctx.strokeStyle = `rgba(99,102,241,${a})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [mode]);

  return (
    <div className="canvas-bg">
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
