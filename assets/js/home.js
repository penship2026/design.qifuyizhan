/* ============================================================
   home.js —— 首页：需求自测 / 服务矩阵 / 阶段路径 / 政策快讯
   ============================================================ */
(function () {
  "use strict";
  const { qs, esc, icon, data, serviceUrl, policyUrl, bindReveal } = window.App;

  const NEEDS = [
    { id: "startup", label: "拿照开业", cats: ["gszc"], policy: [] },
    { id: "compliance", label: "合规记账", cats: ["caishui", "gszc"], policy: ["pol-small-vat", "pol-small-profit"] },
    { id: "taxsave", label: "降税负", cats: ["caishui", "zzxk"], policy: ["pol-rd-deduction", "pol-gaoxin"] },
    { id: "qualify", label: "拿资质与补贴", cats: ["zzxk", "txrz"], policy: ["pol-gaoxin", "pol-specialized", "pol-tech-sme"] },
    { id: "brand", label: "品牌与技术保护", cats: ["zscq"], policy: ["pol-ip-subsidy"] },
    { id: "digital", label: "线上获客与数字化", cats: ["szhcp", "slmx"], policy: [] }
  ];

  const STAGES = [
    { id: "prep", label: "筹备期" },
    { id: "start", label: "起步期" },
    { id: "grow", label: "成长期" },
    { id: "mature", label: "成熟期" }
  ];

  const TOOLS = [
    { id: "tool-capital", name: "注册资本与印花税测算", desc: "算清净缴资本成本与股东责任边界，避免注册资本拍脑袋。", icon: "calc" },
    { id: "tool-vat", name: "小规模 vs 一般纳税人对比", desc: "输入营业额与进项，直接看两种身份的税负差额。", icon: "chart" },
    { id: "tool-payroll", name: "社保公积金用工成本", desc: "按北京缴费基数，快速得出每招一人的真实用工成本。", icon: "user" }
  ];

  const state = { stage: "start", need: null };

  function renderTrust(site) {
    const box = qs("#hero-trust");
    if (!box) return;
    box.innerHTML = site.trust.map(t => "<span>" + icon("check") + esc(t) + "</span>").join("");
  }

  function renderMatcher(svc, pol) {
    const form = qs("#matcher-form");
    if (!form) return;

    form.innerHTML =
      '<div class="matcher-field"><label>你的企业阶段</label><div class="matcher-opts" data-group="stage">' +
        STAGES.map(s => '<button type="button" class="matcher-opt' + (s.id === state.stage ? " is-on" : "") +
          '" data-stage="' + s.id + '">' + s.label + "</button>").join("") +
      "</div></div>" +
      '<div class="matcher-field"><label>最想解决的问题</label><div class="matcher-opts" data-group="need">' +
        NEEDS.map(n => '<button type="button" class="matcher-opt" data-need="' + n.id + '">' + n.label + "</button>").join("") +
      "</div></div>" +
      '<button type="button" class="btn btn-accent btn-block mt-8" id="matcher-go">生成我的办理清单 ' + icon("arrowRight") + "</button>";

    form.addEventListener("click", e => {
      const stageBtn = e.target.closest("[data-stage]");
      const needBtn = e.target.closest("[data-need]");
      if (stageBtn) {
        state.stage = stageBtn.dataset.stage;
        form.querySelectorAll("[data-stage]").forEach(b => b.classList.toggle("is-on", b === stageBtn));
        if (state.need) runMatch(svc, pol);
        return;
      }
      if (needBtn) {
        state.need = needBtn.dataset.need;
        form.querySelectorAll("[data-need]").forEach(b => b.classList.toggle("is-on", b === needBtn));
        runMatch(svc, pol);
        return;
      }
      if (e.target.closest("#matcher-go")) {
        if (!state.need) { window.App.toast("先选一个最想解决的问题"); return; }
        location.href = "services.html?stage=" + state.stage + "&need=" + state.need;
      }
    });
  }

  function runMatch(svc, pol) {
    const box = qs("#matcher-result");
    const need = NEEDS.find(n => n.id === state.need);
    if (!box || !need) return;

    const services = svc.services
      .filter(s => need.cats.indexOf(s.cat) >= 0 && (s.stage || []).indexOf(state.stage) >= 0)
      .slice(0, 3);
    const fallback = svc.services.filter(s => need.cats.indexOf(s.cat) >= 0).slice(0, 3);
    const list = services.length ? services : fallback;

    const polIds = need.policy.concat(
      pol.policies.filter(p => (p.stages || []).indexOf(state.stage) >= 0 && p.type === "tax").map(p => p.id)
    );
    const uniqPol = Array.from(new Set(polIds)).slice(0, 2)
      .map(id => pol.policies.find(p => p.id === id)).filter(Boolean);

    box.innerHTML =
      '<strong>' + esc(STAGES.find(s => s.id === state.stage).label) +
      " · " + esc(need.label) + "</strong>，建议先办这几件事：" +
      '<div class="matcher-hits">' +
        list.map(s => '<a href="' + serviceUrl(s.id) + '">' + esc(s.name) + "</a>").join("") +
      "</div>" +
      (uniqPol.length
        ? '<div style="margin-top:10px">可关注政策：' + uniqPol.map(p =>
            '<a href="' + policyUrl(p.id) + '">' + esc(p.title.length > 16 ? p.title.slice(0, 16) + "…" : p.title) + "</a>"
          ).join("、") + "</div>"
        : "");
  }

  function renderCategories(svc) {
    const box = qs("#home-categories");
    if (!box) return;
    const byCat = {};
    svc.services.forEach(s => { (byCat[s.cat] = byCat[s.cat] || []).push(s); });

    box.innerHTML = svc.categories.map(c => {
      const list = byCat[c.id] || [];
      return '<a class="cat-tile reveal" href="services.html?cat=' + c.id + '">' +
        '<div class="ct-head"><span class="icon-box">' + icon(c.icon || "grid") + "</span>" +
        "<div><h3>" + esc(c.name) + "</h3><span class=\"faint tiny\">" + esc(c.audience) + "</span></div></div>" +
        '<p class="ct-desc">' + esc(c.desc) + "</p>" +
        '<div class="ct-items">' + list.slice(0, 3).map(s => "<span>" + esc(s.name) + "</span>").join("") +
          (list.length > 3 ? "<span>+" + (list.length - 3) + "</span>" : "") + "</div>" +
        '<span class="ct-count">' + list.length + " 项服务 · 查看 " + icon("arrowRight") + "</span></a>";
    }).join("");
    bindReveal(box);
  }

  function renderStages(proc) {
    const box = qs("#home-stages");
    if (!box) return;
    box.innerHTML = proc.stages.map((st, i) => {
      const tasks = st.tasks.slice(0, 4);
      return '<a class="stage-card reveal" href="process.html?stage=' + st.id + '">' +
        '<span class="stage-idx">STAGE 0' + (i + 1) + "</span>" +
        "<h3>" + esc(st.name) + "</h3>" +
        '<span class="stage-range">' + esc(st.range) + "</span>" +
        "<ul>" + tasks.map(t => "<li>" + esc(t.title) + "</li>").join("") + "</ul>" +
        '<span class="stage-go">查看任务清单 ' + icon("arrowRight") + "</span></a>";
    }).join("");
    bindReveal(box);
  }

  function renderPolicies(pol) {
    const box = qs("#home-policies");
    if (!box) return;
    const picks = pol.policies.slice(0, 4);
    box.innerHTML = picks.map(p => {
      const t = pol.types.find(x => x.id === p.type) || { name: "政策" };
      return '<article class="pb-item reveal"><div class="pb-meta"><span class="tag tag-brand">' + esc(t.name) + "</span>" +
        "<span>" + esc(p.level) + "</span><span>至 " + esc(p.validUntil) + "</span></div>" +
        '<h4><a href="' + policyUrl(p.id) + '">' + esc(p.title) + "</a></h4>" +
        "<p>" + esc(p.summary) + "</p></article>";
    }).join("");
    bindReveal(box);
  }

  function renderStats(site) {
    const box = qs("#home-stats");
    if (!box) return;
    box.innerHTML = site.stats.map(s =>
      '<div class="stat-item"><div class="stat-num mono">' + esc(s.num) +
      "<em>" + esc(s.unit) + "</em></div><div class=\"stat-label\">" + esc(s.label) + "</div></div>").join("");
  }

  function renderTools() {
    const box = qs("#home-tools");
    if (!box) return;
    box.innerHTML = TOOLS.map(t =>
      '<a class="tool-card reveal" href="tools.html#' + t.id + '">' +
        '<span class="icon-box">' + icon(t.icon) + "</span>" +
        "<h3>" + esc(t.name) + "</h3><p>" + esc(t.desc) + "</p>" +
        '<span class="btn-text tool-open">去测算 ' + icon("arrowRight") + "</span></a>").join("");
    bindReveal(box);
  }

  window.App.ready(async () => {
    try {
      const [site, svc, proc, pol] = await Promise.all([
        data.site(), data.services(), data.processes(), data.policies()
      ]);
      renderTrust(site);
      renderMatcher(svc, pol);
      renderCategories(svc);
      renderStages(proc);
      renderPolicies(pol);
      renderStats(site);
      renderTools();
    } catch (err) {
      console.error("[home]", err);
    }
  });
})();
