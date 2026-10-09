"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./Account.module.css";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

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

type Lesson = {
  id: string;
  title: string;
  position: number;
};

type Module = {
  id: string;
  title: string;
  position: number;
  lessons?: Lesson[];
};

type Course = {
  id: string;
  modules?: Module[];
};

type ProductFile = {
  id: string;
  fileName: string;
};

type Access = {
  id: string;
  status: string;
  grantedAt?: string;
  product?: {
    name?: string | null;
    description?: string | null;
    files?: ProductFile[];
    course?: Course | null;
  };
};

export default function AccountPage() {
  const token = useSyncExternalStore(
    subscribeToken,
    getTokenSnapshot,
    getServerToken,
  );

  const [data, setData] = useState<Access[] | null>(null);
  const [message, setMessage] = useState(
    token
      ? ""
      : "Você precisa entrar para acessar sua biblioteca.",
  );

  const loading = Boolean(token) && data === null;

  useEffect(() => {
    if (!token) {
      return;
    }

    fetch(`${API}/delivery/mine`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const json = await response.json();

        if (!response.ok) {
          throw new Error(
            json.message ||
              "Não foi possível carregar sua biblioteca.",
          );
        }

        return json;
      })
      .then((json) => {
        setData(Array.isArray(json) ? json : []);
      })
      .catch((err) => {
        setMessage(
          err?.message ||
            "Não foi possível carregar sua biblioteca.",
        );
        setData([]);
      });
  }, [token]);

  function logout() {
    localStorage.removeItem("tz_access_token");
    window.dispatchEvent(new Event("storage"));
    window.location.href = "/login";
  }

  return (
    <main className={styles.account}>
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

            <button
              className={styles.buttonSecondary}
              type="button"
              onClick={logout}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          Área do comprador
        </div>

        <h1 className={styles.title}>
          Minha biblioteca
        </h1>

        <p className={styles.subtitle}>
          Tudo o que você comprou em um único lugar.
        </p>

        {loading ? (
          <div className={styles.loading}>
            {[1, 2, 3].map((item) => (
              <div className={styles.card} key={item}>
                <div
                  className={styles.skeleton}
                  style={{
                    height: 25,
                    width: "60%",
                    borderRadius: 7,
                  }}
                />

                <div
                  className={styles.skeleton}
                  style={{
                    height: 16,
                    width: "82%",
                    borderRadius: 7,
                    marginTop: 14,
                  }}
                />
              </div>
            ))}
          </div>
        ) : message ? (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>
              Biblioteca indisponível
            </h2>

            <p className={styles.emptyText}>
              {message}
            </p>

            <Link
              className={styles.button}
              href="/login"
            >
              Entrar
            </Link>
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>
              Sua biblioteca está vazia.
            </h2>

            <p className={styles.emptyText}>
              Quando você comprar um produto, ele aparecerá
              automaticamente aqui.
            </p>

            <Link
              className={styles.button}
              href="/marketplace"
            >
              Explorar produtos
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {(data ?? []).map((access) => {
              const product = access.product;
              const files = product?.files ?? [];
              const modules = [...(product?.course?.modules ?? [])]
                .sort((a, b) => a.position - b.position);

              const lessonCount = modules.reduce(
                (total, module) =>
                  total + (module.lessons?.length ?? 0),
                0,
              );

              return (
                <article
                  className={styles.card}
                  key={access.id}
                >
                  <span className={styles.eyebrow}>
                    <span className={styles.eyebrowDot} />
                    Acesso ativo
                  </span>

                  <h2>
                    {product?.name ||
                      "Produto digital"}
                  </h2>

                  <p>
                    {product?.description ||
                      "Produto digital adquirido."}
                  </p>

                  {product?.course && (
                    <section className={styles.course}>
                      <div className={styles.courseHeader}>
                        <h3 className={styles.courseTitle}>
                          Curso
                        </h3>

                        <span className={styles.courseMeta}>
                          {modules.length}{" "}
                          {modules.length === 1
                            ? "módulo"
                            : "módulos"}{" "}
                          · {lessonCount}{" "}
                          {lessonCount === 1
                            ? "aula"
                            : "aulas"}
                        </span>
                      </div>

                      {modules.length === 0 ? (
                        <div
                          className={styles.courseEmpty}
                        >
                          Este curso ainda não possui
                          módulos publicados.
                        </div>
                      ) : (
                        <div className={styles.modules}>
                          {modules.map((module) => {
                            const lessons = [
                              ...(module.lessons ?? []),
                            ].sort(
                              (a, b) =>
                                a.position - b.position,
                            );

                            return (
                              <div
                                className={styles.module}
                                key={module.id}
                              >
                                <div
                                  className={
                                    styles.moduleHeader
                                  }
                                >
                                  {module.title}
                                </div>

                                {lessons.length > 0 && (
                                  <div
                                    className={
                                      styles.lessons
                                    }
                                  >
                                    {lessons.map(
                                      (lesson, index) => (
                                        <div
                                          className={
                                            styles.lesson
                                          }
                                          key={lesson.id}
                                        >
                                          <span
                                            className={
                                              styles.lessonNumber
                                            }
                                          >
                                            {String(
                                              index + 1,
                                            ).padStart(
                                              2,
                                              "0",
                                            )}
                                          </span>

                                          <span>
                                            {lesson.title}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  )}

                  {files.length > 0 && (
                    <div className={styles.links}>
                      {files.map((file) => (
                        <a
                          className={styles.link}
                          key={file.id}
                          href={`${API}/delivery/${access.id}/files/${file.id}`}
                        >
                          <span>
                            <strong>
                              {file.fileName}
                            </strong>
                          </span>

                          <span
                            className={styles.linkArrow}
                          >
                            ↓
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
