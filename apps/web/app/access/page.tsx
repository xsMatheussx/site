"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./Access.module.css";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

function AccessContent() {
  const q = useSearchParams();
  const token = q.get("token") || "";

  const [data, setData] = useState<any>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => setError("Token de acesso ausente."));
      return;
    }

    fetch(`${API}/delivery/access/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.message || "Acesso inválido.");
        }

        return json;
      })
      .then(setData)
      .catch((err) => {
        setError(
          err?.message || "Não foi possível carregar seu acesso."
        );
      });
  }, [token]);

  if (error) {
    return (
      <main className={styles.access}>
        <div className={styles.content}>
          <section className={styles.error}>
            <div className={styles.errorIcon}>!</div>

            <h1 className={styles.errorTitle}>
              Não foi possível abrir seu acesso.
            </h1>

            <p className={styles.errorText}>{error}</p>

            <Link className={styles.backButton} href="/marketplace">
              Voltar ao marketplace
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (!data?.product) {
    return <AccessFallback />;
  }

  const files = data.product.files || [];

  return (
    <main className={styles.access}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.logo}>TZ</span>
            <span>TZ Store</span>
          </Link>

          <span className={styles.status}>
            <span className={styles.statusDot} />
            Acesso ativo
          </span>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.hero}>
          <div className={styles.heroIcon}>✓</div>

          <h1 className={styles.title}>{data.product.name}</h1>

          <p className={styles.description}>
            Seu acesso está liberado. Você pode baixar os arquivos
            disponíveis abaixo.
          </p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>
              Arquivos disponíveis
            </h2>

            <p className={styles.sectionSubtitle}>
              Clique em baixar para acessar seu conteúdo.
            </p>
          </div>

          {files.length === 0 ? (
            <div className={styles.empty}>
              <h3 className={styles.emptyTitle}>
                O conteúdo ainda está sendo preparado.
              </h3>

              <p className={styles.emptyText}>
                Seu acesso foi liberado, mas este produto ainda não
                possui arquivos disponíveis.
              </p>
            </div>
          ) : (
            <div className={styles.files}>
              {files.map((file: any) => (
                <div className={styles.file} key={file.id}>
                  <div className={styles.fileInfo}>
                    <strong className={styles.fileName}>
                      {file.fileName}
                    </strong>

                    <span className={styles.fileType}>
                      {file.mimeType || "Arquivo digital"}
                    </span>
                  </div>

                  <a
                    className={styles.button}
                    href={`${API}/delivery/access/${encodeURIComponent(
                      token
                    )}/files/${file.id}`}
                  >
                    Baixar arquivo
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AccessFallback() {
  return (
    <main className={styles.access}>
      <div className={styles.loading}>
        <div
          className={`${styles.skeleton} ${styles.skeletonLarge}`}
        />

        <div
          className={`${styles.skeleton} ${styles.skeletonSmall}`}
        />
      </div>
    </main>
  );
}

export default function AccessPage() {
  return (
    <Suspense fallback={<AccessFallback />}>
      <AccessContent />
    </Suspense>
  );
}
