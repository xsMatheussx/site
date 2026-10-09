"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { DashboardShell } from "../components/SiteShell";
import ProducerVisual from "../components/ProducerVisual";
import homeStyles from "../Home.module.css";
import styles from "./Producer.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  category: "E-books",
  type: "FILE",
  offerName: "Oferta principal",
  price: "",
};

type Offer = {
  id: string;
  name: string;
  price: number;
  status?: string;
  active?: boolean;
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
  _count?: { orders?: number };
};

type ProductListResponse = {
  data?: Product[];
};

function subscribeToken(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getTokenSnapshot() {
  return localStorage.getItem("tz_access_token") || "";
}

function getServerToken() {
  return "";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PUBLISHED: "Publicado",
    DRAFT: "Rascunho",
    ARCHIVED: "Arquivado",
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
  };
  return labels[status.toUpperCase()] || status;
}

function statusTone(status: string) {
  const value = status.toUpperCase();
  if (value === "PUBLISHED" || value === "ACTIVE") return styles.statusSuccess;
  if (value === "DRAFT" || value === "PENDING") return styles.statusWarning;
  return styles.statusMuted;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ProducerPage() {
  const token = useSyncExternalStore(
    subscribeToken,
    getTokenSnapshot,
    getServerToken,
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const published = useMemo(
    () => products.filter((product) => product.status.toUpperCase() === "PUBLISHED").length,
    [products],
  );

  const drafts = useMemo(
    () => products.filter((product) => product.status.toUpperCase() === "DRAFT").length,
    [products],
  );

  const offers = useMemo(
    () => products.reduce((total, product) => total + (product.offers?.length || 0), 0),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.slug, product.category, product.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [products, search]);

  async function fetchProducts(currentToken: string) {
    const response = await fetch(`${API}/products/mine`, {
      headers: { Authorization: `Bearer ${currentToken}` },
      cache: "no-store",
    });

    const data = (await response.json()) as ProductListResponse & { message?: string };
    if (!response.ok) {
      throw new Error(data.message || "Não foi possível carregar seus produtos.");
    }

    return Array.isArray(data.data) ? data.data : [];
  }

  async function refreshProducts(currentToken = token) {
    if (!currentToken) return;
    const list = await fetchProducts(currentToken);
    setProducts(list);
  }

  useEffect(() => {
    let active = true;

    if (!token) {
      setProducts([]);
      setLoaded(true);
      return () => {
        active = false;
      };
    }

    setLoaded(false);
    setError("");

    void fetchProducts(token)
      .then((list) => {
        if (active) setProducts(list);
      })
      .catch((err: unknown) => {
        if (active) setError(errorMessage(err, "Erro ao carregar os produtos."));
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [token]);

  function updateName(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Sua sessão não está disponível. Entre novamente.");
      return;
    }

    setCreating(true);
    setMessage("");
    setError("");

    try {
      const productResponse = await fetch(`${API}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          type: form.type,
        }),
      });

      const productData = (await productResponse.json()) as Product & { message?: string };
      if (!productResponse.ok) {
        throw new Error(productData.message || "Não foi possível criar o produto.");
      }

      const offerResponse = await fetch(`${API}/products/${productData.id}/offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.offerName.trim(),
          price: Math.round(Number(form.price) * 100),
        }),
      });

      const offerData = (await offerResponse.json()) as { message?: string };
      if (!offerResponse.ok) {
        throw new Error(offerData.message || "Produto criado, mas a oferta não foi criada.");
      }

      setForm(emptyForm);
      setSlugTouched(false);
      setMessage("Produto e oferta criados com sucesso.");
      await refreshProducts(token);
    } catch (err: unknown) {
      setError(errorMessage(err, "Não foi possível concluir o cadastro."));
    } finally {
      setCreating(false);
    }
  }

  async function uploadFile() {
    if (!token || !selectedProduct || !file) {
      setError("Selecione um arquivo antes de enviar.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(`${API}/products/${selectedProduct.id}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const data = (await response.json()) as { fileName?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Não foi possível enviar o arquivo.");
      }

      setFile(null);
      setMessage(`Arquivo "${data.fileName || file.name}" enviado com sucesso.`);
      await refreshProducts(token);
    } catch (err: unknown) {
      setError(errorMessage(err, "Erro ao enviar o arquivo."));
    } finally {
      setUploading(false);
    }
  }

  async function publishProduct(product: Product) {
    if (!token) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Não foi possível publicar o produto.");
      }

      setMessage(`"${product.name}" foi publicado.`);
      await refreshProducts(token);
    } catch (err: unknown) {
      setError(errorMessage(err, "Erro ao publicar o produto."));
    }
  }

  if (!token) {
    return (
      <main className={styles.gate}>
        <section className={styles.gateCard}>
          <span className={`${homeStyles.logoMark} ${styles.gateLogo}`} aria-hidden="true"><span>T</span><span>Z</span></span>
          <span className={styles.gateEyebrow}>ÁREA DO PRODUTOR</span>
          <h1>
            Venda seus produtos
            <span> do seu jeito.</span>
          </h1>
          <p>
            Crie produtos digitais, configure ofertas, entregue arquivos e acompanhe toda a operação da sua loja em um só lugar.
          </p>
          <Link href="/login" className={styles.gateButton}>Entrar na TZ Store <span>↗</span></Link>
          <div className={styles.gateMeta}>Marketplace · Checkout · Afiliados · Gestão de produtos</div>
        </section>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <DashboardShell
        area="producer"
        title="Seu negócio em movimento."
        description="Crie produtos, organize ofertas e mantenha sua operação pronta para vender."
      >
        <section className={styles.hero} aria-label="Visão geral da operação">
          <div className={styles.heroCopy}>
            <div>
              <span className={styles.eyebrow}>CENTRAL DO PRODUTOR</span>
              <h2 className={styles.heroTitle}>Sua operação. <em>Seu ritmo.</em></h2>
              <p className={styles.heroText}>Crie produtos digitais, monte ofertas, prepare a entrega e acompanhe o catálogo em uma única área. Tudo que você precisa para colocar um produto no ar começa aqui.</p>
              <div className={styles.heroActions}>
                <a href="#novo-produto" className={styles.primaryButton}>Criar produto <span>↗</span></a>
                <Link href="/producer/products" className={styles.secondaryButton}>Abrir catálogo <span>→</span></Link>
              </div>
            </div>
            <div className={styles.heroMeta}>TZ STORE <span>/</span> PRODUTOR <span>/</span> OPERAÇÃO DIGITAL</div>
          </div>
          <div className={styles.heroVisual}>
            <ProducerVisual products={products.length} published={published} drafts={drafts} offers={offers} />
          </div>
        </section>

        {message && <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">{message}</div>}
        {error && <div className={`${styles.alert} ${styles.alertError}`} role="alert">{error}</div>}

        <section className={styles.metrics} aria-label="Resumo da operação">
          {[
            ["Produtos", products.length, "Seu catálogo"],
            ["Publicados", published, "Prontos para vender"],
            ["Rascunhos", drafts, "Precisam de atenção"],
            ["Ofertas", offers, "Condições comerciais"],
          ].map(([label, value, caption]) => (
            <article className={styles.metric} key={String(label)}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{caption}</small>
            </article>
          ))}
        </section>

        <div className={styles.workspace}>
          <section id="novo-produto" className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>NOVO PRODUTO</span>
                <h2>Criar produto</h2>
                <p>Cadastre o produto e sua primeira oferta em um único fluxo.</p>
              </div>
              <span className={styles.step}>01 / 02</span>
            </div>

            <form className={styles.form} onSubmit={createProduct}>
              <label>
                Nome do produto
                <input
                  value={form.name}
                  onChange={(event) => updateName(event.target.value)}
                  placeholder="Ex.: Método de Marketing"
                  minLength={3}
                  maxLength={120}
                  required
                />
              </label>

              <label>
                Slug público
                <div className={styles.slugField}>
                  <span>tz.store/</span>
                  <input
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setForm((current) => ({ ...current, slug: slugify(event.target.value) }));
                    }}
                    placeholder="metodo-de-marketing"
                    required
                  />
                </div>
              </label>

              <label>
                Descrição
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Explique o que o comprador recebe e o principal benefício do produto."
                  minLength={10}
                  maxLength={5000}
                  required
                />
              </label>

              <div className={styles.formGrid}>
                <label>
                  Categoria
                  <input
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    placeholder="E-books"
                    maxLength={80}
                    required
                  />
                </label>
                <label>
                  Tipo
                  <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                    <option value="FILE">Arquivo</option>
                    <option value="COURSE">Curso</option>
                    <option value="CONTENT">Conteúdo</option>
                    <option value="COMMUNITY">Comunidade</option>
                  </select>
                </label>
              </div>

              <div className={styles.formDivider}>
                <span>OFERTA PRINCIPAL</span>
              </div>

              <div className={styles.formGrid}>
                <label>
                  Nome da oferta
                  <input value={form.offerName} onChange={(event) => setForm((current) => ({ ...current, offerName: event.target.value }))} required />
                </label>
                <label>
                  Preço
                  <div className={styles.priceField}>
                    <span>R$</span>
                    <input type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="49,90" required />
                  </div>
                </label>
              </div>

              <button className={styles.primaryButton} type="submit" disabled={creating}>
                {creating ? "Criando produto..." : "Criar produto"}
                <span>↗</span>
              </button>
            </form>
          </section>

          <section className={`${styles.panel} ${styles.catalogPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>CATÁLOGO</span>
                <h2>Meus produtos</h2>
                <p>Gerencie publicação, arquivos e ofertas.</p>
              </div>
              <Link href="/producer/products" className={styles.textButton}>Ver catálogo <span>→</span></Link>
            </div>

            <div className={styles.searchRow}>
              <div className={styles.searchField}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar no catálogo" />
              </div>
              <span className={styles.count}>{filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"}</span>
            </div>

            {!loaded ? (
              <div className={styles.productList} aria-busy="true">
                {[1, 2, 3].map((item) => <div className={styles.skeleton} key={item} />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyMark}><span className={homeStyles.logoMark} aria-hidden="true"><span>T</span><span>Z</span></span></div>
                <strong>{search ? "Nenhum produto encontrado" : "Seu catálogo está vazio"}</strong>
                <p>{search ? "Tente outro termo de pesquisa." : "O primeiro produto criado aparecerá aqui."}</p>
              </div>
            ) : (
              <div className={styles.productList}>
                {filteredProducts.map((product) => (
                  <article className={styles.productItem} key={product.id}>
                    <div className={styles.productMark}><span className={homeStyles.logoMark} aria-hidden="true"><span>T</span><span>Z</span></span></div>
                    <div className={styles.productInfo}>
                      <strong>{product.name}</strong>
                      <span>/{product.slug}</span>
                      <small>{product.category || "Sem categoria"} · {product.offers?.length || 0} {product.offers?.length === 1 ? "oferta" : "ofertas"}</small>
                    </div>
                    <span className={`${styles.status} ${statusTone(product.status)}`}>{statusLabel(product.status)}</span>
                    <div className={styles.productActions}>
                      <button type="button" className={styles.secondaryButton} onClick={() => setSelectedProduct(product)}>Gerenciar</button>
                      {product.status.toUpperCase() === "DRAFT" && <button type="button" className={styles.publishButton} onClick={() => void publishProduct(product)}>Publicar</button>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {selectedProduct && (
          <section className={styles.managePanel}>
            <div className={styles.manageHeader}>
              <div>
                <span className={styles.eyebrow}>GESTÃO DO PRODUTO</span>
                <h2>{selectedProduct.name}</h2>
                <p>Envie o conteúdo que será entregue ao comprador e confira a oferta atual.</p>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => { setSelectedProduct(null); setFile(null); }}>Fechar</button>
            </div>

            <div className={styles.manageGrid}>
              <div className={styles.manageBlock}>
                <span className={styles.blockLabel}>ARQUIVO DIGITAL</span>
                <h3>Conteúdo de entrega</h3>
                <p>Envie um arquivo de até 50 MB para este produto.</p>
                <label className={styles.fileDrop}>
                  <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                  <span>{file ? file.name : "Escolher arquivo"}</span>
                  <small>{file ? "Arquivo selecionado" : "PDF, ZIP, vídeo ou outro arquivo permitido"}</small>
                </label>
                <button className={styles.primaryButton} type="button" disabled={uploading || !file} onClick={() => void uploadFile()}>
                  {uploading ? "Enviando..." : "Enviar arquivo"}
                  <span>↑</span>
                </button>
              </div>

              <div className={styles.manageBlock}>
                <span className={styles.blockLabel}>OFERTAS</span>
                <h3>Condições comerciais</h3>
                <p>Confira os preços ativos deste produto.</p>
                <div className={styles.offerList}>
                  {(selectedProduct.offers || []).length === 0 ? (
                    <div className={styles.offerEmpty}>Nenhuma oferta cadastrada.</div>
                  ) : (
                    (selectedProduct.offers || []).map((offer) => (
                      <div className={styles.offerItem} key={offer.id}>
                        <div><strong>{offer.name}</strong><span>{offer.active === false ? "Inativa" : "Oferta ativa"}</span></div>
                        <b>{money(offer.price)}</b>
                      </div>
                    ))
                  )}
                </div>
                <Link href="/producer/offers" className={styles.textButton}>Gerenciar ofertas <span>→</span></Link>
              </div>
            </div>
          </section>
        )}
      </DashboardShell>
    </div>
  );
}
