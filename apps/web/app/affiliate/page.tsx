"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Affiliate.module.css";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function AffiliatePage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API}/affiliates/opportunities`)
      .then(async (response) => {
        const json = await response.json();

        if (!response.ok) {
          throw new Error(
            json.message ||
              "Não foi possível carregar as oportunidades."
          );
        }

        return json;
      })
      .then((json) => setOpportunities(json || []))
      .catch((err) =>
        setMessage(
          err?.message ||
            "Não foi possível carregar as oportunidades."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.affiliate}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.logo}>TZ</span>
            <span>TZ Store</span>
          </Link>

          <div className={styles.actions}>
            <Link
              className={styles.buttonSecondary}
              href="/marketplace"
            >
              Marketplace
            </Link>

            <Link className={styles.button} href="/login">
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          Central de afiliados
        </div>

        <h1 className={styles.title}>
          Encontre produtos para promover.
        </h1>

        <p className={styles.subtitle}>
          Descubra oportunidades e veja quanto cada produto pode
          gerar.
        </p>

        {message && (
          <div className={styles.alert} role="alert">
            {message}
          </div>
        )}

        {loading ? (
          <div className={styles.skeletonGrid}>
            {[1, 2, 3].map((item) => (
              <div
                className={styles.skeletonCard}
                key={item}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>
              Nenhuma oportunidade disponível.
            </h2>

            <p className={styles.emptyText}>
              Novos programas de afiliados aparecerão aqui quando
              forem publicados.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {opportunities.map((item) => (
              <article className={styles.card} key={item.id}>
                <span className={styles.badge}>Ativo</span>

                <h2 className={styles.productName}>
                  {item.product?.name || "Produto sem nome"}
                </h2>

                <p className={styles.commission}>
                  Comissão:{" "}
                  {item.commissionType === "PERCENTAGE"
                    ? `${item.commissionValue}%`
                    : `R$ ${(item.commissionValue / 100).toFixed(2)}`}
                </p>

                <Link
                  className={`${styles.button} ${styles.promote}`}
                  href="/login"
                >
                  Quero promover
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
