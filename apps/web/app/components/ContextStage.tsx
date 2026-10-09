"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";

type Props = {
  area: "buyer" | "producer" | "affiliate" | "admin";
  section: string;
  count: number;
};

const labels: Record<string, string> = {
  orders: "Pedidos em movimento",
  profile: "Sua presença na plataforma",
  security: "Proteção da conta",
  settings: "Configuração da experiência",
  programs: "Programas disponíveis",
  links: "Links em circulação",
  clicks: "Tráfego gerado",
  sales: "Vendas atribuídas",
  commissions: "Comissões em andamento",
  payouts: "Fluxo financeiro",
  users: "Base de usuários",
  products: "Catálogo da plataforma",
  transactions: "Movimentação financeira",
  refunds: "Fluxo de reembolso",
  disputes: "Casos em análise",
  webhooks: "Eventos recebidos",
  logs: "Atividade do sistema",
};

export default function ContextStage({ area, section, count }: Props) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const values = useMemo(() => {
    const base = Math.max(count, 1);
    return Array.from({ length: 8 }, (_, i) => Math.min(96, 26 + ((base * (i + 2) * 7) % 64)));
  }, [count]);

  const tone = area === "admin" ? "admin" : area === "affiliate" ? "affiliate" : area === "producer" ? "producer" : "buyer";
  const caption = labels[section] || "Operação em movimento";

  function move(clientX: number, clientY: number, rect: DOMRect) {
    const x = (clientX - rect.left) / rect.width - 0.5;
    const y = (clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -y * 6, y: x * 8 });
  }

  return (
    <div
      className={`context-stage context-stage-${tone}`}
      onMouseMove={(event) => move(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div className="context-stage-grid" />
      <div className="context-stage-ring context-stage-ring-a" />
      <div className="context-stage-ring context-stage-ring-b" />
      <div
        className="context-stage-card"
        style={{ transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` } as CSSProperties}
      >
        <div className="context-stage-head">
          <div>
            <span>{area.toUpperCase()} / {section.toUpperCase()}</span>
            <strong>{caption}</strong>
          </div>
          <div className="context-stage-counter">{count}</div>
        </div>
        <div className="context-stage-bars" aria-hidden="true">
          {values.map((value, index) => <i key={index} style={{ height: `${value}%` }} />)}
        </div>
        <div className="context-stage-floor">
          <span>{count === 0 ? "Sem dados ainda" : "Dados conectados à API"}</span>
          <b>LIVE</b>
        </div>
      </div>
    </div>
  );
}
