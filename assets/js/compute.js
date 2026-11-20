/* ============================================================
   compute.js —— 算力 / 镜像 / 模型 三个外部平台的内嵌切换
   数据来自 assets/data/compute.json（原站三个子栏目的同一地址）
   ============================================================ */
(function () {
  "use strict";

  const { data, icon, qs, qsa, esc, param, toast, ready } = window.App;
  let DEFAULT_CROP = 60;
  let MODULES = [];
  let current = null;

  function tabHtml(m, active) {
    return '<button class="compute-tab' + (active ? " is-active" : "") + '" role="tab" type="button"' +
      ' aria-selected="' + (active ? "true" : "false") + '" data-id="' + esc(m.id) + '">' +
      '<span class="ct-icon">' + icon(m.icon || "chip") + "</span>" +
      '<span class="ct-text"><span class="ct-name">' + esc(m.name) + "</span>" +
      '<span class="ct-sub">' + esc(m.en) + "</span></span></button>";
  }

  /* 说明信息压成两行（标题/描述一行，卖点一行），右侧只留一个刷新图标；
     不再显示三方平台域名，页面只呈现"这是站内的一块资源" */
  function infoHtml(m) {
    const reload = '<button class="compute-icon-btn" type="button" data-reload' +
      ' aria-label="重新加载" title="重新加载">' + icon("refresh") + "</button>";
    return '<div class="compute-strip-main">' +
        '<div class="compute-strip-head"><span class="icon-box">' + icon(m.icon || "chip") + "</span>" +
          "<div><h2>" + esc(m.name) + '</h2><span class="compute-strip-en">' + esc(m.en) + "</span></div>" +
        "</div>" +
        '<p class="compute-strip-tag">' + esc(m.tagline) + "</p>" + reload +
      "</div>" +
      '<ul class="compute-strip-points">' + (m.bullets || []).map(b =>
        "<li>" + icon("check") + "<span>" + esc(b) + "</span></li>").join("") + "</ul>";
  }

  /* 裁切内嵌页自带顶部导航：跨域读不到对方 DOM，只能用“外层裁窗 + iframe 上移”的办法，
     裁切高度来自 compute.json 的 embed.cropTop（实测三家平台均为 60px） */
  function applyCrop(m) {
    const box = qs("#compute-frame-box");
    if (!box) return;
    const crop = Number((m && m.cropTop) || DEFAULT_CROP) || DEFAULT_CROP;
    box.style.setProperty("--crop", crop + "px");
    box.classList.add("is-cropped");
  }

  let hideTimer = null;
  function showLoading(name) {
    const box = qs("#compute-loading");
    if (!box) return;
    qs("#compute-loading-text").textContent = "正在加载 " + name + "…";
    box.classList.remove("is-hidden");
    clearTimeout(hideTimer);
    // 平台页面可能长时间保持连接，25 秒后收起提示，避免挡住内容
    hideTimer = setTimeout(() => box.classList.add("is-hidden"), 25000);
  }
  function hideLoading() {
    const box = qs("#compute-loading");
    if (box) box.classList.add("is-hidden");
    clearTimeout(hideTimer);
  }

  function setFrame(m) {
    const frame = qs("#compute-frame");
    if (!frame) return;
    frame.title = m.name + "页面";
    /* 只有一个 iframe 元素在复用，所以“切回上一个标签”也必须重新指地址；
       之前按 loaded[id] 判断是否已加载，切回旧标签时 src 不会变，就停在上一个平台 */
    if (frame.src === m.url) { hideLoading(); return; }
    showLoading(m.name);
    frame.src = m.url;
  }

  function select(id, push) {
    const m = MODULES.find(x => x.id === id) || MODULES[0];
    if (!m) return;
    current = m.id;
    qsa(".compute-tab").forEach(b => {
      const on = b.getAttribute("data-id") === m.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    qs("#compute-info").innerHTML = infoHtml(m);
    applyCrop(m);
    setFrame(m);
    if (push && history.replaceState) {
      try { history.replaceState(null, "", "compute.html?tab=" + encodeURIComponent(m.id) + "#compute-help"); } catch (e) {}
    } else if (push) {
      try { history.replaceState(null, "", location.pathname + "?tab=" + encodeURIComponent(m.id) + location.hash); } catch (e) {}
    }
  }

  function bind() {
    const frame = qs("#compute-frame");
    if (frame) frame.addEventListener("load", hideLoading);

    qsa(".compute-tab").forEach(btn => {
      btn.addEventListener("click", () => select(btn.getAttribute("data-id"), true));
    });

    const info = qs("#compute-info");
    if (info) info.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-reload]");
      if (!btn) return;
      const frame = qs("#compute-frame");
      const m = MODULES.find(x => x.id === current);
      if (!frame || !m) return;
      const ic = btn.querySelector(".ic");
      if (ic) { ic.style.transition = "transform .3s"; ic.style.transform = "rotate(360deg)"; }
      frame.src = "about:blank";
      showLoading(m.name);
      setTimeout(() => { frame.src = m.url; toast("已重新加载 " + m.name); }, 80);
    });
  }

  async function boot() {
    try {
      const d = await data.compute();
      MODULES = d.modules || [];
      if (d.embed && Number(d.embed.cropTop)) DEFAULT_CROP = Number(d.embed.cropTop);
      if (!MODULES.length) return;

      qs("#compute-tabs").innerHTML = MODULES.map((m, i) => tabHtml(m, i === 0)).join("");
      bind();

      if (d.help) {
        if (d.help.title) qs("#compute-help-title").textContent = d.help.title;
        if (d.help.desc) qs("#compute-help-desc").textContent = d.help.desc;
        const svc = qs("#compute-help-service");
        if (svc && d.help.serviceId) {
          svc.href = "service.html?id=" + encodeURIComponent(d.help.serviceId);
          if (d.help.serviceName) svc.textContent = d.help.serviceName;
        }
      }

      const want = (param("tab") || "").toLowerCase();
      select(MODULES.some(m => m.id === want) ? want : MODULES[0].id, false);

    } catch (err) {
      const box = qs("#compute-info");
      if (box) box.innerHTML = '<p class="compute-desc">资源市场数据加载失败：' + esc(err.message) +
        '。请用 HTTP 方式访问本站（直接双击打开 HTML 读不到 JSON）。</p>';
    }
  }

  ready(boot);
})();
