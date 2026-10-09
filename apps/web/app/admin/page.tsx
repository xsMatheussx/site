"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./Admin.module.css";

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

type DashboardData = {
  users: number;
  products: number;
  orders: number;
  sales: number;
  commissionTotal: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  status?: string;
  category?: string | null;
  producer?: {
    profile?: {
      displayName?: string | null;
    } | null;
  } | null;
  _count?: {
    orders?: number;
  };
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

const statLabels: Record<keyof DashboardData, string> = {
  users: "Usuários",
  products: "Produtos",
  orders: "Pedidos",
  sales: "Vendas",
  commissionTotal: "Comissões",
};

export default function AdminPage() {
  const token = useSyncExternalStore(
    subscribeToken,
    getTokenSnapshot,
    getServerToken,
  );

  const [data, setData] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState(
    token ? "" : "Faça login para acessar o painel.",
  );
  const [loading, setLoading] = useState(Boolean(token));
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setProducts([]);
      return;
    }

    setLoading(true);
    setMessage("");

    Promise.all([
      fetch(`${API}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(async (response) => {
        const json = await response.json();

        if (!response.ok) {
          throw new Error(
            json.message ||
              "Não foi possível carregar o painel.",
          );
        }

        return json as DashboardData;
      }),

      fetch(`${API}/admin/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(async (response) => {
        const json = await response.json();

        if (!response.ok) {
          throw new Error(
            json.message ||
              "Não foi possível carregar os produtos.",
          );
        }

        return Array.isArray(json) ? (json as Product[]) : [];
      }),
    ])
      .then(([dashboard, productList]) => {
        setData(dashboard);
        setProducts(productList);
      })
      .catch((err) => {
        setMessage(
          err?.message ||
            "Não foi possível carregar o painel.",
        );
        setData(null);
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
        setProductsLoading(false);
      });
  }, [token]);

  const stats = data
    ? [
        ["users", data.users],
        ["products", data.products],
        ["orders", data.orders],
        ["sales", data.sales],
        ["commissionTotal", data.commissionTotal],
      ]
    : [];

  return (
    <main className={styles.admin}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.logo}>TZ</span>
            <span>TZ Store</span>
          </Link>

          <div className={styles.headerActions}>
            <Link
              className={styles.button}
              href="/marketplace"
            >
              Marketplace
            </Link>

            <Link
              className={styles.button}
              href="/producer"
            >
              Área do produtor
            </Link>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          Administração
        </div>

        <h1 className={styles.title}>
          Visão geral
        </h1>

        <p className={styles.subtitle}>
          Acompanhe os principais indicadores da TZ Store
          e os produtos cadastrados na plataforma.
        </p>

        {message && (
          <div className={styles.alert}>
            <h2 className={styles.alertTitle}>
              Painel indisponível
            </h2>

            <p className={styles.alertText}>
              {message}
            </p>

            <Link
              className={styles.alertButton}
              href="/login"
            >
              Entrar
            </Link>
          </div>
        )}

        {loading ? (
          <div className={styles.stats}>
            {[
              "users",
              "products",
              "orders",
              "sales",
              "commissionTotal",
            ].map((key) => (
              <div className={styles.stat} key={key}>
                <div
                  className={styles.skeleton}
                  style={{
                    height: 13,
                    width: "45%",
                    borderRadius: 5,
                  }}
                />

                <div
                  className={styles.skeleton}
                  style={{
                    height: 30,
                    width: "55%",
                    borderRadius: 7,
                    marginTop: 10,
                  }}
                />
              </div>
            ))}
          </div>
        ) : data ? (
          <>
            <div className={styles.stats}>
              {stats.map(([key, value]) => (
                <div
                  className={styles.stat}
                  key={String(key)}
                >
                  <div className={styles.statLabel}>
                    {statLabels[
                      key as keyof DashboardData
                    ]}
                  </div>

                  <div className={styles.statValue}>
                    {key === "commissionTotal"
                      ? formatMoney(Number(value))
                      : formatNumber(Number(value))}
                  </div>
                </div>
              ))}
            </div>

            <section className={styles.productsSection}>
              <div className={styles.productsHeader}>
                <div>
                  <div className={styles.sectionKicker}>
                    Catálogo
                  </div>

                  <h2 className={styles.sectionTitle}>
                    Produtos
                  </h2>
                </div>

                <span className={styles.productCount}>
                  {formatNumber(products.length)}
                </span>
              </div>

              {productsLoading ? (
                <div className={styles.productsEmpty}>
                  Carregando produtos...
                </div>
              ) : products.length === 0 ? (
                <div className={styles.productsEmpty}>
                  Nenhum produto cadastrado.
                </div>
              ) : (
                <div className={styles.productsTable}>
                  <div className={styles.productsTableHead}>
                    <span>Produto</span>
                    <span>Produtor</span>
                    <span>Status</span>
                    <span>Pedidos</span>
                  </div>

                  {products.map((product) => (
                    <div
                      className={styles.productsRow}
                      key={product.id}
                    >
                      <div>
                        <strong className={styles.productName}>
                          {product.name}
                        </strong>

                        {product.category && (
                          <span
                            className={styles.productMeta}
                          >
                            {product.category}
                          </span>
                        )}
                      </div>

                      <span
                        className={styles.productMeta}
                      >
                        {product.producer?.profile
                          ?.displayName ||
                          "Não informado"}
                      </span>

                      <span
                        className={`${styles.status} ${
                          product.status === "PUBLISHED" ||
                          product.status === "ACTIVE"
                            ? styles.statusPositive
                            : styles.statusNeutral
                        }`}
                      >
                        {product.status || "—"}
                      </span>

                      <span
                        className={styles.productMeta}
                      >
                        {formatNumber(
                          product._count?.orders || 0,
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
