/* ============================================================
   eligibility.js —— 政策资格预判（机检版）
   数据：assets/data/eligibility.json（问哪几题 + 每条政策能机检的条件）
        assets/data/policies.json（政策本身，含阶段/条件/材料）
   原则：只做“机器能判”的部分；判不了的官方条件一律列出来让用户自查，
        结论用“机检通过 / 待确认 / 不符合”，不承诺资格。
   ============================================================ */
(function () {
  "use strict";
  const { qs, qsa, esc, icon, data, store, policyUrl, serviceUrl } = window.App;

  const KEY = "eligibility";
  const KEY_ONLY = "eligibility-only";
  const STAGE = { prep: "筹备期", start: "起步期", grow: "成长期", mature: "成熟期" };
  const LABEL = { no: "不符合", check: "待确认", ok: "机检通过" };

  let CFG = null;
  let POL = null;
  let profile = store.get(KEY, null);
  let onlyMatched = !!store.get(KEY_ONLY, false);
  let open = false;              // 预判面板是否展开（默认收起）
  const cache = {};              // policy.id -> 预判结果

  /* ---------- 数据加载 ---------- */
  let loading = null;
  function ensure() {
    if (CFG && POL) return Promise.resolve();
    if (loading) return loading;
    loading = Promise.all([data.eligibility(), data.policies()])
      .then(([cfg, pol]) => {
        CFG = cfg; POL = pol;
        recompute();
        window.dispatchEvent(new Event("elig-change"));
      })
      .catch(err => {
        console.error("[eligibility]", err);
        loading = null;
      });
    return loading;
  }

  /* ---------- 判定 ---------- */
  function fieldOf(id) { return (CFG.fields || []).find(f => f.id === id); }

  function optionOf(fieldId) {
    const f = fieldOf(fieldId);
    if (!f || !profile) return null;
    return f.options.find(o => o.id === profile[fieldId]) || null;
  }

  function check(crit) {
    const opt = optionOf(crit.field);
    if (!opt) return { state: "unknown", crit };
    let ok = null;
    switch (crit.op) {
      case "eq": ok = opt.id === crit.value; break;
      case "in": ok = (crit.value || []).indexOf(opt.id) >= 0; break;
      case "notin": ok = (crit.value || []).indexOf(opt.id) < 0; break;
      case "gte": ok = typeof opt.v === "number" ? opt.v >= crit.value : null; break;
      case "lte": ok = typeof opt.v === "number" ? opt.v <= crit.value : null; break;
    }
    return { state: ok === null ? "unknown" : ok ? "pass" : "fail", crit };
  }

  function assess(p) {
    if (!profile || !CFG) return null;
    const rule = (CFG.rules || {})[p.id] || { criteria: [], notes: [] };
    const out = { pass: [], fail: [], unknown: [], notes: rule.notes || [] };

    /* 阶段门槛：政策声明只面向某几个阶段时，先卡这一条 */
    if (p.stages && p.stages.length && profile.stage && p.stages.indexOf(profile.stage) < 0) {
      out.fail.push({ label: "适用阶段：" + p.stages.map(s => STAGE[s] || s).join("、"), mine: "你现在是" + (STAGE[profile.stage] || profile.stage) });
    }
    (rule.criteria || []).forEach(c => {
      const r = check(c);
      const item = { label: c.label, mine: mineText(c.field) };
      if (r.state === "pass") out.pass.push(item);
      else if (r.state === "fail") out.fail.push(item);
      else out.unknown.push(item);
    });

    out.state = out.fail.length ? "no" : (out.unknown.length ? "check" : "ok");
    return out;
  }

  function mineText(fieldId) {
    const f = fieldOf(fieldId);
    const o = optionOf(fieldId);
    if (!f || !o) return "未填写";
    return f.label + "：" + o.label;
  }

  function recompute() {
    Object.keys(cache).forEach(k => delete cache[k]);
    if (!profile || !POL) return;
    POL.policies.forEach(p => { const r = assess(p); if (r) cache[p.id] = r; });
  }

  /* ---------- 表单 ---------- */
  function formHtml() {
    const fields = (CFG.fields || []).map(f =>
      '<div class="elig-field">' +
        '<div class="elig-q">' + esc(f.label) + (f.hint ? '<span class="elig-hint">' + esc(f.hint) + "</span>" : "") + "</div>" +
        '<div class="elig-opts">' + f.options.map(o =>
          '<button type="button" class="elig-opt' + (profile && profile[f.id] === o.id ? " is-on" : "") +
          '" data-field="' + esc(f.id) + '" data-opt="' + esc(o.id) + '">' + esc(o.label) + "</button>").join("") +
        "</div></div>").join("");

    return '<div class="elig-head">' +
        '<div class="elig-head-main">' +
          '<h3>' + icon("target") + ' 30 秒预判：这几条政策你能拿哪些</h3>' +
          '<p class="elig-sub">只问 8 个选项，按政策原文条件做“机检”。判不了的条件会单独列出，不替你下资格结论。</p>' +
        "</div>" +
        '<div class="elig-head-act">' +
          '<span class="elig-chip" id="elig-chip"></span>' +
          (profile ? '<button type="button" class="btn btn-ghost btn-sm" id="elig-reset">清空重填</button>' : "") +
          '<button type="button" class="btn btn-ghost btn-sm elig-toggle" id="elig-toggle" aria-expanded="false" aria-controls="elig-body">' +
            '<span class="elig-toggle-label">展开</span>' + icon("chevronDown") +
          "</button>" +
        "</div>" +
      "</div>" +
      '<div class="elig-body" id="elig-body"><div class="elig-body-in">' +
        '<div class="elig-grid">' + fields + "</div>" +
        '<div class="elig-foot">' +
          '<button type="button" class="btn btn-primary" id="elig-run">' + icon("check") + " 生成预判</button>" +
          '<label class="elig-only"><input type="checkbox" id="elig-only"' + (onlyMatched ? " checked" : "") + "> 只看不冲突的政策</label>" +
          '<span class="elig-count" id="elig-count"></span>' +
        "</div>" +
        '<div class="elig-note">' + icon("info") +
          "<span>预判依据为本站政策摘要中的条件字段，最终以主管部门当年通知与审核结果为准。</span></div>" +
        '<div class="elig-ai" id="elig-ai"></div>' +
      "</div></div>";
  }

  function mountForm() {
    const box = qs("#elig-panel");
    if (!box || !CFG) return;
    box.innerHTML = formHtml();
    paintSummary();
    applyOpen(box);
  }

  /* 收起/展开：只切 grid 行高，不重排内容 */
  function applyOpen(box) {
    box = box || qs("#elig-panel");
    if (!box) return;
    const body = qs("#elig-body", box);
    const btn = qs("#elig-toggle", box);
    box.classList.toggle("is-collapsed", !open);
    if (btn) {
      btn.setAttribute("aria-expanded", String(open));
      const lb = btn.querySelector(".elig-toggle-label");
      if (lb) lb.textContent = open ? "收起" : "展开";
    }
    if (body) body.toggleAttribute("inert", !open);
  }

  function setOpen(v, scroll) {
    open = !!v;
    applyOpen();
    if (open && scroll) {
      const box = qs("#elig-panel");
      if (box) box.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function paintSummary() {
    const el = qs("#elig-count");
    if (!el) return;
    if (!profile || !POL) {
      el.textContent = "选完 8 项后点“生成预判”，每条政策都会标出机检结果";
      const chip = qs("#elig-chip");
      if (chip) chip.textContent = "8 题 · 约 30 秒";
      return;
    }
    const all = POL.policies.map(p => cache[p.id]).filter(Boolean);
    const no = all.filter(r => r.state === "no").length;
    const ok = all.filter(r => r.state === "ok").length;
    const ck = all.filter(r => r.state === "check").length;
    const parts = [];
    if (ok) parts.push('<b class="elig-c-ok">' + ok + "</b> 条机检通过");
    if (ck) parts.push('<b class="elig-c-ck">' + ck + "</b> 条待确认");
    if (no) parts.push('<b class="elig-c-no">' + no + "</b> 条不符合");
    el.innerHTML = "共 " + all.length + " 条" + (parts.length ? "：" + parts.join("、") : "");
    const chip = qs("#elig-chip");
    if (chip) chip.innerHTML = (ok || ck || no)
      ? "共 " + all.length + " 条 · 通过 <b class=\"elig-c-ok\">" + ok + "</b> · 不符合 <b class=\"elig-c-no\">" + no + "</b>"
      : "已填完，点展开查看结果";
  }

  /* 表单事件（委托在 #elig-panel 上，重绘后依然有效） */
  function bindForm() {
    const box = qs("#elig-panel");
    if (!box) return;
    box.addEventListener("click", e => {
      if (e.target.closest("#elig-toggle") || e.target.closest(".elig-head-main")) {
        setOpen(!open);
        return;
      }
      const opt = e.target.closest(".elig-opt");
      if (opt) {
        const fid = opt.dataset.field, oid = opt.dataset.opt;
        profile = profile || {};
        profile[fid] = profile[fid] === oid ? null : oid;
        store.set(KEY, profile);
        qsa('[data-field="' + fid + '"]', box).forEach(b => b.classList.toggle("is-on", b.dataset.opt === profile[fid]));
        recompute(); paintSummary(); broadcast();
        return;
      }
      if (e.target.closest("#elig-reset")) {
        profile = null; store.set(KEY, null); recompute();
        mountForm(); broadcast(); return;
      }
      if (e.target.closest("#elig-run")) {
        if (!profile || Object.keys(profile).filter(k => profile[k]).length < (CFG.fields || []).length) {
          window.App.toast("还有没选的项，先补全再预判");
          return;
        }
        recompute(); paintSummary(); broadcast();
        const first = qs(".policy-list");
        if (first) first.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    box.addEventListener("change", e => {
      if (e.target.id === "elig-only") {
        onlyMatched = e.target.checked;
        store.set(KEY_ONLY, onlyMatched);
        broadcast();
      }
    });
  }

  function broadcast() {
    window.dispatchEvent(new Event("elig-change"));
  }

  /* ---------- 列表页：给卡片打标 + 过滤 ---------- */
  function filterList(list) {
    if (!onlyMatched || !profile) return list;
    return list.filter(p => (cache[p.id] || {}).state !== "no");
  }

  function decorate(box) {
    const rows = qsa("[data-pol]", box);
    rows.forEach(row => {
      const id = row.getAttribute("data-pol");
      const r = cache[id];
      if (!r) return;
      row.classList.toggle("is-no", r.state === "no");
      const meta = row.querySelector(".policy-meta");
      if (!meta || meta.querySelector(".elig-tag")) return;
      const tag = document.createElement("span");
      tag.className = "tag elig-tag is-" + r.state;
      tag.textContent = LABEL[r.state];
      if (r.state === "check" && r.notes.length) tag.title = "另有 " + r.notes.length + " 条官方条件需自查";
      if (r.state === "no" && r.fail.length) tag.title = r.fail[0].label;
      meta.appendChild(tag);
    });
  }

  /* ---------- 详情页：预判面板 ---------- */
  function detailHTML(p) {
    const r = cache[p.id];
    const box = (title, cls, items) => items.length
      ? '<div class="elig-group"><div class="elig-gl ' + cls + '">' + title + "</div><ul class=\"elig-list\">" +
        items.map(i => "<li><span>" + esc(i.label) + "</span>" + (i.mine ? '<em>' + esc(i.mine) + "</em>" : "") + "</li>").join("") +
        "</ul></div>"
      : "";

    if (!profile || !r) {
      return '<div class="panel elig-detail"><div class="panel-title">我的机检结果</div>' +
        '<p class="small muted">还没做自测。用 8 个选项做一次机检，这条政策会直接标出“机检通过 / 待确认 / 不符合”，以及具体卡在哪一条。</p>' +
        '<a class="btn btn-primary btn-sm mt-8" href="policy.html#elig">去做 30 秒预判 ' + icon("arrowRight") + "</a></div>";
    }

    return '<div class="panel elig-detail"><div class="panel-title">我的机检结果' +
        '<span class="tag elig-tag is-' + r.state + '">' + LABEL[r.state] + "</span></div>" +
        box("已满足（机检）", "is-ok", r.pass) +
        box("不满足", "is-no", r.fail) +
        box("需你确认的官方条件", "is-ck", r.unknown) +
        (r.notes.length
          ? '<div class="elig-after"><div class="elig-gl is-ck">另有 ' + r.notes.length + " 条需自查</div>" +
            '<ul class="elig-list is-plain">' + r.notes.map(n => "<li><span>" + esc(n) + "</span></li>").join("") + "</ul></div>"
          : "") +
        '<div class="elig-cta">' +
          '<a class="btn btn-primary btn-sm" href="contact.html?policy=' + encodeURIComponent(p.title) + '">带预判结果找顾问核对</a>' +
          '<a class="btn btn-ghost btn-sm" href="policy.html#elig">改答案重算</a>' +
        "</div>" +
        '<p class="elig-note">' + icon("info") + "<span>预判只基于本站摘要的可机检条件，最终以主管部门审核为准。</span></p>" +
        '<div class="elig-ai"></div></div>';
  }

  /* ---------- AI 解释层（可选，未配置时静默跳过） ---------- */
  function aiExplain(p, r) {
    const endpoint = window.QFY_AI_ENDPOINT;
    if (!endpoint || !r) return Promise.resolve(null);
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "policy-explain",
        policyId: p.id,
        policyTitle: p.title,
        conditions: p.conditions,
        verdict: { state: r.state, fail: r.fail.map(x => x.label), unknown: r.unknown.map(x => x.label) }
      })
    }).then(res => (res.ok ? res.json() : null)).then(json => (json && json.text) || null).catch(() => null);
  }

  function renderAI(p, r, target) {
    if (!target) return;
    aiExplain(p, r).then(text => {
      if (!text) return;
      target.innerHTML = '<div class="elig-ai-box"><div class="elig-ai-title">AI 解读</div>' +
        "<p>" + esc(text) + "</p></div>";
    });
  }

  /* ---------- 启动 ---------- */
  window.AppEligibility = {
    ensure, assess, filterList, decorate, detailHTML, mountForm, renderAI,
    stateOf: id => (cache[id] || {}).state || null,
    getProfile: () => profile
  };

  window.App.ready(() => {
    data.eligibility().catch(() => null).then(() => { /* 预热，失败不阻塞页面 */ });
    ensure().then(() => {
      mountForm();
      bindForm();
      broadcast();
      if (location.hash === "#elig") setOpen(true, true);   // 从详情页“改答案重算”进来时直接展开
    });
  });
})();
