"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "../../components/SiteShell";
import styles from "./Product.module.css";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

type Offer = {
  id: string;
  name: string;
  price: number;
  status?: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  type?: string | null;
};

type Quote = {
  product?: Product;
  offer?: Offer;
};

function money(value: number) {
  return `R$ ${(value / 100).toFixed(2).replace(".", ",")}`;
}

function typeLabel(type?: string | null) {
  switch (type) {
    case "FILE":
      return "Arquivo digital";
    case "COURSE":
      return "Curso";
    case "CONTENT":
      return "Conteúdo digital";
    case "COMMUNITY":
      return "Comunidade";
    default:
      return "Produto digital";
  }
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [data, setData] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch(`${API}/checkout/quote/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || "Produto não encontrado.",
          );
        }

        return result as Quote;
      })
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err?.message ||
              "Não foi possível carregar o produto.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const product = data?.product;
  const offer = data?.offer;

  const description =
    product?.description?.trim() ||
    "Produto digital disponível para compra na TZ Store.";

  const benefits = useMemo(
    () => [
      "Pagamento seguro",
      "Acesso após confirmação",
      "Entrega digital",
    ],
    [],
  );

  if (loading) {
    return (
      <main className={styles.product}>
        <PublicHeader />

        <div className={styles.content}>
          <div className={styles.loading}>
            <div className={styles.loadingMain}>
              <span
                className={styles.skeleton}
                style={{ width: "28%", height: 14 }}
              />
              <span
                className={styles.skeleton}
                style={{ width: "78%", height: 58 }}
              />
              <span
                className={styles.skeleton}
                style={{ width: "90%", height: 20 }}
              />
            </div>

            <div className={styles.loadingSide}>
              <span
                className={styles.skeleton}
                style={{ height: 260 }}
              />
              <span
                className={styles.skeleton}
                style={{ width: "65%", height: 18 }}
              />
              <span
                className={styles.skeleton}
                style={{ height: 50 }}
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product || !offer) {
    return (
      <main className={styles.product}>
        <PublicHeader />

        <div className={styles.content}>
          <div className={styles.notFound}>
            <div className={styles.notFoundCode}>404</div>

            <h1 className={styles.notFoundTitle}>
              Produto não encontrado.
            </h1>

            <p className={styles.notFoundText}>
              {error ||
                "Esse produto não está disponível no momento."}
            </p>

            <Link
              href="/marketplace"
              className={styles.notFoundButton}
            >
              Voltar ao marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.product}>
      <PublicHeader />

      <div className={styles.content}>
        <Link href="/marketplace" className={styles.back}>
          ← Marketplace
        </Link>

        <div className={styles.layout}>
          <section className={styles.main}>
            <div className={styles.meta}>
              <span>
                {product.category || "Produto digital"}
              </span>

              <span className={styles.metaSeparator}>•</span>

              <span>{typeLabel(product.type)}</span>
            </div>

            <h1 className={styles.title}>{product.name}</h1>

            <p className={styles.description}>{description}</p>

            <div className={styles.divider} />

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                O que você recebe
              </h2>

              <div className={styles.benefits}>
                {benefits.map((item, index) => (
                  <div className={styles.benefit} key={item}>
                    <span className={styles.benefitNumber}>
                      0{index + 1}
                    </span>

                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.trust}>
                <div className={styles.trustItem}>
                  <strong>Compra pela TZ Store</strong>
                  <span>
                    Seu pedido fica registrado na plataforma.
                  </span>
                </div>

                <div className={styles.trustItem}>
                  <strong>Acesso digital</strong>
                  <span>
                    O acesso é liberado após a confirmação do
                    pagamento.
                  </span>
                </div>
              </div>
            </section>
          </section>

          <aside className={styles.buy}>
            <div className={styles.buyTop}>
              <span className={styles.buyLabel}>
                Oferta atual
              </span>

              <span className={styles.buyStatus}>
                Disponível
              </span>
            </div>

            <h2 className={styles.offerName}>{offer.name}</h2>

            <div className={styles.price}>
              {money(offer.price)}
            </div>

            <p className={styles.priceCaption}>
              Pagamento único
            </p>

            <div className={styles.buyLine} />

            <div className={styles.details}>
              <div className={styles.detail}>
                <span>Produto</span>
                <strong>{product.name}</strong>
              </div>

              <div className={styles.detail}>
                <span>Entrega</span>
                <strong>Digital</strong>
              </div>
            </div>

            <Link
              className={styles.buyButton}
              href={`/checkout?slug=${encodeURIComponent(
                product.slug,
              )}`}
            >
              Comprar agora
            </Link>

            <p className={styles.buyNote}>
              Você será direcionado ao checkout da TZ Store.
            </p>
          </aside>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© TZ Store</span>
          <span>Produtos digitais.</span>
        </div>
      </footer>
    </main>
  );
}
