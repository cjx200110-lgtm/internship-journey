"use client";

import { useEffect, useRef } from "react";

const nodes = [
  { key: "doc", angle: 250 },
  { key: "chart", angle: 305 },
  { key: "check", angle: 350 },
  { key: "bulb", angle: 45 },
  { key: "note", angle: 95 },
  { key: "user", angle: 145 },
  { key: "calendar", angle: 200 },
  { key: "ai", angle: 225 }
];

export default function HeroOrbit() {
  const planeRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    let frameId;
    let theta = 0;
    const speed = 0.08;

    function orbit() {
      const plane = planeRef.current;
      if (!plane) {
        return;
      }

      const width = plane.clientWidth || 1080;
      const height = plane.clientHeight || 620;
      const rx = width * 0.41;
      const ry = height * 0.4;
      theta = (theta + speed) % 360;

      nodes.forEach((node, index) => {
        const el = itemRefs.current[index];
        if (!el) {
          return;
        }

        const deg = (node.angle + theta) % 360;
        const rad = (deg * Math.PI) / 180;
        const x = rx * Math.cos(rad);
        const y = ry * Math.sin(rad);
        const depth = (Math.sin(rad) + 1) / 2;
        const scale = 0.72 + depth * 0.3;
        const blur = depth < 0.42 ? 6 - depth * 9 : 0;
        const opacity = 0.3 + depth * 0.74;

        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
        el.style.filter = `blur(${blur}px)`;
        el.style.opacity = opacity;
        el.style.zIndex = String(Math.round(depth * 100));
      });

      frameId = requestAnimationFrame(orbit);
    }

    orbit();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="orbit">
      <div className="orbit-plane" ref={planeRef}>
        <div className="orbit-line" />
        <div className="orbit-dot dot-top" />
        <div className="orbit-dot dot-upper-right" />
        <div className="orbit-dot dot-lower-right" />
        <div className="orbit-dot dot-bottom" />
        <div className="orbit-dot dot-lower-left" />
        <div className="orbit-dot dot-upper-left" />
        {nodes.map((node, index) => (
          <div
            className="orbit-item"
            key={node.key}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
          >
            <img src={`/icons/${node.key}.png`} alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}
