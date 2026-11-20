/* ============================================================
   process.js —— 阶段任务清单（勾选进度存 localStorage）
   ============================================================ */
(function () {
  "use strict";
  const { qs, qsa, esc, icon, data, serviceUrl, policyUrl, param, store, toast, bindReveal } = window.App;

  const KEY = "process-done";
  let PROC = null, SVC = null, POL = null, STAGE = null;

  function doneMap() { return store.get(KEY, {}) || {}; }
  function isDone(taskId) { return !!doneMap()[taskId]; }
  function toggleDone(taskId) {
    const m = doneMap();
    if (m[taskId]) delete m[taskId]; else m[taskId] = 1;
    store.set(KEY, m);
  }

  function renderRail(activeId) {
    qs("#process-rail").innerHTML = PROC.stages.map((st, i) =>
      '<button class="pr-tab' + (st.id === activeId ? " is-active" : "") + '" data-stage="' + st.id + '" type="button">' +
        '<span class="pr-idx">STAGE 0' + (i + 1) + "</span>" +
        "<strong>" + esc(st.name) + "</strong>" +
        "<span>" + esc(st.range) + "</span></button>").join("");

    qsa("[data-stage]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.stage;
        history.replaceState(null, "", "process.html?stage=" + id);
        selectStage(id);
      });
    });
  }

  function renderProgress() {
    const total = STAGE.tasks.length;
    const done = STAGE.tasks.filter(t => isDone(t.id)).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    qs("#task-progress-bar").style.width = pct + "%";
    qs("#task-progress-text").textContent = done + " / " + total;
  }

  function renderTasks() {
    const box = qs("#task-list");
    box.innerHTML = STAGE.tasks.map(t => {
      const svcItem = SVC.services.find(s => s.id === t.service);
      const pols = (t.policies || []).map(pid => POL.policies.find(p => p.id === pid)).filter(Boolean);
      const done = isDone(t.id);
      return '<div class="task-item' + (done ? " is-done" : "") + '" data-task="' + t.id + '">' +
        '<button class="task-check' + (done ? " is-on" : "") + '" type="button" aria-label="标记完成"></button>' +
        "<div><div class=\"task-title\">" + esc(t.title) +
          (t.optional ? ' <span class="tag" style="margin-left:6px">可选</span>' : "") + "</div>" +
          '<div class="task-desc">' + esc(t.desc) + "</div>" +
          '<div class="row mt-12">' +
            (svcItem ? '<a class="tag tag-brand" href="' + serviceUrl(svcItem.id) + '">' + esc(svcItem.name) + "</a>" : "") +
            pols.slice(0, 2).map(p => '<a class="tag" href="' + policyUrl(p.id) + '">' + esc(p.title.length > 14 ? p.title.slice(0, 14) + "…" : p.title) + "</a>").join("") +
            '<span class="tag tag-plain">' + icon("clock") + esc(t.duration) + "</span>" +
          "</div></div>" +
        '<div class="task-actions">' +
          (svcItem ? '<a class="btn btn-ghost btn-sm" href="' + serviceUrl(svcItem.id) + '">看怎么办理</a>' : "") +
        "</div></div>";
    }).join("");

    box.addEventListener("click", e => {
      const check = e.target.closest(".task-check");
      if (!check) return;
      const item = check.closest(".task-item");
      const id = item.dataset.task;
      toggleDone(id);
      item.classList.toggle("is-done", isDone(id));
      check.classList.toggle("is-on", isDone(id));
      renderProgress();
    });
  }

  function renderSide() {
    qs("#stage-goal").innerHTML =
      "<h3>" + esc(STAGE.name) + "</h3>" +
      "<p>" + esc(STAGE.goal) + "</p>" +
      '<p style="margin-top:10px;font-size:13px;opacity:.8">' + esc(STAGE.desc) + "</p>" +
      '<div class="sg-meta"><span>时间窗口：' + esc(STAGE.range) + "</span>" +
      "<span>任务数：" + STAGE.tasks.length + "</span></div>";

    qs("#stage-outputs").innerHTML =
      "<h4>这个阶段结束时应拿到</h4>" +
      '<ul class="qc-list">' + (STAGE.keyOutputs || []).map(o =>
        "<li>" + icon("check") + esc(o) + "</li>").join("") + "</ul>";

    qs("#stage-pitfalls").innerHTML =
      "<h4>常见踩坑</h4>" +
      '<ul class="qc-list">' + (STAGE.pitfalls || []).map(p =>
        '<li style="color:#8a5500">' + icon("alert") + esc(p) + "</li>").join("") + "</ul>";
  }

  function selectStage(id) {
    STAGE = PROC.stages.find(s => s.id === id) || PROC.stages[0];
    renderRail(STAGE.id);
    renderTasks();
    renderSide();
    renderProgress();
    bindReveal(document);
  }

  window.App.ready(async () => {
    try {
      [PROC, SVC, POL] = await Promise.all([data.processes(), data.services(), data.policies()]);
      const init = param("stage") || PROC.stages[1].id;
      selectStage(init);

      qs("#task-reset").addEventListener("click", () => {
        const m = doneMap();
        STAGE.tasks.forEach(t => { delete m[t.id]; });
        store.set(KEY, m);
        selectStage(STAGE.id);
        toast("已重置本阶段进度");
      });
    } catch (err) { console.error("[process]", err); }
  });
})();
