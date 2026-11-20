/* ============================================================
   policy.js —— 政策库：类型 / 层级 / 阶段 / 关键词筛选
   ============================================================ */
(function () {
  "use strict";
  const { qs, qsa, esc, icon, data, policyCard, bindReveal, param } = window.App;

  const STAGE_LABELS = { prep: "筹备期", start: "起步期", grow: "成长期", mature: "成熟期" };
  const state = { q: "", type: "", level: "", stage: "", all: [], types: [] };

  function renderHeroStats(pol) {
    const box = qs("#policy-stats");
    if (!box) return;
    const byType = {};
    pol.policies.forEach(p => { byType[p.type] = (byType[p.type] || 0) + 1; });
    box.innerHTML =
      '<a class="tag tag-brand" style="height:30px;padding:0 13px">共 ' + pol.policies.length + " 条政策</a>" +
      pol.types.map(t => '<span class="tag" style="height:30px;padding:0 13px">' + esc(t.name) + " " + (byType[t.id] || 0) + "</span>").join("");
  }

  function renderTypes(types) {
    const box = qs("#pol-types");
    box.innerHTML = '<button class="chip is-active" data-type="" type="button">全部类型</button>' +
      types.map(t => '<button class="chip" data-type="' + t.id + '" type="button">' + esc(t.name) + "</button>").join("");
    box.addEventListener("click", e => {
      const chip = e.target.closest("[data-type]");
      if (!chip) return;
      state.type = chip.dataset.type;
      qsa("[data-type]", box).forEach(b => b.classList.toggle("is-active", b === chip));
      apply();
    });
  }

  function apply() {
    let list = state.all.slice();
    if (state.type) list = list.filter(p => p.type === state.type);
    if (state.level) list = list.filter(p => p.level === state.level);
    if (state.stage) list = list.filter(p => (p.stages || []).indexOf(state.stage) >= 0);
    /* 资格预判产生的过滤（只看不冲突的政策） */
    const elig = window.AppEligibility;
    if (elig) list = elig.filterList(list);

    if (state.q) {
      const kw = state.q.toLowerCase();
      list = list.filter(p =>
        (p.title + p.summary + p.issuer + (p.keyPoints || []).join("") + (p.audience || []).join("")).toLowerCase().indexOf(kw) >= 0);
    }

    qs("#pol-count").textContent = list.length;
    const box = qs("#pol-list");
    const empty = qs("#pol-empty");

    if (!list.length) {
      box.innerHTML = "";
      empty.classList.remove("hide");
    } else {
      empty.classList.add("hide");
      box.innerHTML = list.map(p => policyCard(p, state.types)).join("");
      if (elig) elig.decorate(box);
      bindReveal(box);
    }

    const hint = qs("#pol-hint");
    hint.textContent = state.stage
      ? "当前筛选：" + STAGE_LABELS[state.stage] + " 可关注的政策"
      : "按类型与阶段筛选，可快速缩小范围";
  }

  window.App.ready(async () => {
    try {
      const pol = await data.policies();
      state.all = pol.policies;
      state.types = pol.types;
      renderHeroStats(pol);
      renderTypes(pol.types);

      const t = param("type");
      if (t) {
        state.type = t;
        qsa("[data-type]").forEach(b => b.classList.toggle("is-active", b.dataset.type === t));
      }
      const st = param("stage");
      if (st) { state.stage = st; qs("#pol-stage").value = st; }

      apply();

      /* 预判面板更新（选完题、切换“只看不冲突”）后刷新列表标记 */
      window.addEventListener("elig-change", () => { if (state.all.length) apply(); });

      qs("#pol-search").addEventListener("input", e => { state.q = e.target.value.trim(); apply(); });
      qs("#pol-level").addEventListener("change", e => { state.level = e.target.value; apply(); });
      qs("#pol-stage").addEventListener("change", e => { state.stage = e.target.value; apply(); });
      qs("#pol-reset").addEventListener("click", () => {
        state.q = ""; state.type = ""; state.level = ""; state.stage = "";
        qs("#pol-search").value = "";
        qs("#pol-level").value = "";
        qs("#pol-stage").value = "";
        qsa("[data-type]").forEach(b => b.classList.toggle("is-active", b.dataset.type === ""));
        apply();
      });
    } catch (err) { console.error("[policy]", err); }
  });
})();
