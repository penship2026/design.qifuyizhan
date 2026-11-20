/* ============================================================
   contact.js —— 留言表单校验与本地提交
   ============================================================ */
(function () {
  "use strict";
  const { qs, qsa, esc, icon, data, param, store, toast } = window.App;

  const KEY = "inquiries";

  function setErr(field, on) {
    const box = field.closest(".field");
    if (box) box.classList.toggle("has-error", !!on);
  }

  function renderOffices(site) {
    const box = qs("#contact-offices");
    if (!box) return;
    box.innerHTML = site.contact.offline.map((o, i) =>
      '<div style="border-top:' + (i === 0 ? "0" : "1px dashed var(--line)") + ';padding-top:' + (i === 0 ? "0" : "12px") + '">' +
      '<div style="font-weight:600;font-size:14px">' + esc(o.name) + "</div>" +
      '<div class="small muted">' + esc(o.address) + "</div>" +
      (o.phone ? '<div class="small">' + esc(o.phone) + "</div>" : "") + "</div>").join("");
  }

  function prefill() {
    const svc = param("service"), pol = param("policy");
    const need = qs("#cf-need");
    if (svc && need) {
      const opt = Array.from(need.options).find(o => o.text.indexOf(svc) >= 0);
      if (opt) need.value = opt.value;
      else { need.value = "其他（在下方说明）"; qs("#cf-msg").value = "我想了解：" + svc; }
    }
    if (pol) {
      need.value = "我想知道能领哪些政策与补贴";
      qs("#cf-msg").value = "我想确认是否适用：" + pol;
    }
  }

  function bindForm() {
    const form = qs("#contact-form");
    if (!form) return;

    const agree = qs("#cf-agree");
    const agreeErr = qs("#cf-agree-err");
    if (agreeErr) agreeErr.style.display = "none";

    form.addEventListener("submit", e => {
      e.preventDefault();
      let ok = true;

      const name = qs("#cf-name");
      if (!name.value.trim()) { setErr(name, true); ok = false; } else setErr(name, false);

      const phone = qs("#cf-phone");
      const pv = phone.value.replace(/\s/g, "");
      if (!/^1[3-9]\d{9}$/.test(pv)) { setErr(phone, true); ok = false; } else setErr(phone, false);

      const need = qs("#cf-need");
      if (!need.value) { setErr(need, true); ok = false; } else setErr(need, false);

      if (!agree.checked) { agreeErr.style.display = "block"; ok = false; }
      else agreeErr.style.display = "none";

      if (!ok) {
        const firstErr = qs(".field.has-error");
        if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
        toast("还有必填项没完成");
        return;
      }

      const record = {
        at: new Date().toISOString(),
        name: name.value.trim(),
        phone: pv,
        company: qs("#cf-company").value.trim(),
        stage: qs("#cf-stage").value,
        need: need.value,
        msg: qs("#cf-msg").value.trim()
      };
      const all = store.get(KEY, []);
      all.push(record);
      store.set(KEY, all);

      form.classList.add("hide");
      qs("#cf-success").classList.remove("hide");
      qs("#cf-success").scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // 输入时清除错误态
    qsa("input, select, textarea", form).forEach(el => {
      el.addEventListener("input", () => {
        if (el.type === "checkbox") return;
        setErr(el, false);
      });
      el.addEventListener("change", () => setErr(el, false));
    });

    const again = qs("#cf-again");
    if (again) {
      again.addEventListener("click", () => {
        form.reset();
        form.classList.remove("hide");
        qs("#cf-success").classList.add("hide");
        qs("#cf-name").focus();
      });
    }
  }

  /* 联系方式统一取 site.json，避免 HTML 里再写一份导致不一致 */
  function renderContact(site) {
    const c = site.contact || {};
    const set = (id, val) => { const el = qs("#" + id); if (el && val) el.textContent = val; };
    set("ci-hotline", c.hotline);
    set("ci-email", c.email);
    set("ci-address", c.address);
    set("ci-time", c.workTime);
    set("cta-call-text", c.hotline);
    set("cta-call-text-2", c.hotline);
    if (c.hotline) {
      qsa("#cta-call, #cta-call-2").forEach(a => { a.href = "tel:" + String(c.hotline).replace(/\s/g, ""); });
    }
  }

  window.App.ready(async () => {
    try {
      const site = await data.site();
      renderOffices(site);
      renderContact(site);
    } catch (err) { console.error("[contact]", err); }
    prefill();
    bindForm();

    // 页面内 FAQ 折叠
    qsa(".acc-btn").forEach(btn => {
      btn.addEventListener("click", () => btn.closest(".acc-item").classList.toggle("is-open"));
    });
  });
})();
