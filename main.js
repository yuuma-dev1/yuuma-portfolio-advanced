"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Utils ----------
  const safeJSONParse = (str, fallback) => {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  const setYear = () => {
    const y = qs("[data-year]");
    if (y) y.textContent = String(new Date().getFullYear());
  };

  // ---------- Nav: current page highlight ----------
  const markCurrentNav = () => {
    const currentFile = location.pathname.split("/").pop() || "index.html";
    qsa(".nav-list a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href === currentFile) a.classList.add("is-current");
    });
  };

  // ---------- Smooth scroll (optional) ----------
  const enableScrollLinks = () => {
    qsa("[data-scroll]").forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href") || "";
        if (!href.startsWith("#")) return;
        const target = qs(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // href="#" の「一番上へ戻る」暴走を止める
    qsa('a[href="#"]').forEach((a) => {
      a.addEventListener("click", (e) => e.preventDefault());
    });
  };

  // ---------- Reveal sections by IntersectionObserver ----------
  const revealSections = () => {
    const sections = qsa(".section");
    
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { root: null, threshold: 0.12 }
    );

    sections.forEach((s) => io.observe(s));
  };

  // ---------- Mobile nav ----------
  const initMobileNav = () => {
    const toggle = qs("[data-nav-toggle]");
    const nav = qs("[data-nav]");
    if (!toggle || !nav) return;

    const open = () => {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      expanded ? close() : open();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    nav.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      close();
    });
  };

  // ---------- Theme (light/dark) ----------
  const initTheme = () => {
    const btn = qs("[data-theme-toggle]");
    const key = "theme";
    const saved = localStorage.getItem(key);
    if (saved === "dark") document.documentElement.dataset.theme = "dark";

    if (!btn) return;

    btn.addEventListener("click", () => {
      const isDark = document.documentElement.dataset.theme === "dark";
      if (isDark) {
        delete document.documentElement.dataset.theme;
        localStorage.setItem(key, "light");
      } else {
        document.documentElement.dataset.theme = "dark";
        localStorage.setItem(key, "dark");
      }
    });
  };

  // ---------- Projects: filter & search ----------
  const initProjects = () => {
    const list = qs("[data-project-list]");
    if (!list) return;

    const items = qsa("[data-project]", list);
    const chips = qsa("[data-filter]");
    const input = qs("[data-project-search]");
    const empty = qs("[data-empty]");

    const storageKey = "projectsState";
    const saved = safeJSONParse(localStorage.getItem(storageKey) || "", { filter: "all", q: "" });

    let state = {
      filter: saved.filter || "all",
      q: saved.q || "",
    };

    const saveState = () => localStorage.setItem(storageKey, JSON.stringify(state));

    const setActiveChip = () => {
      chips.forEach((c) => c.classList.toggle("is-active", c.dataset.filter === state.filter));
    };

    const match = (el) => {
      const tags = (el.dataset.tags || "").split(/\s+/).filter(Boolean);
      const okFilter = state.filter === "all" ? true : tags.includes(state.filter);
      const text = (el.textContent || "").toLowerCase();
      const okQuery = state.q ? text.includes(state.q.toLowerCase()) : true;
      return okFilter && okQuery;
    };

    const render = () => {
      let shown = 0;
      items.forEach((el) => {
        const ok = match(el);
        el.hidden = !ok;
        if (ok) shown += 1;
      });
      if (empty) empty.hidden = shown !== 0;
    };

    if (input) input.value = state.q;
    setActiveChip();
    render();

    chips.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.filter = btn.dataset.filter || "all";
        setActiveChip();
        render();
        saveState();
      });
    });

    if (input) {
      input.addEventListener("input", () => {
        state.q = input.value.trim();
        render();
        saveState();
      });
    }
  };

  // ---------- Contact form (demo) ----------
  const initContactForm = () => {
    const form = qs("[data-contact-form]");
    if (!form) return;

    const nameEl = qs("#name", form);
    const emailEl = qs("#email", form);
    const msgEl = qs("#message", form);
    const statusEl = qs("[data-form-status]", form);
    const submitBtn = qs('button[type="submit"]', form);

    const setStatus = (text, type) => {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.dataset.type = type || "";
    };

    const isEmailLike = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = (nameEl?.value || "").trim();
      const email = (emailEl?.value || "").trim();
      const msg = (msgEl?.value || "").trim();

      if (!name || !email || !msg) {
        setStatus("未入力の項目があります。すべて入力してください。", "error");
        return;
      }
      if (!isEmailLike(email)) {
        setStatus("メールアドレスの形式が正しくありません。", "error");
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus("送信中…", "loading");

      window.setTimeout(() => {
        setStatus("送信が完了しました（デモ）。ありがとうございます。", "success");
        form.reset();
        if (submitBtn) submitBtn.disabled = false;
      }, 700);
    });
  };

  // ---------- Boot ----------
  setYear();
  markCurrentNav();
  enableScrollLinks();
  revealSections();
  initMobileNav();
  initTheme();
  initProjects();
  initContactForm();
});
