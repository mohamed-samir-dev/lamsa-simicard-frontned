"use client";
import { motion } from "framer-motion";

const shapes = [
  { type: "circle", size: 140, x: "8%", y: "5%", delay: 0, duration: 18 },
  { type: "square", size: 90, x: "80%", y: "8%", delay: 2, duration: 22 },
  { type: "triangle", size: 110, x: "70%", y: "25%", delay: 1, duration: 20 },
  { type: "circle", size: 70, x: "15%", y: "35%", delay: 3, duration: 16 },
  { type: "square", size: 60, x: "50%", y: "18%", delay: 1.5, duration: 24 },
  { type: "circle", size: 100, x: "88%", y: "45%", delay: 0.5, duration: 19 },
  { type: "triangle", size: 80, x: "25%", y: "55%", delay: 2.5, duration: 21 },
  { type: "square", size: 50, x: "92%", y: "65%", delay: 4, duration: 17 },
  { type: "circle", size: 120, x: "5%", y: "70%", delay: 1, duration: 23 },
  { type: "triangle", size: 90, x: "60%", y: "75%", delay: 3.5, duration: 18 },
  { type: "square", size: 70, x: "40%", y: "85%", delay: 2, duration: 20 },
  { type: "circle", size: 80, x: "75%", y: "90%", delay: 0, duration: 15 },
];

function Shape({ type, size, x, y, delay, duration }: typeof shapes[number]) {
  const common = {
    position: "absolute" as const,
    left: x,
    top: y,
    width: size,
    height: size,
  };

  const anim = {
    y: [0, -25, 0],
    rotate: [0, 180, 360],
    scale: [1, 1.08, 1],
  };

  const transition = {
    duration,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay,
  };

  if (type === "circle") {
    return (
      <motion.div
        style={{ ...common, borderRadius: "50%", border: "2px solid rgba(13,148,136,0.18)", background: "rgba(13,148,136,0.06)" }}
        animate={anim}
        transition={transition}
      />
    );
  }

  if (type === "square") {
    return (
      <motion.div
        style={{ ...common, borderRadius: 14, border: "2px solid rgba(13,148,136,0.15)", background: "rgba(13,148,136,0.05)" }}
        animate={anim}
        transition={transition}
      />
    );
  }

  return (
    <motion.div
      style={{ ...common, background: "transparent" }}
      animate={anim}
      transition={transition}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <polygon
          points="50,10 90,90 10,90"
          fill="rgba(13,148,136,0.06)"
          stroke="rgba(13,148,136,0.18)"
          strokeWidth="2"
        />
      </svg>
    </motion.div>
  );
}

export default function BackgroundShapes() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {shapes.map((s, i) => (
        <Shape key={i} {...s} />
      ))}
    </div>
  );
}
