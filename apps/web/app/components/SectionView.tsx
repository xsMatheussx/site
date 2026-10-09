"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "./SiteShell";
import ContextStage from "./ContextStage";
import styles from "./SectionView.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

type Props = { area: "buyer" | "affiliate" | "admin"; section: string };

const labels: Record<string, string> = {
  orders: "Pedidos", profile: "Meu perfil", security: "Segurança", settings: "Configurações", payments: "Pagamentos",
  programs: "Programas", links: "Links", clicks: "Cliques", sales: "Vendas", commissions: "Comissões", payouts: "Pagamentos",
  users: "Usuários", products: "Produtos", transactions: "Transações", refunds: "Reembolsos", disputes: "Disputas", webhooks: "Webhooks", logs: "Logs",
};

const endpoint: Record<string, string> = {
  "admin:products": "/admin/products",
  "admin:transactions": "/finance/entries",
  "admin:disputes": "/finance/disputes",
  "affiliate:programs": "/affiliates/opportunities",
  "affiliate:links": "/affiliates/links",
  "buyer:orders": "/delivery/mine",
};

function titleFor(area:string, section:string){ return labels[section] || "Área"; }
function money(v:number){ return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v/100); }
function token(){ return typeof window !== "undefined" ? localStorage.getItem("tz_access_token") || "" : ""; }

export default function SectionView({area,section}:Props){
  const [data,setData]=useState<any[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const key=`${area}:${section}`; const url=endpoint[key];
  const title=titleFor(area,section);
  const desc=useMemo(()=> area==="admin"?"Gestão e acompanhamento da plataforma.":area==="affiliate"?"Acompanhe sua operação de afiliado.":"Gerencie sua conta e suas compras.",[area]);
  useEffect(()=>{
    if(!url){setLoading(false);return;}
    const t=token();
    if(!t && !url.includes("opportunities")){setError("Faça login para acessar esta área.");setLoading(false);return;}
    fetch(`${API}${url}`,{headers:t?{Authorization:`Bearer ${t}`}:{}}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j?.message||"Não foi possível carregar esta área.");return j;}).then(j=>setData(Array.isArray(j)?j:j?.data?j.data:[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  },[url]);
  const unsupported=!url;
  return <DashboardShell area={area} title={title} description={desc}>
    <div className={styles.page}>
      <div className={styles.toolbar}><div><div className={styles.kicker}>{area}</div><h1 className={styles.title}>{title}</h1><p className={styles.description}>{desc}</p></div><div className={styles.actions}><Link href={area==="admin"?"/admin":area==="affiliate"?"/affiliate":"/account"} className={`${styles.button} ${styles.buttonPrimary}`}>Voltar ao dashboard</Link></div></div>
      {!unsupported && !error && !loading && <ContextStage area={area} section={section} count={data.length} />}
      {unsupported?<div className={styles.empty}><h2>Esta área ainda não tem uma API correspondente.</h2><p>O projeto não possui atualmente um modelo ou endpoint para expor dados de <strong>{title.toLowerCase()}</strong>. A navegação permanece funcional sem inventar dados.</p></div>:error?<div className={styles.error}>{error}</div>:loading?<div className={styles.loading}>Carregando...</div>:data.length===0?<div className={styles.empty}><h2>Nenhum registro encontrado.</h2><p>Quando houver dados disponíveis, eles aparecerão aqui.</p></div>:<div className={styles.table}><div className={styles.head}><span>Registro</span><span>Detalhes</span><span>Status</span><span>Valor</span></div>{data.map((item:any,i:number)=>{const name=item.name||item.product?.name||item.sale?.product?.name||item.id||`Registro ${i+1}`;const detail=item.email||item.customer?.email||item.product?.slug||item.code||item.type||item.method||"—";const status=item.status||item.order?.status||"—";const value=typeof item.amount==="number"?money(item.amount):typeof item.total==="number"?money(item.total):typeof item.price==="number"?money(item.price):typeof item.commissionValue==="number"?money(item.commissionValue):"—";return <div className={styles.row} key={String(item.id||i)}><strong>{name}</strong><span className={styles.muted}>{String(detail)}</span><span className={styles.status}>{String(status)}</span><span>{value}</span></div>})}</div>}
    </div>
  </DashboardShell>;
}
