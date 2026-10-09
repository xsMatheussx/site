"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import styles from "./Login.module.css";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.accessToken) {
        setMessage(
          data.message || "Não foi possível entrar.",
        );
        return;
      }

      localStorage.setItem(
        "tz_access_token",
        data.accessToken,
      );

      window.location.assign("/account");
    } catch {
      setMessage("Não foi possível conectar à API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.login}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logo}>TZ</span>
            <span>TZ Store</span>
          </Link>

          <Link
            href="/marketplace"
            className={styles.marketplace}
          >
            Marketplace
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.card}>
          <span className={styles.badge}>
            Conta TZ Store
          </span>

          <h1 className={styles.title}>
            Bem-vindo de volta.
          </h1>

          <p className={styles.subtitle}>
            Entre para acessar sua conta e sua biblioteca.
          </p>

          <form
            className={styles.form}
            onSubmit={submit}
          >
            <div className={styles.field}>
              <label htmlFor="email">E-mail</label>

              <input
                id="email"
                className={styles.input}
                type="email"
                required
                autoComplete="email"
                placeholder="voce@email.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                disabled={loading}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Senha</label>

              <input
                id="password"
                className={styles.input}
                type="password"
                required
                autoComplete="current-password"
                placeholder="Sua senha"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                disabled={loading}
              />
            </div>

            <div className={styles.actions}>
              <button
                className={styles.submit}
                type="submit"
                disabled={loading}
              >
                {loading && (
                  <span className={styles.spinner} />
                )}

                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>

            {message && (
              <div className={styles.alert}>
                {message}
              </div>
            )}
          </form>

          <div className={styles.divider} />

          <p className={styles.registerText}>
            Ainda não possui conta?{" "}
            <Link
              href="/register"
              className={styles.registerLink}
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
