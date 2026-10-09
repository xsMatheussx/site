"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import styles from "./Checkout.module.css";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

type Quote = {
  product?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    type?: string | null;
  };
  offer?: {
    id: string;
    name: string;
    price: number;
  };
};

function money(value: number) {
  return `R$ ${(value / 100).toFixed(2).replace(".", ",")}`;
}

function CheckoutContent() {
  const searchParams = useSearchParams();

  const slug = searchParams.get("slug") || "";
  const ref = searchParams.get("ref") || "";

  const [data, setData] = useState<Quote | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Produto não informado.");
      return;
    }

    fetch(`${API}/checkout/quote/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Não foi possível carregar o produto.",
          );
        }

        return result as Quote;
      })
      .then(setData)
      .catch((err) => {
        setError(
          err?.message ||
            "Não foi possível carregar o checkout.",
        );
      })
      .finally(() => {
        queueMicrotask(() => setLoading(false));
      });
  }, [slug]);

  const product = data?.product;
  const offer = data?.offer;

  const formattedPrice = useMemo(() => {
    return offer ? money(offer.price) : "—";
  }, [offer]);

  async function buy() {
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Informe seu nome.");
      return;
    }

    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }

    setBuying(true);

    try {
      const orderResponse = await fetch(
        `${API}/checkout/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug,
            name: name.trim(),
            email: email.trim(),
            method: "PIX",
            affiliateCode: ref || undefined,
          }),
        },
      );

      const order = await orderResponse.json();

      if (!orderResponse.ok || !order.orderId) {
        throw new Error(
          order.message ||
            "Não foi possível criar o pedido.",
        );
      }

      setMessage(
        "Pagamento de teste aprovado. Liberando seu acesso...",
      );

      const confirmResponse = await fetch(
        `${API}/checkout/orders/${order.orderId}/confirm`,
        {
          method: "POST",
        },
      );

      const result = await confirmResponse.json();

      if (!confirmResponse.ok || !result.accessUrl) {
        throw new Error(
          result.message ||
            "Não foi possível confirmar o pagamento.",
        );
      }

      window.location.assign(
        `http://localhost:3000${result.accessUrl}`,
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Ocorreu um erro no pagamento.",
      );
    } finally {
      setBuying(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.checkout}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandMark}>
                <img src="/tz-mark.svg" alt="" />
              </span>
              <span>TZ STORE</span>
            </Link>

            <span className={styles.secure}>
              Compra protegida
            </span>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.loading}>
            <div className={styles.loadingBox} />
            <div
              className={`${styles.loadingBox} ${styles.loadingBoxSmall}`}
            />
          </div>
        </div>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className={styles.checkout}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandMark}>
                <img src="/tz-mark.svg" alt="" />
              </span>
              <span>TZ STORE</span>
            </Link>

            <span className={styles.secure}>
              Compra protegida
            </span>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.loadError}>
            <span>Checkout</span>

            <h1>
              Não foi possível carregar esta compra.
            </h1>

            <p>{error}</p>

            <Link
              href="/marketplace"
              className={styles.backButton}
            >
              Voltar ao marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.checkout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>
              <img src="/tz-mark.svg" alt="" />
            </span>

            <span>TZ STORE</span>
          </Link>

          <span className={styles.secure}>
            Compra protegida
          </span>
        </div>
      </header>

      <div className={styles.content}>
        <Link
          href={`/product/${encodeURIComponent(
            product?.slug || slug,
          )}`}
          className={styles.back}
        >
          ← Voltar ao produto
        </Link>

        <div className={styles.layout}>
          <section className={styles.formArea}>
            <div className={styles.heading}>
              <span className={styles.kicker}>
                Finalizar compra
              </span>

              <h1 className={styles.title}>Seus dados</h1>

              <p className={styles.subtitle}>
                Preencha seus dados para continuar.
              </p>
            </div>

            <div className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="name">
                  Nome completo
                </label>

                <input
                  id="name"
                  className={styles.input}
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  disabled={buying}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="email">E-mail</label>

                <input
                  id="email"
                  className={styles.input}
                  type="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  disabled={buying}
                />

                <small>
                  Usaremos este e-mail para identificar sua
                  compra.
                </small>
              </div>

              <div className={styles.method}>
                <div>
                  <span>Método de pagamento</span>
                  <strong>PIX</strong>
                </div>

                <span className={styles.methodActive}>
                  Selecionado
                </span>
              </div>

              {error && (
                <div
                  className={`${styles.alert} ${styles.error}`}
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  className={`${styles.alert} ${styles.success}`}
                >
                  {message}
                </div>
              )}

              <button
                className={styles.submit}
                type="button"
                onClick={buy}
                disabled={buying}
              >
                {buying && (
                  <span className={styles.spinner} />
                )}

                {buying
                  ? "Processando..."
                  : "Pagar com PIX"}
              </button>

              <p className={styles.terms}>
                Ao continuar, você confirma os dados
                informados para esta compra.
              </p>
            </div>
          </section>

          <aside className={styles.summary}>
            <div className={styles.summaryLabel}>
              Resumo
            </div>

            <div className={styles.product}>
              <div className={styles.productMark}>
                TZ
              </div>

              <div>
                <strong>{product?.name}</strong>
                <span>
                  {offer?.name || "Oferta principal"}
                </span>
              </div>
            </div>

            <div className={styles.summaryLine} />

            <div className={styles.summaryRow}>
              <span>Produto</span>
              <strong>{formattedPrice}</strong>
            </div>

            <div className={styles.summaryRow}>
              <span>Pagamento</span>
              <span>PIX</span>
            </div>

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <strong>{formattedPrice}</strong>
            </div>

            <div className={styles.summaryNote}>
              Pagamento único. O acesso será disponibilizado
              após a confirmação.
            </div>
          </aside>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© TZ Store</span>
          <span>Pagamento seguro.</span>
        </div>
      </footer>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.checkout}>
          <div className={styles.content}>
            <div className={styles.loading}>
              <div className={styles.loadingBox} />
              <div
                className={`${styles.loadingBox} ${styles.loadingBoxSmall}`}
              />
            </div>
          </div>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
