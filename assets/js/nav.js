/* ============================================================
   nav.js —— 顶部导航 / 移动端抽屉 / 全站搜索 / 页脚
   依赖 core.js
   ============================================================ */
(function () {
  "use strict";
  const { qs, qsa, esc, icon, data, serviceUrl, policyUrl, debounce, store } = window.App;

  let SITE = null;
  let SEARCH_INDEX = null;

  /* ---------- 生成顶部 ---------- */
  function renderTop() {
    const header = qs("#site-header");
    const page = (header && header.dataset.page) || "home";
    const nav = SITE.nav;
    const legal = SITE.legal;

    const navItems = nav.map(item => {
      let children = item.children || null;
      let href = item.href;
      let isActive = item.key === page;
      const label = esc(item.label);

      if (!children && item.childrenFrom === "categories") {
        children = SEARCH_CATEGORIES.map(c => ({
          label: c.name,
          desc: c.short,
          href: "services.html?cat=" + c.id
        }));
      }
      if (!children) {
        return '<a class="nav-item' + (isActive ? " is-active" : "") + '" href="' + href + '">' + label + "</a>";
      }
      const subs = children.map(c =>
        '<a class="nav-sub" href="' + c.href + '"><strong>' + esc(c.label) + "</strong>" +
        (c.desc ? "<span>" + esc(c.desc) + "</span>" : "") + "</a>").join("");
      return '<div class="nav-item' + (isActive ? " is-active" : "") + '" data-drop>' +
        '<a href="' + href + '" style="display:inline-flex;align-items:center;color:inherit">' + label +
        icon("chevronDown") + "</a>" +
        '<div class="nav-panel"><div class="nav-panel-head">' + label + " · 请选择具体服务</div>" +
        '<div class="nav-panel-grid">' + subs + "</div></div></div>";
    }).join("");

    const html =
      '<div class="topbar"><div class="container topbar-inner">' +
        '<div class="topbar-left"><span class="tag tag-brand">政策</span>' +
          '<a class="ellipsis" href="policy.html">' + esc(SITE.notice) + "</a></div>" +
        '<div class="topbar-right">' +
          '<span>' + esc(SITE.contact.workTime) + "</span>" +
          '<a class="topbar-phone" href="tel:' + esc(SITE.contact.hotline) + '">' +
            icon("phone") + esc(SITE.contact.hotline) + "</a>" +
        "</div>" +
      "</div></div>" +
      '<div class="header-inner container">' +
        '<a class="brand" href="index.html" aria-label="' + esc(SITE.brand.name) + " · " + esc(SITE.brand.slogan) + '">' +
          '<img class="brand-logo" src="' + (SITE.brand.logo || "assets/img/logo.png") + '" alt="' + esc(SITE.brand.name) + '">' +
          "</a>" +
        '<nav class="main-nav" aria-label="主导航">' + navItems + "</nav>" +
        '<div class="header-search">' + icon("search", "search-icon") +
          '<input type="search" id="global-search" placeholder="搜服务、政策" autocomplete="off" aria-label="全站搜索">' +
          '<div class="search-results" id="search-results"></div></div>' +
        '<div class="header-actions">' +
          '<a class="btn btn-primary btn-sm" href="contact.html">免费咨询</a>' +
          '<button class="nav-toggle" id="nav-toggle" aria-label="打开菜单" aria-expanded="false"><span></span></button>' +
        "</div>" +
      "</div>";

    header.innerHTML = html;
    wireNav();
    wireSearch();
  }

  /* ---------- 导航交互 ---------- */
  function wireNav() {
    // 桌面端下拉：悬停展开，点击一级标题跳分类页
    qsa("[data-drop]").forEach(drop => {
      const panel = qs(".nav-panel", drop);
      if (!panel) return;
      let timer;
      drop.addEventListener("mouseenter", () => {
        clearTimeout(timer);
        qsa("[data-drop]").forEach(d => d.classList.remove("is-open"));
        drop.classList.add("is-open");
      });
      drop.addEventListener("mouseleave", () => {
        timer = setTimeout(() => drop.classList.remove("is-open"), 160);
      });
      drop.addEventListener("focusin", () => drop.classList.add("is-open"));
      drop.addEventListener("keydown", e => {
        if (e.key === "Escape") drop.classList.remove("is-open");
      });
    });

    // 移动端抽屉
    const toggle = qs("#nav-toggle");
    const mask = qs(".drawer-mask");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = !qs(".drawer").classList.contains("is-open");
        qs(".drawer").classList.toggle("is-open", open);
        if (mask) mask.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      });
    }
    if (mask) {
      mask.addEventListener("click", () => {
        qs(".drawer").classList.remove("is-open");
        mask.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    }
    const close = qs(".drawer-close");
    if (close) {
      close.addEventListener("click", () => {
        qs(".drawer").classList.remove("is-open");
        if (mask) mask.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    }

    // 滚动阴影
    const onScroll = () => {
      const h = qs(".site-header");
      if (h) h.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 移动端抽屉 ---------- */
  function renderDrawer() {
    const mask = document.createElement("div");
    mask.className = "drawer-mask";
    document.body.appendChild(mask);

    const navHtml = SITE.nav.map(item => {
      let children = item.children;
      if (!children && item.childrenFrom === "categories") {
        children = SEARCH_CATEGORIES.map(c => ({ label: c.name, href: "services.html?cat=" + c.id }));
      }
      if (!children) {
        return '<a class="drawer-link" href="' + item.href + '">' + esc(item.label) + icon("arrowRight") + "</a>";
      }
      return '<a class="drawer-link" href="' + item.href + '">' + esc(item.label) + icon("arrowRight") + "</a>" +
        '<div class="drawer-subs">' + children.map(c =>
          '<a href="' + c.href + '">' + esc(c.label) + "</a>").join("") + "</div>";
    }).join("");

    const drawer = document.createElement("aside");
    drawer.className = "drawer";
    drawer.setAttribute("aria-label", "移动端菜单");
    drawer.innerHTML =
      '<div class="drawer-head"><span class="drawer-brand"><img class="drawer-logo" src="' +
        (SITE.brand.logoMark || "assets/img/logo-mark.png") + '" alt="' + esc(SITE.brand.name) + '">' +
        "<strong>" + esc(SITE.brand.name) + "</strong></span>" +
        '<button class="drawer-close" aria-label="关闭菜单">×</button></div>' +
      '<div class="drawer-body">' + navHtml +
        '<div class="drawer-cta">' +
          '<a class="btn btn-primary btn-block" href="tel:' + esc(SITE.contact.hotline) + '">电话咨询 ' + esc(SITE.contact.hotline) + "</a>" +
          '<a class="btn btn-ghost btn-block" href="contact.html">在线留言</a>' +
        "</div></div>";
    document.body.appendChild(drawer);

    // 抽屉里的关闭按钮在 renderTop 时已绑定，这里再绑一次（新节点）
    qs(".drawer-close").addEventListener("click", () => {
      drawer.classList.remove("is-open");
      mask.classList.remove("is-open");
      document.body.style.overflow = "";
      const t = qs("#nav-toggle");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  }

  /* ---------- 全站搜索 ---------- */
  async function buildSearchIndex() {
    if (SEARCH_INDEX) return SEARCH_INDEX;
    const [svc, pol] = await Promise.all([data.services(), data.policies()]);
    SEARCH_INDEX = {
      services: svc.services.map(s => ({
        id: s.id, name: s.name, desc: s.desc, cat: s.cat,
        text: [s.name, s.tagline, s.desc, (s.audience || []).join(" ")].join(" ")
      })),
      policies: pol.policies.map(p => ({
        id: p.id, name: p.title, desc: p.summary, type: p.type,
        text: [p.title, p.summary, p.issuer, (p.keyPoints || []).join(" ")].join(" ")
      })),
      cats: svc.categories
    };
    return SEARCH_INDEX;
  }

  function wireSearch() {
    const input = qs("#global-search");
    const panel = qs("#search-results");
    if (!input || !panel) return;

    const run = debounce(async () => {
      const q = input.value.trim();
      if (q.length < 1) { panel.classList.remove("is-open"); return; }
      const idx = await buildSearchIndex();
      const kw = q.toLowerCase();
      const svcHits = idx.services.filter(s => s.text.toLowerCase().includes(kw)).slice(0, 5);
      const polHits = idx.policies.filter(p => p.text.toLowerCase().includes(kw)).slice(0, 4);

      let html = "";
      if (!svcHits.length && !polHits.length) {
        html = '<div class="search-empty">没有找到“' + esc(q) + '”，可换个关键词，或直接发起咨询。</div>';
      } else {
        if (svcHits.length) {
          html += '<div class="search-group-label">服务</div>' + svcHits.map(s => {
            const cat = idx.cats.find(c => c.id === s.cat);
            return '<a class="search-hit" href="' + serviceUrl(s.id) + '">' +
              '<span class="tag tag-brand">' + esc(cat ? cat.name : "服务") + "</span>" +
              "<span>" + esc(s.name) + "</span></a>";
          }).join("");
        }
        if (polHits.length) {
          html += '<div class="search-group-label">政策</div>' + polHits.map(p =>
            '<a class="search-hit" href="' + policyUrl(p.id) + '">' +
            '<span class="tag">政策</span><span>' + esc(p.name) + "</span></a>").join("");
        }
      }
      panel.innerHTML = html;
      panel.classList.add("is-open");
    }, 180);

    input.addEventListener("input", run);
    input.addEventListener("focus", () => { if (input.value.trim()) run(); });
    input.addEventListener("keydown", e => {
      if (e.key === "Escape") { panel.classList.remove("is-open"); input.blur(); }
      if (e.key === "Enter") {
        const first = qs(".search-hit", panel);
        if (first) location.href = first.href;
      }
    });
    document.addEventListener("click", e => {
      if (!e.target.closest(".header-search")) panel.classList.remove("is-open");
    });
  }

  /* ---------- 页脚 ---------- */
  function renderFooter() {
    const foot = qs("#site-footer");
    if (!foot) return;
    const c = SITE.contact;
    const f = SITE.footer;
    const year = new Date().getFullYear();

    foot.innerHTML =
      '<div class="container"><div class="footer-grid">' +
        '<div class="footer-brand"><a class="brand" href="index.html" aria-label="' + esc(SITE.brand.name) + ' 首页">' +
          '<img class="brand-logo brand-logo-light" src="' + (SITE.brand.logoWhite || "assets/img/logo-white.png") + '" alt="' + esc(SITE.brand.name) + '">' +
          "</a>" +
          "<p>" + esc(SITE.brand.description) + "</p>" +
          '<p style="margin-top:10px">' + esc(SITE.legal.company) + "</p></div>" +
        '<div class="footer-col"><h4>企业服务</h4><ul>' +
          f.services.map(l => '<li><a href="' + l.href + '">' + esc(l.label) + "</a></li>").join("") +
        "</ul></div>" +
        '<div class="footer-col"><h4>政策与工具</h4><ul>' +
          f.resources.map(l => '<li><a href="' + l.href + '">' + esc(l.label) + "</a></li>").join("") +
        "</ul></div>" +
        '<div class="footer-col"><h4>关于我们</h4><ul>' +
          f.company.map(l => '<li><a href="' + l.href + '">' + esc(l.label) + "</a></li>").join("") +
        "</ul></div>" +
        '<dl class="footer-contact"><div><dt>服务热线</dt><dd class="phone">' + esc(c.hotline) + "</dd></div>" +
          "<div><dt>联系邮箱</dt><dd>" + esc(c.email) + "</dd></div>" +
          "<div><dt>办公地址</dt><dd>" + esc(c.address) + "</dd></div></dl>" +
      "</div>" +
      '<div class="footer-bottom"><span>© ' + esc(SITE.legal.copyright) + " " + year + " · 保留所有权利</span>" +
        '<div class="footer-legal"><a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">' + esc(SITE.legal.icp) + "</a>" +
        "<span>" + esc(SITE.legal.police) + "</span>" +
        '<a href="terms.html">服务条款</a><a href="privacy.html">隐私政策</a></div></div>' +
      "</div>";
  }

  /* ---------- 悬浮条 ---------- */
  function renderFloat() {
    const bar = document.createElement("div");
    bar.className = "float-bar";
    bar.innerHTML =
      '<a class="float-btn is-accent" href="tel:' + esc(SITE.contact.hotline) + '" aria-label="电话咨询">' +
        icon("phone") + '<span class="float-bubble">' + esc(SITE.contact.hotline) + "</span></a>" +
      '<a class="float-btn" href="contact.html" aria-label="在线留言">' + icon("mail") +
        '<span class="float-bubble">' + esc(SITE.float.tip) + "</span></a>" +
      '<button class="float-btn" id="to-top" aria-label="返回顶部">' + icon("chevronDown") +
        '<span class="float-bubble">返回顶部</span></button>';
    document.body.appendChild(bar);
    const btn = qs("#to-top");
    if (btn) {
      btn.style.transform = "rotate(180deg)";
      btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
    const onScroll = () => { bar.style.opacity = window.scrollY > 300 ? "1" : "0"; bar.style.pointerEvents = window.scrollY > 300 ? "auto" : "none"; };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 启动 ---------- */
  let SEARCH_CATEGORIES = [];

  window.App.ready(async () => {
    try {
      SITE = await data.site();
      const svc = await data.services();
      SEARCH_CATEGORIES = svc.categories;
      renderTop();
      renderDrawer();
      renderFooter();
      renderFloat();
    } catch (err) {
      console.error("[nav]", err);
      const header = qs("#site-header");
      if (header && location.protocol !== "file:") {
        header.innerHTML = '<div class="container" style="padding:18px 0;color:#b0392f;font-size:13px">' +
          "导航加载失败：" + esc(err.message) + "。请确认 assets/data 目录存在并通过本地服务器访问。</div>";
      }
    }
  });
})();
