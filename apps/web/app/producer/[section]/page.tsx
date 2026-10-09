"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DashboardShell } from "../../components/SiteShell";
import ContextStage from "../../components/ContextStage";
import homeStyles from "../../Home.module.css";
import styles from "./ProducerSection.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const sectionInfo: Record<string, { title: string; description: string; kicker: string }> = {
  products: { title: "Produtos", description: "Seu catálogo digital, organizado para vender.", kicker: "CATÁLOGO" },
  offers: { title: "Ofertas", description: "Preços e condições comerciais dos seus produtos.", kicker: "COMERCIAL" },
  files: { title: "Arquivos", description: "Conteúdo digital que será entregue aos compradores.", kicker: "ENTREGA" },
  affiliates: { title: "Afiliados", description: "Configure programas para ampliar o alcance dos seus produtos.", kicker: "CRESCIMENTO" },
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  category?: string | null;
  type?: string | null;
  offers?: Offer[];
  affiliatePrograms?: AffiliateProgram[];
};

type Offer = {
  id: string;
  productId?: string;
  name: string;
  price: number;
  active?: boolean;
  status?: string;
  startsAt?: string | null;
  endsAt?: string | null;
};

type ProductFile = {
  id: string;
  productId: string;
  fileName: string;
  mimeType?: string | null;
  size?: number | null;
};

type AffiliateProgram = {
  id: string;
  productId: string;
  commissionType: string;
  commissionValue: number;
  enabled: boolean;
  approvalMode: string;
  rules?: string | null;
};

type ProductListResponse = { data?: Product[] };

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function bytes(value?: number | null) {
  if (!value) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = { PUBLISHED: "Publicado", DRAFT: "Rascunho", ARCHIVED: "Arquivado", ACTIVE: "Ativo", INACTIVE: "Inativo" };
  return labels[status.toUpperCase()] || status;
}

function statusClass(status: string) {
  const value = status.toUpperCase();
  if (value === "PUBLISHED" || value === "ACTIVE") return styles.statusSuccess;
  if (value === "DRAFT" || value === "PENDING") return styles.statusWarning;
  return styles.statusMuted;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ProducerSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  const info = sectionInfo[section] || { title: "Área", description: "Esta área do produtor ainda não foi configurada.", kicker: "PRODUTOR" };
  const supported = Boolean(sectionInfo[section]);

  const [token, setToken] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [files, setFiles] = useState<ProductFile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showAffiliateForm, setShowAffiliateForm] = useState(false);
  const [selectedFileProduct, setSelectedFileProduct] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [offerForm, setOfferForm] = useState({ productId: "", name: "", price: "" });
  const [affiliateForm, setAffiliateForm] = useState({ productId: "", commissionType: "PERCENTAGE", commissionValue: "20", approvalMode: "AUTO", rules: "" });

  useEffect(() => {
    setToken(localStorage.getItem("tz_access_token") || "");
  }, []);

  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...(options?.headers || {}), Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data: unknown = await response.json();
    if (!response.ok) {
      const message = typeof data === "object" && data !== null && "message" in data ? String(data.message) : "Não foi possível concluir a operação.";
      throw new Error(message);
    }
    return data as T;
  }

  async function load() {
    if (!token || !supported) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await api<ProductListResponse>("/products/mine");
      const list = Array.isArray(result.data) ? result.data : [];
      setProducts(list);

      if (section === "offers") {
        const loadedOffers = await Promise.all(list.map(async (product) => {
          const result = await api<Offer[]>(`/products/${product.id}/offers`);
          return result.map((offer) => ({ ...offer, productId: product.id }));
        }));
        setOffers(loadedOffers.flat());
      } else {
        setOffers([]);
      }

      if (section === "files" || section === "affiliates") {
        const details = await Promise.all(list.map((product) => api<Product>(`/products/${product.id}`).catch(() => null)));
        const valid = details.filter((detail): detail is Product => detail !== null);
        if (section === "files") {
          setFiles(valid.flatMap((detail) => (detail as Product & { files?: ProductFile[] }).files?.map((item) => ({ ...item, productId: detail.id })) || []));
        }
        if (section === "affiliates") {
          setProducts(list.map((product) => valid.find((detail) => detail.id === product.id) || product));
        }
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Não foi possível carregar os dados."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [section, token]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => [product.name, product.slug, product.category, product.type].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [products, search]);

  const productMap = useMemo(() => Object.fromEntries(products.map((product) => [product.id, product.name])), [products]);
  const filteredOffers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return offers;
    return offers.filter((offer) => offer.name.toLowerCase().includes(query) || (productMap[offer.productId || ""] || "").toLowerCase().includes(query));
  }, [offers, productMap, search]);
  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return files;
    return files.filter((item) => item.fileName.toLowerCase().includes(query) || (productMap[item.productId] || "").toLowerCase().includes(query));
  }, [files, productMap, search]);

  const published = products.filter((product) => product.status.toUpperCase() === "PUBLISHED").length;
  const drafts = products.filter((product) => product.status.toUpperCase() === "DRAFT").length;

  async function createOffer() {
    if (!offerForm.productId || !offerForm.name.trim() || Number(offerForm.price) <= 0) {
      setError("Preencha produto, nome e preço.");
      return;
    }
    setWorking(true); setError(""); setMessage("");
    try {
      await api<Offer>(`/products/${offerForm.productId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: offerForm.name.trim(), price: Math.round(Number(offerForm.price) * 100) }),
      });
      setMessage("Oferta criada com sucesso.");
      setOfferForm({ productId: "", name: "", price: "" });
      setShowOfferForm(false);
      await load();
    } catch (err: unknown) { setError(errorMessage(err, "Não foi possível criar a oferta.")); }
    finally { setWorking(false); }
  }

  async function uploadFile() {
    if (!selectedFileProduct || !file) { setError("Selecione o produto e o arquivo."); return; }
    setWorking(true); setError(""); setMessage("");
    try {
      const body = new FormData(); body.append("file", file);
      await api<ProductFile>(`/products/${selectedFileProduct}/upload`, { method: "POST", body });
      setMessage("Arquivo enviado com sucesso."); setFile(null); await load();
    } catch (err: unknown) { setError(errorMessage(err, "Não foi possível enviar o arquivo.")); }
    finally { setWorking(false); }
  }

  async function createAffiliateProgram() {
    if (!affiliateForm.productId || Number(affiliateForm.commissionValue) <= 0) { setError("Selecione o produto e defina uma comissão válida."); return; }
    if (affiliateForm.commissionType === "PERCENTAGE" && Number(affiliateForm.commissionValue) > 100) { setError("A comissão percentual não pode ultrapassar 100%."); return; }
    setWorking(true); setError(""); setMessage("");
    try {
      await api<AffiliateProgram>(`/affiliates/programs/${affiliateForm.productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionType: affiliateForm.commissionType, commissionValue: Number(affiliateForm.commissionValue), approvalMode: affiliateForm.approvalMode, rules: affiliateForm.rules.trim() || undefined }),
      });
      setMessage("Programa de afiliados salvo com sucesso."); setShowAffiliateForm(false); await load();
    } catch (err: unknown) { setError(errorMessage(err, "Não foi possível salvar o programa.")); }
    finally { setWorking(false); }
  }

  if (!token) {
    return (
      <main className={styles.gate}>
        <div className={styles.gateCard}>
          <span className={`${homeStyles.logoMark} ${styles.gateLogo}`} aria-hidden="true"><span>T</span><span>Z</span></span>
          <span className={styles.kicker}>ÁREA DO PRODUTOR</span>
          <h1>Entre para gerenciar sua operação.</h1>
          <p>Acesse produtos, ofertas, arquivos e afiliados em um único painel.</p>
          <Link href="/login" className={styles.primaryButton}>Entrar na TZ Store <span>↗</span></Link>
        </div>
      </main>
    );
  }

  return (
    <div className={styles.page}><DashboardShell area="producer" title={info.title} description={info.description}>
      {message && <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">{message}</div>}
      {error && <div className={`${styles.alert} ${styles.alertError}`} role="alert">{error}</div>}

      {!supported ? (
        <div className={styles.emptyState}><span className={`${homeStyles.logoMark} ${styles.inlineLogo}`} aria-hidden="true"><span>T</span><span>Z</span></span><span className={styles.kicker}>EM DESENVOLVIMENTO</span><h2>Esta área ainda não possui uma operação conectada.</h2><p>A navegação está pronta, mas não vamos inventar dados ou ações que a API ainda não oferece.</p></div>
      ) : (
        <>
          <ContextStage area="producer" section={section} count={section === "offers" ? offers.length : section === "files" ? files.length : products.length} />

          <div className={styles.sectionToolbar}>
            <div className={styles.searchField}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Pesquisar ${info.title.toLowerCase()}...`} />
            </div>
            <div className={styles.toolbarActions}>
              <span className={styles.count}>{section === "offers" ? filteredOffers.length : section === "files" ? filteredFiles.length : filteredProducts.length} registros</span>
              {section === "offers" && <button className={styles.primaryButton} type="button" onClick={() => setShowOfferForm((value) => !value)}>+ Nova oferta</button>}
              {section === "files" && <button className={styles.primaryButton} type="button" onClick={() => setSelectedFileProduct(products[0]?.id || "")}>+ Adicionar arquivo</button>}
              {section === "affiliates" && <button className={styles.primaryButton} type="button" onClick={() => setShowAffiliateForm((value) => !value)}>+ Criar programa</button>}
            </div>
          </div>

          {section === "products" && (
            <section className={styles.catalogSection}>
              <div className={styles.catalogHeader}>
                <div><span className={styles.kicker}>SEUS PRODUTOS</span><h2>Catálogo</h2><p>{published} publicados · {drafts} em edição · {products.length} no total</p></div>
                <Link href="/producer" className={styles.secondaryButton}>Criar produto <span>↗</span></Link>
              </div>
              {loading ? <div className={styles.cardGrid}>{[1,2,3].map((item) => <div className={styles.skeleton} key={item} />)}</div> : filteredProducts.length === 0 ? <EmptyState title={search ? "Nenhum produto encontrado" : "Seu catálogo está vazio"} text={search ? "Tente outra pesquisa." : "Crie seu primeiro produto no dashboard do produtor."} /> : <div className={styles.cardGrid}>{filteredProducts.map((product) => <article className={styles.productCard} key={product.id}><div className={styles.productTop}><div className={styles.productMark}><span className={`${homeStyles.logoMark} ${styles.inlineLogo}`} aria-hidden="true"><span>T</span><span>Z</span></span></div><div className={styles.productIdentity}><strong>{product.name}</strong><span>/{product.slug}</span></div><span className={`${styles.status} ${statusClass(product.status)}`}>{statusLabel(product.status)}</span></div><div className={styles.productMeta}><div><span>Categoria</span><strong>{product.category || "Sem categoria"}</strong></div><div><span>Tipo</span><strong>{product.type || "Digital"}</strong></div><div><span>Ofertas</span><strong>{product.offers?.length || 0}</strong></div></div><div className={styles.productFooter}><span>ID · {product.id.slice(0,8)}</span><Link href={`/product/${encodeURIComponent(product.slug)}`}>Abrir produto <span>→</span></Link></div></article>)}</div>}
            </section>
          )}

          {section === "offers" && <section className={styles.dataSection}>{showOfferForm && <FormPanel title="Nova oferta" subtitle="Crie uma nova condição comercial para um produto."><div className={styles.formGrid}><select value={offerForm.productId} onChange={(event) => setOfferForm((current) => ({...current, productId: event.target.value}))}><option value="">Selecione o produto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><input value={offerForm.name} onChange={(event) => setOfferForm((current) => ({...current, name: event.target.value}))} placeholder="Nome da oferta" /><input type="number" min="0.01" step="0.01" value={offerForm.price} onChange={(event) => setOfferForm((current) => ({...current, price: event.target.value}))} placeholder="Preço" /><button className={styles.primaryButton} type="button" disabled={working} onClick={() => void createOffer()}>{working ? "Criando..." : "Criar oferta"}</button></div></FormPanel>}{loading ? <Loading /> : filteredOffers.length === 0 ? <EmptyState title="Nenhuma oferta" text="Crie a primeira oferta para um produto." /> : <div className={styles.table}>{filteredOffers.map((offer) => <div className={styles.row} key={offer.id}><div className={styles.rowMain}><strong>{offer.name}</strong><small>{productMap[offer.productId || ""] || "Produto"}</small></div><span>{money(offer.price)}</span><span className={`${styles.status} ${statusClass(offer.status || (offer.active === false ? "INACTIVE" : "ACTIVE"))}`}>{statusLabel(offer.status || (offer.active === false ? "INACTIVE" : "ACTIVE"))}</span></div>)}</div>}</section>}

          {section === "files" && <section className={styles.dataSection}>{selectedFileProduct && <FormPanel title="Adicionar arquivo" subtitle="O arquivo ficará vinculado ao produto selecionado."><div className={styles.formGrid}><select value={selectedFileProduct} onChange={(event) => setSelectedFileProduct(event.target.value)}><option value="">Selecione o produto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} /><button className={styles.primaryButton} type="button" disabled={working || !file} onClick={() => void uploadFile()}>{working ? "Enviando..." : "Enviar arquivo"}</button></div></FormPanel>}{loading ? <Loading /> : filteredFiles.length === 0 ? <EmptyState title="Nenhum arquivo" text="Envie o primeiro arquivo de um produto." /> : <div className={styles.table}>{filteredFiles.map((item) => <div className={styles.row} key={item.id}><div className={styles.rowMain}><strong>{item.fileName}</strong><small>{productMap[item.productId] || "Produto"}</small></div><span>{item.mimeType || "Arquivo"}</span><span>{bytes(item.size)}</span></div>)}</div>}</section>}

          {section === "affiliates" && <section className={styles.dataSection}>{showAffiliateForm && <FormPanel title="Programa de afiliados" subtitle="Defina a comissão e como os afiliados entram no programa."><div className={styles.formGrid}><select value={affiliateForm.productId} onChange={(event) => setAffiliateForm((current) => ({...current, productId: event.target.value}))}><option value="">Selecione o produto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><select value={affiliateForm.commissionType} onChange={(event) => setAffiliateForm((current) => ({...current, commissionType: event.target.value}))}><option value="PERCENTAGE">Percentual</option><option value="FIXED">Valor fixo</option></select><input type="number" min="0.01" step="0.01" value={affiliateForm.commissionValue} onChange={(event) => setAffiliateForm((current) => ({...current, commissionValue: event.target.value}))} placeholder="Comissão" /><select value={affiliateForm.approvalMode} onChange={(event) => setAffiliateForm((current) => ({...current, approvalMode: event.target.value}))}><option value="AUTO">Aprovação automática</option><option value="MANUAL">Aprovação manual</option></select><textarea value={affiliateForm.rules} onChange={(event) => setAffiliateForm((current) => ({...current, rules: event.target.value}))} placeholder="Regras para os afiliados (opcional)" /><button className={styles.primaryButton} type="button" disabled={working} onClick={() => void createAffiliateProgram()}>{working ? "Salvando..." : "Salvar programa"}</button></div></FormPanel>}<div className={styles.cardGrid}>{products.map((product) => { const program = product.affiliatePrograms?.[0]; return <article className={styles.productCard} key={product.id}><div className={styles.productTop}><div className={styles.productMark}><span className={`${homeStyles.logoMark} ${styles.inlineLogo}`} aria-hidden="true"><span>T</span><span>Z</span></span></div><div className={styles.productIdentity}><strong>{product.name}</strong><span>/{product.slug}</span></div><span className={`${styles.status} ${statusClass(product.status)}`}>{statusLabel(product.status)}</span></div><div className={styles.programMeta}>{program ? <><div><span>Comissão</span><strong>{program.commissionType === "PERCENTAGE" ? `${program.commissionValue}%` : money(program.commissionValue)}</strong></div><div><span>Aprovação</span><strong>{program.approvalMode === "AUTO" ? "Automática" : "Manual"}</strong></div></> : <div><span>Programa</span><strong>Ainda não configurado</strong></div>}</div><button className={styles.secondaryButton} type="button" onClick={() => { setAffiliateForm((current) => ({...current, productId: product.id})); setShowAffiliateForm(true); }}>Configurar programa <span>→</span></button></article>; })}</div></section>}
        </>
      )}
    </DashboardShell></div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className={styles.emptyState}><span className={`${homeStyles.logoMark} ${styles.inlineLogo}`} aria-hidden="true"><span>T</span><span>Z</span></span><h3>{title}</h3><p>{text}</p></div>;
}

function Loading() {
  return <div className={styles.tableLoading} aria-busy="true"><span /><span /><span /></div>;
}

function FormPanel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <div className={styles.formPanel}><span className={styles.kicker}>CONFIGURAÇÃO</span><h2>{title}</h2><p>{subtitle}</p>{children}</div>;
}
