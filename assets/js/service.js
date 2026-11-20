/* ============================================================
   service.js —— 服务详情：?id=xxx
   ============================================================ */
(function () {
  "use strict";
  const { qs, esc, icon, data, param, serviceUrl, policyUrl, bindReveal, toast } = window.App;

  const STAGE_LABELS = { prep: "筹备期", start: "起步期", grow: "成长期", mature: "成熟期" };

  function specRow(label, value) {
    return '<div class="spec-row"><dt>' + esc(label) + "</dt><dd>" + value + "</dd></div>";
  }

  function render(svc, pol, site, id) {
    const s = svc.services.find(x => x.id === id);
    if (!s) throw new Error("not-found");
    const cat = svc.categories.find(c => c.id === s.cat) || { name: "服务", icon: "grid" };

    document.title = s.name + " | 流程、材料、周期与价格 - 企服驿站";
    const meta = qs('meta[name="description"]');
    if (meta) meta.setAttribute("content", s.desc);

    qs("#detail-crumb").innerHTML =
      '<a href="index.html">首页</a><span class="sep">/</span>' +
      '<a href="services.html">企业服务</a><span class="sep">/</span>' +
      '<a href="services.html?cat=' + cat.id + '">' + esc(cat.name) + '</a><span class="sep">/</span>' +
      '<span class="current">' + esc(s.name) + "</span>";

    qs("#detail-title").textContent = s.name;
    qs("#detail-tagline").textContent = s.tagline;

    qs("#detail-badges").innerHTML =
      '<span class="tag">' + esc(cat.name) + "</span>" +
      '<span class="tag">周期 ' + esc(s.duration) + "</span>" +
      (s.stage || []).map(k => '<span class="tag">' + STAGE_LABELS[k] + "适用</span>").join("") +
      (s.hot ? '<span class="tag">高频办理</span>' : "");

    qs("#detail-price").innerHTML =
      "<b>" + esc(s.price) + "</b><span>" + esc(s.priceNote || "") + "</span>";

    /* ---------- 左侧正文 ---------- */
    const faqHtml = (s.faq || []).length
      ? '<div class="accordion">' + s.faq.map((f, i) =>
          '<div class="acc-item' + (i === 0 ? " is-open" : "") + '">' +
            '<button class="acc-btn" type="button">' + esc(f.q) + '<span class="acc-icon"></span></button>' +
            '<div class="acc-panel"><div><p>' + esc(f.a) + "</p></div></div></div>").join("") + "</div>"
      : '<p class="muted small">暂无常见问题，可直接咨询顾问。</p>';

    const processHtml = (s.process || []).map((p, i) =>
      '<div class="step"><span class="step-num">' + (i + 1) + "</span>" +
      '<div class="step-body"><h4>' + esc(p.title) + "</h4><p>" + esc(p.desc) + "</p>" +
      (p.time ? '<span class="step-time">' + icon("clock") + esc(p.time) + "</span>" : "") +
      "</div></div>").join("");

    const anchors = '<div class="anchor-nav">' +
      '<a href="#sec-about">服务说明</a><a href="#sec-process">办理流程</a>' +
      '<a href="#sec-materials">所需材料</a><a href="#sec-faq">常见问题</a></div>';

    qs("#detail-main").innerHTML = anchors +
      '<div class="panel" id="sec-about"><div class="panel-title">服务说明</div>' +
        '<p class="lead" style="font-size:15px">' + esc(s.desc) + "</p>" +
        '<dl class="spec-list mt-24">' +
          specRow("服务分类", esc(cat.name)) +
          specRow("适用对象", (s.audience || []).map(a => '<span class="tag">' + esc(a) + "</span>").join(" ")) +
          specRow("参考周期", esc(s.duration)) +
          specRow("参考价格", '<span class="brand-text" style="font-weight:600">' + esc(s.price) + "</span> " + esc(s.priceNote || "")) +
        "</dl>" +
        (s.highlights && s.highlights.length
          ? '<div class="overview-box mt-24"><h4>我们做什么</h4><div class="ov-list">' +
            s.highlights.map(h => "<a>" + esc(h) + "</a>").join("") + "</div></div>"
          : "") +
      "</div>" +
      '<div class="panel" id="sec-process"><div class="panel-title">办理流程</div>' +
        '<div class="steps">' + processHtml + "</div>" +
      "</div>" +
      '<div class="panel" id="sec-materials"><div class="panel-title">所需材料</div>' +
        '<p class="muted small mb-16">先看一眼清单，缺什么我们会在对接时提前列出替代方案。</p>' +
        '<ul class="checklist">' + (s.materials || []).map(m => "<li>" + esc(m) + "</li>").join("") + "</ul>" +
      "</div>" +
      '<div class="panel" id="sec-faq"><div class="panel-title">常见问题</div>' + faqHtml + "</div>";

    /* ---------- 右侧栏 ---------- */
    const polList = (s.policies || []).map(pid => pol.policies.find(p => p.id === pid)).filter(Boolean);
    const rel = (s.related || []).map(rid => svc.services.find(x => x.id === rid)).filter(Boolean);

    qs("#detail-side").innerHTML =
      '<div class="quote-card">' +
        '<h4>想先确认能不能办？</h4>' +
        '<div class="qc-price">' + esc(s.price) + '<small>' + esc(s.priceNote || "") + "</small></div>" +
        '<ul class="qc-list">' +
          "<li>" + icon("check") + "先做可行性判断，办不了直接说明原因</li>" +
          "<li>" + icon("check") + "材料清单一次性给全，避免反复补件</li>" +
          "<li>" + icon("check") + "进度节点可查，关键节点主动同步</li>" +
        "</ul>" +
        '<a class="btn btn-primary btn-block" href="contact.html?service=' + encodeURIComponent(s.name) + '">预约顾问咨询</a>' +
        '<a class="btn btn-ghost btn-block mt-8" href="tel:' + esc(site.contact.hotline) + '">电话 ' + esc(site.contact.hotline) + "</a>" +
      "</div>" +
      (polList.length
        ? '<div class="quote-card"><h4>可配套关注的政策</h4><div class="stack">' +
          polList.map(p => '<a class="policy-mini" href="' + policyUrl(p.id) + '">' +
            "<strong>" + esc(p.title) + "</strong><span>" + esc(p.issuer) + " · 至 " + esc(p.validUntil) + "</span></a>").join("") +
          "</div></div>"
        : "") +
      (rel.length
        ? '<div class="quote-card"><h4>常一起办理</h4><div class="stack">' +
          rel.map(r => '<a class="policy-mini" href="' + serviceUrl(r.id) + '">' +
            "<strong>" + esc(r.name) + "</strong><span>" + esc(r.tagline) + "</span></a>").join("") +
          "</div></div>"
        : "") +
      '<div class="notice">' + icon("info") + "<span>本页价格为参考区间，最终以企业实际情况评估后报价。</span></div>";

    qs("#detail-loading").classList.add("hide");
    qs("#detail-layout").classList.remove("hide");

    /* ---------- 交互 ---------- */
    qsaAcc();
    bindReveal(document);
  }

  function qsaAcc() {
    document.querySelectorAll(".acc-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".acc-item");
        item.classList.toggle("is-open");
      });
    });
  }

  window.App.ready(async () => {
    const id = param("id");
    try {
      const [svc, pol, site] = await Promise.all([data.services(), data.policies(), data.site()]);
      if (!id) throw new Error("not-found");
      render(svc, pol, site, id);
    } catch (err) {
      qs("#detail-loading").classList.add("hide");
      qs("#detail-error").classList.remove("hide");
      qs("#detail-title").textContent = "服务未找到";
      document.title = "服务未找到 | 企服驿站";
    }
  });
})();
