"use client";

import { useMemo, useState } from "react";

export default function ProducerVisual({
  products,
  published,
  drafts,
  offers,
}: {
  products: number;
  published: number;
  drafts: number;
  offers: number;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const bars = useMemo(() => {
    const base = Math.max(products, 1);
    return [
      Math.min(94, 24 + published * 8),
      Math.min(94, 18 + base * 5),
      Math.min(94, 31 + offers * 6),
      Math.min(94, 22 + published * 11),
      Math.min(94, 40 + offers * 7),
      Math.min(94, 48 + published * 9),
      Math.min(98, 58 + Math.max(published, 1) * 8),
    ];
  }, [products, published, offers]);

  function move(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -7, y: px * 9 });
  }

  return (
    <section className="producer-visual" onMouseMove={move} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
      <div className="producer-visual-orbit producer-visual-orbit-a" />
      <div className="producer-visual-orbit producer-visual-orbit-b" />
      <div
        className="producer-visual-card"
        style={{ transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="producer-visual-head">
          <div>
            <span>STORE PULSE</span>
            <strong>Operação em movimento.</strong>
          </div>
          <b>{published > 0 ? "ATIVO" : "PREPARANDO"}</b>
        </div>

        <div className="producer-visual-graph">
          {bars.map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>

        <div className="producer-visual-metrics">
          <div><span>Catálogo</span><strong>{products}</strong></div>
          <div><span>Publicados</span><strong>{published}</strong></div>
          <div><span>Ofertas</span><strong>{offers}</strong></div>
        </div>

        <div className="producer-visual-chip">
          <i />
          {drafts ? `${drafts} rascunho${drafts === 1 ? "" : "s"} esperando você` : "Tudo pronto para vender"}
        </div>
      </div>
    </section>
  );
}
