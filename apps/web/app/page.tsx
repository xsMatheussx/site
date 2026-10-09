"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./Home.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  category?: string | null;
  type?: string | null;
};

const categories = ["Todos", "Cursos", "E-books", "Templates", "Arquivos", "Comunidades"];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? styles.brandCompact : styles.brand}>
      <span className={styles.logoMark} aria-hidden="true">
        <span>T</span>
        <span>Z</span>
      </span>
      <span className={styles.wordmark}>
        <strong>TZ</strong>
        <span>STORE</span>
      </span>
    </span>
  );
}

export default function Home() {
  function barColor(height: number) {
    const min = 25;
    const max = 95;

    const t = Math.max(
      0,
      Math.min(1, (height - min) / (max - min)),
    );

    const stops = [
      { p: 0.00, r: 127, g: 38,  b: 55  },
      { p: 0.25, r: 157, g: 55,  b: 72  },
      { p: 0.45, r: 194, g: 117, b: 55  },
      { p: 0.55, r: 214, g: 166, b: 67  },
      { p: 0.70, r: 142, g: 201, b: 91  },
      { p: 1.00, r: 53,  g: 217, b: 121 },
    ];

    let left = stops[0];
    let right = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].p && t <= stops[i + 1].p) {
        left = stops[i];
        right = stops[i + 1];
        break;
      }
    }

    const range = right.p - left.p;
    const localT = range === 0 ? 0 : (t - left.p) / range;

    const r = Math.round(left.r + (right.r - left.r) * localT);
    const g = Math.round(left.g + (right.g - left.g) * localT);
    const b = Math.round(left.b + (right.b - left.b) * localT);

    return `linear-gradient(
      180deg,
      rgb(${r}, ${g}, ${b}) 0%,
      rgba(${r}, ${g}, ${b}, .12) 100%
    )`;
  }
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");

  useEffect(() => {
    let active = true;

    fetch(`${API}/products`)
      .then(async (response) => {
        if (!response.ok) return [];
        const data = await response.json();
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data)) return data;
        return [];
      })
      .then((data) => {
        if (active) setProducts(data.slice(0, 12));
      })
      .catch(() => {
        if (active) setProducts([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch =
          !q ||
          product.name.toLowerCase().includes(q) ||
          product.category?.toLowerCase().includes(q) ||
          product.description?.toLowerCase().includes(q);

        const matchesCategory =
          category === "Todos" ||
          product.category?.toLowerCase() === category.toLowerCase();

        return matchesSearch && matchesCategory;
      })
      .slice(0, 6);
  }, [products, search, category]);

  return (
    <div className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" aria-label="TZ Store — início">
            <Logo />
          </Link>

          <nav className={styles.nav} aria-label="Navegação principal">
            <Link href="/marketplace">Marketplace</Link>
            <Link href="/producer">Vender</Link>
            <Link href="/affiliate">Afiliados</Link>
          </nav>

          <div className={styles.actions}>
            <Link href="/login" className={styles.login}>Entrar</Link>
            <Link href="/register" className={styles.register}>Criar conta</Link>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={`${styles.container} ${styles.heroContainer}`}>
            <div className={styles.heroCopy}>
              <div className={styles.pill}>
                <span className={styles.liveDot} />
                A nova camada do comércio digital
              </div>

              <h1>
                Crie.<br />
                Venda.<br />
                <span>Escala.</span>
              </h1>

              <p>
                Uma plataforma feita para transformar produtos digitais em negócios de verdade
                da primeira oferta até a próxima venda.
              </p>

              <div className={styles.heroButtons}>
                <Link href="/marketplace" className={styles.primaryButton}>
                  Explorar marketplace
                  <span>↗</span>
                </Link>
                <Link href="/producer" className={styles.secondaryButton}>
                  Começar a vender
                </Link>
              </div>

              <div className={styles.trustLine}>
                <span>Checkout integrado</span>
                <i />
                <span>Entrega digital</span>
                <i />
                <span>Área do produtor</span>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={`${styles.orbit} ${styles.orbitOne}`} />
              <div className={`${styles.orbit} ${styles.orbitTwo}`} />
              <div className={styles.heroCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <span>LIVE MARKET</span>
                    <strong>Seu negócio, em movimento.</strong>
                  </div>
                  <span className={styles.cardBadge}>
  <span className={styles.logoMark} aria-hidden="true">
    <span>T</span>
    <span>Z</span>
  </span>
</span>
                </div>

                <div className={styles.graphWrap}>
                  <div className={styles.graphTop}>
                    <span>Vendas</span>
                    <strong>+38,6%</strong>
                  </div>
                  <div className={styles.graph} aria-hidden="true">
                    <span className={styles.bar} style={{ height: "26%", background: barColor(26), transition: "background .8s ease" }} />
                    <span className={styles.bar} style={{ height: "42%", background: barColor(42), transition: "background .8s ease" }} />
                    <span className={styles.bar} style={{ height: "37%", background: barColor(37), transition: "background .8s ease" }} />
                    <span className={styles.bar} style={{ height: "61%", background: barColor(61), transition: "background .8s ease" }} />
                    <span className={styles.bar} style={{ height: "56%", background: barColor(56), transition: "background .8s ease" }} />
                    <span className={styles.bar} style={{ height: "76%", background: barColor(76), transition: "background .8s ease" }} />
                    <span className={styles.bar} style={{ height: "69%", background: barColor(69), transition: "background .8s ease" }} />
                    <span className={styles.bar} style={{ height: "92%", background: barColor(92), transition: "background .8s ease" }} />
                  </div>
                </div>

                <div className={styles.metricGrid}>
                  <div>
                    <span>Pedidos</span>
                    <strong>1.248</strong>
                  </div>
                  <div>
                    <span>Conversão</span>
                    <strong>12,8%</strong>
                  </div>
                  <div>
                    <span>Afiliados</span>
                    <strong>284</strong>
                  </div>
                </div>
              </div>

              <div className={styles.floatingCard}>
                <span>PRODUTO</span>
                <strong>Seu próximo best-seller</strong>
                <small>Venda + entrega + acesso em um só fluxo.</small>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.searchSection}>
          <div className={styles.container}>
            <div className={styles.sectionIntro}>
              <div>
                <span>DESCUBRA</span>
                <h2>O que você vai vender hoje?</h2>
              </div>
              <Link href="/marketplace" className={styles.inlineLink}>Ver tudo ↗</Link>
            </div>

            <div className={styles.searchBox}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar produtos, cursos, arquivos..."
                aria-label="Buscar produtos"
              />
              <kbd>⌘ K</kbd>
            </div>

            <div className={styles.categories} role="tablist" aria-label="Categorias">
              {categories.map((item) => {
                const active = category === item;
                return (
                  <button
                    key={item}
                    type="button"
                    className={active ? styles.categoryActive : ""}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.products}>
          <div className={styles.container}>
            <div className={styles.sectionIntro}>
              <div>
                <span>{search ? "RESULTADOS" : "EM DESTAQUE"}</span>
                <h2>{search ? "Encontramos isto para você." : "Produtos que chamam atenção."}</h2>
              </div>
              <span className={styles.productCount}>{filtered.length} itens</span>
            </div>

            {filtered.length > 0 ? (
              <div className={styles.productGrid}>
                {filtered.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/product/${encodeURIComponent(product.slug)}`}
                    className={styles.product}
                  >
                    <div className={`${styles.cover} ${index % 3 === 0 ? styles.coverOne : index % 3 === 1 ? styles.coverTwo : styles.coverThree}`}>
                      <span>{product.name.charAt(0).toUpperCase()}</span>
                      <small>{product.category || product.type || "Produto digital"}</small>
                    </div>
                    <div className={styles.productBody}>
                      <div>
                        <strong>{product.name}</strong>
                        <p>{product.shortDescription || product.description || "Produto digital para sua próxima compra."}</p>
                      </div>
                      <span>↗</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>
  <span className={styles.logoMark} aria-hidden="true">
    <span>T</span>
    <span>Z</span>
  </span>
</span>
                <strong>Nenhum produto encontrado.</strong>
                <p>Abra o marketplace para explorar todo o catálogo.</p>
                <Link href="/marketplace" className={styles.primaryButton}>Abrir marketplace ↗</Link>
              </div>
            )}
          </div>
        </section>

        <section className={styles.business}>
          <div className={styles.container}>
            <div className={styles.businessShell}>
              <div className={styles.businessIntro}>
                <span>PARA QUEM CRIA</span>
                <h2>Uma conta.<br /><em>Várias formas</em> de crescer.</h2>
                <p>Venda seus produtos, abra espaço para afiliados e mantenha tudo no mesmo ecossistema.</p>
              </div>

              <div className={styles.businessGrid}>
                <Link href="/producer" className={styles.businessCard}>
                  <div className={styles.businessNumber}>01</div>
                  <span>PRODUTOR</span>
                  <h3>Transforme criação em receita.</h3>
                  <p>Produtos, ofertas, arquivos, pedidos e vendas em um único painel.</p>
                  <b>Entrar na área do produtor ↗</b>
                </Link>

                <Link href="/affiliate" className={`${styles.businessCard} ${styles.businessCardAlt}`}>
                  <div className={styles.businessNumber}>02</div>
                  <span>AFILIADO</span>
                  <h3>Promova o que já vende.</h3>
                  <p>Encontre ofertas, compartilhe links e acompanhe suas comissões.</p>
                  <b>Conhecer afiliados ↗</b>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.stats}>
          <div className={styles.container}>
            <div className={styles.stat}><strong>01</strong><span>Marketplace</span><p>Descubra produtos digitais prontos para comprar.</p></div>
            <div className={styles.stat}><strong>02</strong><span>Checkout</span><p>Uma jornada simples para converter melhor.</p></div>
            <div className={styles.stat}><strong>03</strong><span>Entrega</span><p>Acesso digital no momento certo.</p></div>
            <div className={styles.stat}><strong>04</strong><span>Escala</span><p>Afiliados e ferramentas para crescer.</p></div>
          </div>
        </section>

        <section className={styles.final}>
          <div className={styles.container}>
            <div className={styles.finalCard}>
              <div>
                <span>TZ STORE</span>
                <h2>Seu próximo<br /><em>movimento começa aqui.</em></h2>
              </div>
              <Link href="/marketplace" className={styles.primaryButton}>Explorar agora ↗</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <Link href="/" aria-label="TZ Store — início"><Logo compact /></Link>
            <p>Marketplace e infraestrutura para produtos digitais.</p>
            <div className={styles.footerLinks}>
              <Link href="/marketplace">Marketplace</Link>
              <Link href="/producer">Vender</Link>
              <Link href="/affiliate">Afiliados</Link>
              <Link href="/login">Entrar</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 TZ Store. Todos os direitos reservados.</span>
            <span>Plataforma de comércio digital.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
