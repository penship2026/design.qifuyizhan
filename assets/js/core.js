/* ============================================================
   core.js —— 公共工具：数据加载 / DOM / 图标 / 格式化
   所有模块共享 window.App
   ============================================================ */
(function () {
  "use strict";

  const DATA_BASE = "assets/data/";
  const cache = new Map();

  /* ---------- 数据加载 ---------- */
  async function fetchJSON(name) {
    if (cache.has(name)) return cache.get(name);
    const url = DATA_BASE + name;
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error("加载 " + url + " 失败（HTTP " + res.status + "）");
    const data = await res.json();
    cache.set(name, data);
    return data;
  }

  const data = {
    site: () => fetchJSON("site.json"),
    services: () => fetchJSON("services.json"),
    processes: () => fetchJSON("processes.json"),
    policies: () => fetchJSON("policies.json"),
    compute: () => fetchJSON("compute.json"),
    eligibility: () => fetchJSON("eligibility.json")
  };

  /* ---------- 图标库（线性 SVG） ---------- */
  const ICONS = {
    building: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/>',
    calc: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01M8 18h6"/>',
    badge: '<circle cx="12" cy="9" r="5"/><path d="M8.5 13.5 7 21l5-3 5 3-1.5-7.5"/>',
    certificate: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 8h10M7 12h6"/><path d="M12 17v4M9 21h6"/>',
    shield: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    teach: '<path d="M3 5h12v11H3z"/><path d="M15 9h6v11H9v-4"/><path d="M6 8h6M6 12h4"/>',
    code: '<path d="m8 6-5 6 5 6M16 6l5 6-5 6"/><path d="M13 4 11 20"/>',
    chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1-8.6 2 2 0 0 1 2-2.2h3a2 2 0 0 1 2 1.7c.1.9.3 3.7.7 5.5a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.5c1.8.4 3.6.6 5.5.7A2 2 0 0 1 22 16.9z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowRight: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    spark: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.6 11h10.8L21 7H6"/>',
    book: '<path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3z"/><path d="M17 4h2v16h-2"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    tool: '<path d="M14 4a5 5 0 0 0 5.7 6.4L21 12l-9 9-2 2-3-3 2-2 9-9 1.6-1.3A5 5 0 0 0 14 4z"/>',
    wechat: '<path d="M9 4c-4 0-7 2.6-7 5.8 0 1.8 1 3.4 2.7 4.5l-.7 2.3 2.4-1.2c.8.2 1.7.3 2.6.3"/><path d="M22 12.2c0-2.8-2.6-5-5.8-5s-5.8 2.2-5.8 5 2.6 5 5.8 5c.8 0 1.5-.1 2.2-.3l2 1-.6-1.9c1.4-.9 2.2-2.3 2.2-3.8z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    file: '<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z"/><path d="M13 3v7h7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M12 12v4"/>',
    alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>',
    quote: '<path d="M9 7H5v6h4V7zm10 0h-4v6h4V7z"/>'
  };

  function icon(name, cls) {
    const path = ICONS[name] || ICONS.info;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="ic' +
      (cls ? " " + cls : "") + '">' + path + "</svg>";
  }

  /* ---------- DOM / 字符串 ---------- */
  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /** 支持 {placeholder} 的极简模板 */
  function tpl(str, vars) {
    return str.replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : m));
  }

  function param(key) {
    return new URLSearchParams(location.search).get(key);
  }

  function debounce(fn, wait) {
    let t;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), wait || 200);
    };
  }

  function toast(msg) {
    let box = qs(".toast");
    if (!box) {
      box = document.createElement("div");
      box.className = "toast";
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.classList.add("is-open");
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.classList.remove("is-open"), 2400);
  }

  /* ---------- 存储 ---------- */
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem("qfy:" + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem("qfy:" + key, JSON.stringify(val)); } catch (e) { /* 忽略 */ }
    }
  };

  /* ---------- 路由 URL ---------- */
  const serviceUrl = id => "service.html?id=" + encodeURIComponent(id);
  const policyUrl = id => "policy-detail.html?id=" + encodeURIComponent(id);

  /* ---------- 通用渲染片段 ---------- */
  function serviceCard(s, cats) {
    const cat = cats.find(c => c.id === s.cat) || { name: "服务" };
    return '<a class="service-card reveal" href="' + serviceUrl(s.id) + '">' +
      (s.hot ? '<span class="sc-flag">热门</span>' : "") +
      '<div class="sc-top"><span class="icon-box icon-box-sm">' + icon(cat.icon || "grid") + "</span>" +
      '<h3>' + esc(s.name) + "</h3></div>" +
      '<p class="sc-desc">' + esc(s.desc) + "</p>" +
      '<div class="sc-meta"><span class="tag">' + esc(cat.name) + "</span>" +
      '<span class="tag">' + esc(s.duration) + "</span></div>" +
      '<div class="sc-foot"><span class="sc-price">' + esc(s.price) + '<small>' + esc(s.priceNote || "") + "</small></span>" +
      '<span class="sc-link">查看详情 ' + icon("arrowRight") + "</span></div></a>";
  }

  function policyCard(p, types) {
    const t = (types || []).find(x => x.id === p.type) || { name: "政策" };
    return '<article class="policy-row reveal" data-pol="' + esc(p.id) + '">' +
      "<div><div class=\"policy-meta\"><span class=\"tag tag-brand\">" + esc(t.name) + "</span>" +
      "<span>" + esc(p.issuer) + "</span><span>" + esc(p.level) + "</span>" +
      "<span>" + esc(p.region) + "</span>" +
      (p.validUntil ? "<span>有效期至 " + esc(p.validUntil) + "</span>" : "") +
      (p.source && p.source.url
        ? '<a class="src-link" href="' + esc(p.source.url) + '" target="_blank" rel="noopener noreferrer" title="打开官方原文">原文 ↗</a>'
        : "") + "</div>" +
      '<h3><a href="' + policyUrl(p.id) + '">' + esc(p.title) + "</a></h3>" +
      '<p class="policy-summary">' + esc(p.summary) + "</p></div>" +
      '<div class="policy-side"><a class="btn btn-ghost btn-sm" href="' + policyUrl(p.id) + '">查看要点</a></div>' +
      "</article>";
  }

  /* ---------- 入场动画 ---------- */
  function bindReveal(root) {
    const nodes = qsa(".reveal", root);
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(n => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });
    nodes.forEach(n => io.observe(n));
    // 兜底：观察器失效或快速滚动时，2.5 秒后全部显示，避免内容不可见
    setTimeout(() => nodes.forEach(n => n.classList.add("is-in")), 2500);
  }

  /* ---------- 文件协议提示 ---------- */
  function guardProtocol() {
    if (location.protocol === "file:") {
      const bar = document.createElement("div");
      bar.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:9999;background:#b0392f;color:#fff;" +
        "padding:12px 20px;font-size:13px;line-height:1.6;font-family:-apple-system,sans-serif;";
      bar.innerHTML = "检测到以本地文件方式打开（file://），浏览器会阻止读取 JSON 数据。<br>" +
        "请在项目根目录运行 <b>python3 -m http.server 8080</b>，然后访问 " +
        "<b>http://localhost:8080</b>；或直接双击项目根目录的「启动网站.command」。";
      document.body && document.body.prepend(bar);
    }
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else { fn(); }
  }

  /* ---------- 内联图标占位符 @@icon:name@@ ---------- */
  function hydrateIcons(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const texts = [];
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.nodeValue && n.nodeValue.indexOf("@@icon:") !== -1) texts.push(n);
    }
    texts.forEach(node => {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(@@icon:[\w-]+@@)/).forEach(part => {
        const m = part.match(/^@@icon:([\w-]+)@@$/);
        if (m) {
          const wrap = document.createElement("span");
          wrap.className = "icon-inline";
          wrap.innerHTML = icon(m[1]);
          while (wrap.firstChild) frag.appendChild(wrap.firstChild);
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  window.App = {
    data, icon, qs, qsa, esc, tpl, param, debounce, toast, store,
    serviceUrl, policyUrl, serviceCard, policyCard, bindReveal, hydrateIcons, ready
  };

  ready(() => {
    guardProtocol();
    hydrateIcons(document);
    bindReveal(document);
  });
})();
