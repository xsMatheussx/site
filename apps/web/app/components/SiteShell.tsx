"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ReactNode } from "react";
import homeStyles from "../Home.module.css";

type Area = "buyer" | "producer" | "affiliate" | "admin";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const svg = (paths: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {paths}
  </svg>
);

const icons: Record<string, ReactNode> = {
  home: svg(
    <>
      <path d="M4 11.5 12 5l8 6.5V20H4z" />
      <path d="M9 20v-5h6v5" />
    </>,
  ),

  products: svg(
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </>,
  ),

  offers: svg(
    <>
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="M4 12l8 4 8-4M4 17l8 4 8-4" />
    </>,
  ),

  files: svg(
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>,
  ),

  orders: svg(
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </>,
  ),

  customers: svg(
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c.7-3.5 2.7-5.5 6-5.5s5.3 2 6 5.5M16 11a2.5 2.5 0 1 0 0-5M17 14.5c2.2.4 3.7 2 4 5.5" />
    </>,
  ),

  affiliates: svg(
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="16" r="3" />
      <path d="m10.5 10.5 4 3" />
    </>,
  ),

  coupons: svg(
    <>
      <path d="M4 7h16v4a2 2 0 0 0 0 4v2H4v-2a2 2 0 0 0 0-4V7Z" />
      <path d="m9 14 6-6" />
    </>,
  ),

  wallet: svg(
    <>
      <path d="M4 6h16v13H4z" />
      <path d="M4 9h16M15 13h3" />
    </>,
  ),

  transactions: svg(
    <>
      <path d="M5 7h14M5 12h10M5 17h14" />
      <path d="m16 10 3 2-3 2" />
    </>,
  ),

  payouts: svg(
    <>
      <path d="M12 3v18M7 7h6a3 3 0 1 1 0 6H11a3 3 0 1 0 0 6h6" />
    </>,
  ),

  clicks: svg(
    <>
      <path d="m5 3 4 17 3-6 6 3L5 3Z" />
    </>,
  ),

  commission: svg(
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M15 9.5c-.7-.7-1.5-1-2.8-1-1.6 0-2.7.7-2.7 1.8 0 2.7 5.5 1.2 5.5 3.9 0 1.2-1 2-2.8 2-1.2 0-2.2-.3-2.9-1" />
    </>,
  ),

  users: svg(
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c.7-3.5 2.7-5.5 6-5.5s5.3 2 6 5.5M15 15c2.3.3 4.1 1.8 5 4" />
    </>,
  ),

  payments: svg(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18M7 14h4" />
    </>,
  ),

  refunds: svg(
    <>
      <path d="M6 8V4l-4 4 4 4V9c4.5 0 7.5 2.2 8.7 6.5C13.2 12.5 10.3 10.2 6 10.2" />
      <path d="M18 8v12M15 17l3 3 3-3" />
    </>,
  ),

  disputes: svg(
    <>
      <path d="M12 3 21 20H3L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </>,
  ),

  webhooks: svg(
    <>
      <path d="M8 7a4 4 0 1 1 0 8H5M16 17a4 4 0 1 1 0-8h3" />
      <path d="m9 12 6-6M9 12l6 6" />
    </>,
  ),

  logs: svg(
    <>
      <path d="M5 4h14v16H5z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </>,
  ),

  profile: svg(
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.6 3.1-5.5 7-5.5s6.2 1.9 7 5.5" />
    </>,
  ),

  settings: svg(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 13.2a7 7 0 0 0 0-2.4l2-1.2-2-3.4-2.2 1a7 7 0 0 0-2-1.2L14.5 3h-4l-.4 3a7 7 0 0 0-2 1.2l-2.2-1-2 3.4 2 1.2a7 7 0 0 0 0 2.4l-2 1.2 2 3.4 2.2-1a7 7 0 0 0 2 1.2l.4 3h4l.4-3a7 7 0 0 0 2-1.2l2.2 1 2-3.4-2-1.2Z" />
    </>,
  ),

  search: svg(
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>,
  ),

  bell: svg(
    <>
      <path d="M6 17h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v5L6 17Z" />
      <path d="M10 20h4" />
    </>,
  ),
};

const areas: Record<Area, NavGroup[]> = {
  buyer: [
    {
      title: "Conta",
      items: [
        { label: "Início", href: "/account", icon: "home" },
        { label: "Biblioteca", href: "/account", icon: "files" },
        { label: "Pedidos", href: "/account/orders", icon: "orders" },
      ],
    },
    {
      title: "Configuração",
      items: [
        {
          label: "Meu perfil",
          href: "/account/profile",
          icon: "profile",
        },
        {
          label: "Segurança",
          href: "/account/security",
          icon: "settings",
        },
      ],
    },
  ],

  producer: [
    {
      title: "Loja",
      items: [
        {
          label: "Dashboard",
          href: "/producer",
          icon: "home",
        },
      ],
    },
    {
      title: "Catálogo",
      items: [
        {
          label: "Produtos",
          href: "/producer/products",
          icon: "products",
        },
        {
          label: "Ofertas",
          href: "/producer/offers",
          icon: "offers",
        },
        {
          label: "Arquivos",
          href: "/producer/files",
          icon: "files",
        },
      ],
    },
    {
      title: "Operação",
      items: [
        {
          label: "Pedidos",
          href: "/producer/orders",
          icon: "orders",
        },
        {
          label: "Clientes",
          href: "/producer/customers",
          icon: "customers",
        },
      ],
    },
    {
      title: "Crescimento",
      items: [
        {
          label: "Afiliados",
          href: "/producer/affiliates",
          icon: "affiliates",
        },
        {
          label: "Cupons",
          href: "/producer/coupons",
          icon: "coupons",
        },
      ],
    },
    {
      title: "Financeiro",
      items: [
        {
          label: "Saldo",
          href: "/producer/wallet",
          icon: "wallet",
        },
        {
          label: "Transações",
          href: "/producer/transactions",
          icon: "transactions",
        },
        {
          label: "Repasses",
          href: "/producer/payouts",
          icon: "payouts",
        },
      ],
    },
    {
      title: "Conta",
      items: [
        {
          label: "Perfil",
          href: "/account/profile",
          icon: "profile",
        },
        {
          label: "Pagamentos",
          href: "/account/payments",
          icon: "payments",
        },
        {
          label: "Configurações",
          href: "/account/settings",
          icon: "settings",
        },
      ],
    },
  ],

  affiliate: [
    {
      title: "Afiliado",
      items: [
        {
          label: "Dashboard",
          href: "/affiliate",
          icon: "home",
        },
      ],
    },
    {
      title: "Descobrir",
      items: [
        {
          label: "Programas",
          href: "/affiliate/programs",
          icon: "affiliates",
        },
        {
          label: "Oportunidades",
          href: "/affiliate",
          icon: "products",
        },
      ],
    },
    {
      title: "Performance",
      items: [
        {
          label: "Links",
          href: "/affiliate/links",
          icon: "webhooks",
        },
        {
          label: "Cliques",
          href: "/affiliate/clicks",
          icon: "clicks",
        },
        {
          label: "Vendas",
          href: "/affiliate/sales",
          icon: "orders",
        },
      ],
    },
    {
      title: "Financeiro",
      items: [
        {
          label: "Comissões",
          href: "/affiliate/commissions",
          icon: "commission",
        },
        {
          label: "Pagamentos",
          href: "/affiliate/payouts",
          icon: "payouts",
        },
      ],
    },
    {
      title: "Conta",
      items: [
        {
          label: "Perfil",
          href: "/account/profile",
          icon: "profile",
        },
        {
          label: "Configurações",
          href: "/account/settings",
          icon: "settings",
        },
      ],
    },
  ],

  admin: [
    {
      title: "Administração",
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: "home",
        },
      ],
    },
    {
      title: "Plataforma",
      items: [
        {
          label: "Usuários",
          href: "/admin/users",
          icon: "users",
        },
        {
          label: "Produtos",
          href: "/admin/products",
          icon: "products",
        },
        {
          label: "Pedidos",
          href: "/admin/orders",
          icon: "orders",
        },
      ],
    },
    {
      title: "Financeiro",
      items: [
        {
          label: "Pagamentos",
          href: "/admin/payments",
          icon: "payments",
        },
        {
          label: "Transações",
          href: "/admin/transactions",
          icon: "transactions",
        },
        {
          label: "Reembolsos",
          href: "/admin/refunds",
          icon: "refunds",
        },
        {
          label: "Disputas",
          href: "/admin/disputes",
          icon: "disputes",
        },
      ],
    },
    {
      title: "Sistema",
      items: [
        {
          label: "Webhooks",
          href: "/admin/webhooks",
          icon: "webhooks",
        },
        {
          label: "Logs",
          href: "/admin/logs",
          icon: "logs",
        },
      ],
    },
    {
      title: "Configuração",
      items: [
        {
          label: "Configurações",
          href: "/admin/settings",
          icon: "settings",
        },
      ],
    },
  ],
};

function Logo() {
  return (
    <Link href="/" className={homeStyles.brand} aria-label="TZ Store">
      <span className={homeStyles.logoMark} aria-hidden="true">
        <span>T</span>
        <span>Z</span>
      </span>
      <span className={homeStyles.wordmark}>
        <strong>TZ</strong>
        <span>STORE</span>
      </span>
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="site-header">
      <div className="shell-container shell-nav">
        <Logo />

        <nav className="public-nav">
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/affiliate">Afiliados</Link>
          <Link href="/producer">Vender</Link>
          <Link href="/account">Biblioteca</Link>
        </nav>

        <div className="shell-actions">
          <Link href="/login" className="shell-btn shell-btn-secondary">
            Entrar
          </Link>

          <Link href="/register" className="shell-btn shell-btn-primary">
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}

function getInitial() {
  if (typeof window === "undefined") return "M";

  return (localStorage.getItem("tz_user_initial") || "M")
    .trim()
    .slice(0, 1)
    .toUpperCase();
}

export function DashboardShell({
  area,
  children,
  title,
  description,
}: {
  area: Area;
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const groups = areas[area];

  const currentPath = usePathname();

  function logout() {
    localStorage.removeItem("tz_access_token");
    localStorage.removeItem("tz_user_initial");
    window.location.assign("/login");
  }

  return (
    <div className={`dashboard-shell dashboard-shell-${area}`}>
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-top">
          <Logo />
        </div>

        <nav className="dashboard-nav">
          {groups.map((group) => (
            <div className="dashboard-nav-group" key={group.title}>
              <div className="dashboard-nav-title">{group.title}</div>

              {group.items.map((item) => {
                const active =
                  currentPath === item.href ||
                  (item.href !== "/producer" &&
                    item.href !== "/affiliate" &&
                    item.href !== "/admin" &&
                    item.href !== "/account" &&
                    currentPath.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={`${group.title}-${item.label}`}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`dashboard-nav-item ${active ? "dashboard-nav-item-active" : ""}`}
                  >
                    <span className="dashboard-nav-icon">
                      {icons[item.icon]}
                    </span>

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <button
            className="dashboard-profile"
            type="button"
            onClick={() => window.location.assign("/account/profile")}
          >
            <span className="dashboard-avatar">{getInitial()}</span>

            <span>
              <strong>Minha conta</strong>
              <small>Perfil e configurações</small>
            </span>
          </button>

          <button className="dashboard-logout" type="button" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-search">
            <span className="dashboard-search-icon">{icons.search}</span>

            <span>Pesquisar...</span>

            <kbd>Ctrl K</kbd>
          </div>

          <div className="dashboard-top-actions">
            <button
              className="dashboard-icon-button"
              type="button"
              aria-label="Notificações"
            >
              {icons.bell}
            </button>

            <span className="dashboard-avatar">{getInitial()}</span>
          </div>
        </header>

        <nav className="dashboard-mobile-nav" aria-label="Navegação principal">
          {groups.flatMap((group) => group.items).slice(0, 6).map((item) => {
            const active = currentPath === item.href || (item.href !== "/producer" && item.href !== "/affiliate" && item.href !== "/admin" && item.href !== "/account" && currentPath.startsWith(`${item.href}/`));
            return (
              <Link key={`mobile-${item.label}`} href={item.href} aria-current={active ? "page" : undefined} className={active ? "dashboard-mobile-nav-active" : ""}>
                <span className="dashboard-nav-icon">{icons[item.icon]}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <main className="dashboard-content">
          {(title || description) && (
            <div className="dashboard-page-head">
              <div>
                <h1>{title}</h1>

                {description && <p>{description}</p>}
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
