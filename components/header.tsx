"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Moon, ShieldCheck, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  ["Overview", "#home"],
  ["Sponsors", "#sponsors"],
  ["2026 Archive", "#auction-last"],
  ["Donors", "#donations"],
  ["Expenses", "#expenses"],
  ["Events", "#schedule"],
  ["Gallery", "#gallery"],
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("utsav-theme");
    const shouldUseDark = saved ? saved === "dark" : true;
    setDark(shouldUseDark);
    document.documentElement.classList.toggle("light-theme", !shouldUseDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("light-theme", !next);
    window.localStorage.setItem("utsav-theme", next ? "dark" : "light");
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand-lockup" href="#home" aria-label="Suryodaya Colony Ganesh Utsav home">
          <Image src="/images/ganesh-logo.png" alt="" width={45} height={45} priority />
          <span><strong>SURYODAYA COLONY</strong><small>Building Bonds · Celebrating Together · Growing Stronger</small></span>
        </a>
        <div className="header-right">
          <nav className={`header-nav${menuOpen ? " open" : ""}`} aria-label="Main navigation">
            {links.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          </nav>
          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} theme`}>
            {dark ? <Sun size={15} /> : <Moon size={14} />}
          </button>
          <Link className="header-cta" href="/admin/login"><ShieldCheck size={15} /> Admin</Link>
          <button type="button" className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
