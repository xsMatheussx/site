"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Marketplace.module.css";
import homeStyles from "../Home.module.css";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  category?: string | null;
  type?: string | null;
  offers?: Array<{ price?: number }>;
};

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/products`)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Falha ao carregar produtos.",
          );
        }

        return data;
      })
      .then((data) => {
        setProducts(
          Array.isArray(data?.data) ? data.data : [],
        );
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className={styles.marketplace}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link
            href="/"
            aria-label="TZ Store — início"
          >
            <span className={homeStyles.brandCompact}>
              <span
                className={homeStyles.logoMark}
                aria-hidden="true"
              >
                <span>T</span>
                <span>Z</span>
              </span>

              <span className={homeStyles.wordmark}>
                <strong>TZ</strong>
                <span>STORE</span>
              </span>
            </span>
          </Link>

          <nav className={styles.nav}>
            <Link
              href="/marketplace"
              className={styles.active}
            >
              Marketplace
            </Link>

            <Link href="/producer">
              Vender
            </Link>

            <Link href="/affiliate">
              Afiliados
            </Link>

            <Link href="/account">
              Biblioteca
            </Link>
          </nav>

          <Link
            href="/login"
            className={styles.login}
          >
            Entrar
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            <i />
            DESCUBRA
          </span>

          <h1>Marketplace</h1>

          <p>
            Encontre produtos digitais para aprender, usar
            e transformar conhecimento em resultado.
          </p>
        </div>

        <Link
          href="/producer"
          className={styles.heroButton}
        >
          Quero vender →
        </Link>
      </section>

      <section className={styles.content}>
        <div className={styles.sectionTop}>
          <div>
            <span>PRODUTOS</span>
            <h2>Escolha o próximo.</h2>
          </div>

          <div className={styles.count}>
            {loading
              ? "Carregando..."
              : `${products.length} produtos`}
          </div>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[1, 2, 3].map((item) => (
              <div
                className={styles.skeletonCard}
                key={item}
              >
                <div className={styles.skeletonCover} />
                <div className={styles.skeletonLine} />
                <div
                  className={styles.skeletonLineSmall}
                />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyLogo}>
              <div
                className={homeStyles.logoMark}
                aria-hidden="true"
              >
                <span>T</span>
                <span>Z</span>
              </div>
            </div>

            <h3>
              Nenhum produto disponível ainda.
            </h3>

            <p>
              Quando novos produtos forem publicados,
              eles aparecerão aqui.
            </p>

            <Link
              href="/producer"
              className={styles.heroButton}
            >
              Publicar produto →
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {products.map((product) => {
              const description =
                product.shortDescription ||
                product.description ||
                "Produto digital disponível na TZ Store.";

              const price =
                product.offers?.[0]?.price;

              return (
                <article
                  className={styles.card}
                  key={product.id}
                >
                  <div className={styles.cover}>
                    <span>
                      {product.type || "DIGITAL"}
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.badges}>
                      {product.category && (
                        <span>
                          {product.category}
                        </span>
                      )}

                      <span>Digital</span>
                    </div>

                    <h3>{product.name}</h3>

                    <p>{description}</p>

                    <div className={styles.cardFooter}>
                      <strong>
                        {typeof price === "number"
                          ? `R$ ${(price / 100)
                              .toFixed(2)
                              .replace(".", ",")}`
                          : "Ver oferta"}
                      </strong>

                      <Link
                        href={`/product/${encodeURIComponent(
                          product.slug,
                        )}`}
                        className={styles.productButton}
                      >
                        Ver produto
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
