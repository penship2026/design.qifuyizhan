/* ============================================================
   policy-detail.js —— 政策详情：?id=xxx
   ============================================================ */
(function () {
  "use strict";
  const { qs, esc, icon, data, param, serviceUrl, bindReveal } = window.App;

  const STAGE_LABELS = { prep: "筹备期", start: "起步期", grow: "成长期", mature: "成熟期" };

  window.App.ready(async () => {
    const id = param("id");
    try {
      const [pol, svc, site] = await Promise.all([data.policies(), data.services(), data.site()]);
      /* 资格预判引擎就绪后再拼正文（未加载/失败则自动跳过这一块的渲染） */
      const elig = window.AppEligibility;
      if (elig) { try { await elig.ensure(); } catch (e) { /* 忽略，不影响正文 */ } }
      const p = pol.policies.find(x => x.id === id);
      if (!p) throw new Error("not-found");
      const type = pol.types.find(t => t.id === p.type) || { name: "政策" };

      document.title = p.title + " | 政策要点解读 - 企服驿站";
      const meta = qs('meta[name="description"]');
      if (meta) meta.setAttribute("content", p.summary);
      qs("#crumb-title").textContent = p.title.length > 20 ? p.title.slice(0, 20) + "…" : p.title;

      /* 头部 */
      qs("#ph-meta").innerHTML =
        "<span>" + esc(p.issuer) + "</span>" +
        (p.docNo ? "<span>文号：" + esc(p.docNo) + "</span>" : "") +
        (p.publishDate ? "<span>发布：" + esc(p.publishDate) + "</span>" : "") +
        "<span>有效期：" + esc(p.validUntil) + "</span>";

      qs("#ph-title").textContent = p.title;

      qs("#ph-tags").innerHTML =
        '<span class="tag tag-brand">' + esc(type.name) + "</span>" +
        '<span class="tag">' + esc(p.level) + "</span>" +
        '<span class="tag">' + esc(p.region) + "</span>" +
        (p.stages || []).map(s => '<span class="tag">' + STAGE_LABELS[s] + "适用</span>").join("");

      /* 正文 */
      const keyPoints = (p.keyPoints || []).map((k, i) =>
        '<div class="key-point"><span class="kp-no">' + (i + 1) + "</span><p>" + esc(k) + "</p></div>").join("");

      const ul = (arr, iconName) => (arr && arr.length
        ? '<ul class="checklist">' + arr.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>"
        : '<p class="muted small">以主管部门要求为准。</p>');

      /* 政策原文与来源：有 source 才渲染，链接一律新窗口打开 */
      const sourcePanel = p => {
        const src = p.source;
        if (!src || !src.url) return "";
        const row = (k, v) => '<div class="spec-row"><dt>' + k + "</dt><dd>" + esc(v) + "</dd></div>";
        return '<div class="panel" id="pol-source"><div class="panel-title">政策原文与来源</div>' +
          '<dl class="spec-list">' +
            row("发文机关", p.issuer) +
            row("文号", p.docNo || "—") +
            row("发布日期", p.publishDate || "—") +
            row("效力状态", p.validUntil) +
            row("核对日期", src.checkedAt || "—") +
          "</dl>" +
          (src.note ? '<p class="small muted mt-12">' + esc(src.note) + "</p>" : "") +
          '<div class="src-actions">' +
            '<a class="btn btn-ghost btn-sm" href="' + esc(src.url) + '" target="_blank" rel="noopener noreferrer">' +
              "查看官方原文 " + icon("arrowRight") + "</a>" +
            '<span class="small muted">来源：' + esc(src.site) + "（外链，以官网最新发布为准）</span>" +
          "</div></div>";
      };

      qs("#policy-main").innerHTML =
        '<div class="panel"><div class="panel-title">政策摘要</div>' +
          '<p class="lead" style="font-size:15px">' + esc(p.summary) + "</p></div>" +
        '<div class="panel"><div class="panel-title">核心要点</div>' +
          '<div class="stack">' + keyPoints + "</div></div>" +
        (elig ? elig.detailHTML(p) : "") +
        '<div class="panel"><div class="panel-title">享受/申报条件</div>' + ul(p.conditions) + "</div>" +
        '<div class="panel"><div class="panel-title">所需材料</div>' + ul(p.materials) + "</div>" +
        '<div class="panel"><div class="panel-title">申报渠道</div>' +
          '<p style="font-size:15px">' + esc(p.channel) + "</p>" +
          '<div class="notice mt-16">' + icon("info") +
            "<span>申报窗口与材料清单以主管部门当年通知为准，建议申报前先做一次条件核对。</span></div>" +
        "</div>" + sourcePanel(p);

      /* 侧栏 */
      const relServices = (p.related || []).map(rid => svc.services.find(s => s.id === rid)).filter(Boolean);
      qs("#policy-side").innerHTML =
        '<div class="quote-card">' +
          "<h4>这条政策我能享受吗？</h4>" +
          '<ul class="qc-list">' +
            "<li>" + icon("check") + "按企业规模与行业做适用性判断</li>" +
            "<li>" + icon("check") + "列出缺口项与补齐所需时间</li>" +
            "<li>" + icon("check") + "给出申报节奏，避免错过窗口</li>" +
          "</ul>" +
          '<a class="btn btn-primary btn-block" href="contact.html?policy=' + encodeURIComponent(p.title) + '">免费做适用性判断</a>' +
          '<a class="btn btn-ghost btn-block mt-8" href="tel:' + esc(site.contact.hotline) + '">电话 ' + esc(site.contact.hotline) + "</a>" +
        "</div>" +
        '<div class="quote-card"><h4>政策速览</h4><dl class="spec-list">' +
          '<div class="spec-row"><dt>适用对象</dt><dd>' + (p.audience || []).map(a => esc(a)).join("、") + "</dd></div>" +
          '<div class="spec-row"><dt>发文机关</dt><dd>' + esc(p.issuer) + "</dd></div>" +
          '<div class="spec-row"><dt>政策层级</dt><dd>' + esc(p.level) + " · " + esc(p.region) + "</dd></div>" +
          '<div class="spec-row"><dt>有效期</dt><dd>' + esc(p.validUntil) + "</dd></div>" +
          (p.source && p.source.url
            ? '<div class="spec-row"><dt>原文出处</dt><dd><a class="src-link" href="' + esc(p.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(p.source.site) + " ↗</a></dd></div>"
            : "") +
        "</dl></div>" +
        (relServices.length
          ? '<div class="quote-card"><h4>落地这项政策常配套的服务</h4><div class="stack">' +
            relServices.map(s => '<a class="policy-mini" href="' + serviceUrl(s.id) + '">' +
              "<strong>" + esc(s.name) + "</strong><span>" + esc(s.tagline) + "</span></a>").join("") +
            "</div></div>"
          : "") +
        '<div class="notice">' + icon("info") + "<span>" + esc(pol._disclaimer) + "</span></div>";

      if (elig) elig.renderAI(p, elig.assess(p), qs(".elig-detail .elig-ai"));

      qs("#policy-loading").classList.add("hide");
      qs("#policy-head-content").classList.remove("hide");
      qs("#policy-layout").classList.remove("hide");
      bindReveal(document);
    } catch (err) {
      if (elig) elig.renderAI(p, elig.assess(p), qs(".elig-detail .elig-ai"));

      qs("#policy-loading").classList.add("hide");
      qs("#policy-error").classList.remove("hide");
    }
  });
})();
