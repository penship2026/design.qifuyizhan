/* ============================================================
   services.js —— 服务列表：筛选 / 搜索 / 排序
   ============================================================ */
(function () {
  "use strict";
  const { qs, qsa, esc, icon, data, serviceCard, bindReveal, param } = window.App;

  const STAGE_LABELS = { prep: "筹备期", start: "起步期", grow: "成长期", mature: "成熟期" };
  const state = { q: "", cat: "", stage: "", sort: "default", all: [], cats: [] };

  function renderChips(cats) {
    const box = qs("#hero-chips");
    if (!box) return;
    box.innerHTML = cats.map(c =>
      '<a class="tag tag-brand" style="height:30px;padding:0 13px;font-size:13px" href="services.html?cat=' +
      c.id + '">' + esc(c.name) + "</a>").join("");
  }

  function fillSelects(cats) {
    const catSel = qs("#svc-cat");
    const stageSel = qs("#svc-stage");
    catSel.innerHTML = '<option value="">全部分类</option>' + cats.map(c =>
      '<option value="' + c.id + '">' + esc(c.name) + "</option>").join("");
    stageSel.innerHTML = '<option value="">全部阶段</option>' + Object.keys(STAGE_LABELS).map(k =>
      '<option value="' + k + '">' + STAGE_LABELS[k] + "</option>").join("");
  }

  function apply() {
    let list = state.all.slice();

    if (state.cat) list = list.filter(s => s.cat === state.cat);
    if (state.stage) list = list.filter(s => (s.stage || []).indexOf(state.stage) >= 0);
    if (state.q) {
      const kw = state.q.toLowerCase();
      list = list.filter(s => (s.name + s.tagline + s.desc + (s.audience || []).join("")).toLowerCase().indexOf(kw) >= 0);
    }

    if (state.sort === "price") {
      list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (state.sort === "duration") {
      list.sort((a, b) => parseFloat(a.duration) - parseFloat(b.duration));
    }

    const grid = qs("#svc-grid");
    const empty = qs("#svc-empty");
    qs("#svc-count").textContent = list.length;

    if (!list.length) {
      grid.innerHTML = "";
      empty.classList.remove("hide");
    } else {
      empty.classList.add("hide");
      grid.innerHTML = list.map(s => serviceCard(s, state.cats)).join("");
      bindReveal(grid);
    }

    // 提示语随筛选变化
    const hint = qs("#svc-hint");
    if (state.stage) hint.textContent = "当前筛选：" + STAGE_LABELS[state.stage] + " 需要办的事";
    else if (state.cat) {
      const c = state.cats.find(x => x.id === state.cat);
      hint.textContent = c ? c.desc : "";
    } else hint.textContent = "按阶段筛选可快速定位当前该办的事";
  }

  window.App.ready(async () => {
    try {
      const svc = await data.services();
      state.all = svc.services;
      state.cats = svc.categories;

      // 参数校验：只接受存在的分类 / 阶段，避免脏参数导致空结果
      const catParam = param("cat") || "";
      const stageParam = param("stage") || "";
      state.cat = svc.categories.some(c => c.id === catParam) ? catParam : "";
      state.stage = ["prep", "start", "grow", "mature"].indexOf(stageParam) >= 0 ? stageParam : "";

      renderChips(svc.categories);
      fillSelects(svc.categories);
      qs("#svc-cat").value = state.cat;
      qs("#svc-stage").value = state.stage;

      // need 参数：把需求映射到分类（来自首页自测）
      const need = param("need");
      if (need && !state.cat) {
        const map = { startup: "gszc", compliance: "caishui", taxsave: "caishui", qualify: "zzxk", brand: "zscq", digital: "szhcp" };
        if (map[need]) { state.cat = map[need]; qs("#svc-cat").value = state.cat; }
      }

      apply();

      qs("#svc-search").addEventListener("input", e => { state.q = e.target.value.trim(); apply(); });
      qs("#svc-cat").addEventListener("change", e => { state.cat = e.target.value; apply(); });
      qs("#svc-stage").addEventListener("change", e => { state.stage = e.target.value; apply(); });
      qs("#svc-sort").addEventListener("change", e => { state.sort = e.target.value; apply(); });
      qs("#svc-reset").addEventListener("click", () => {
        state.q = ""; state.cat = ""; state.stage = ""; state.sort = "default";
        qs("#svc-search").value = "";
        qs("#svc-cat").value = "";
        qs("#svc-stage").value = "";
        qs("#svc-sort").value = "default";
        apply();
      });
    } catch (err) { console.error("[services]", err); }
  });
})();
