"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import styles from "./Register.module.css";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Erro no cadastro.");
        return;
      }

      setSuccess(true);
      setMessage(
        "Conta criada com sucesso. Agora entre para continuar.",
      );

      setForm({
        name: "",
        email: "",
        password: "",
      });
    } catch {
      setMessage("Não foi possível conectar à API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.register}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logo}>TZ</span>
            <span>TZ Store</span>
          </Link>

          <Link
            href="/login"
            className={styles.loginLink}
          >
            Já tenho conta
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.card}>
          <span className={styles.badge}>
            Comece agora
          </span>

          <h1 className={styles.title}>
            Crie sua conta.
          </h1>

          <p className={styles.subtitle}>
            Um acesso para comprar, vender ou trabalhar com
            afiliados.
          </p>

          <form
            className={styles.form}
            onSubmit={submit}
          >
            <div className={styles.field}>
              <label htmlFor="name">Nome</label>

              <input
                id="name"
                className={styles.input}
                required
                autoComplete="name"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                disabled={loading}
              />
            </div>

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
                minLength={8}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
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

                {loading
                  ? "Criando..."
                  : "Criar minha conta"}
              </button>
            </div>
          </form>

          {message && (
            <div
              className={`${styles.alert} ${
                success ? styles.success : styles.error
              }`}
            >
              {message}
            </div>
          )}

          {success && (
            <div className={styles.actions}>
              <Link
                className={styles.loginButton}
                href="/login"
              >
                Ir para login
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
