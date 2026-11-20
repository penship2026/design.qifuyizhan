/* ============================================================
   about.js —— 线下网点
   ============================================================ */
(function () {
  "use strict";
  const { qs, esc, icon, data } = window.App;

  window.App.ready(async () => {
    const box = qs("#about-offices");
    if (!box) return;
    try {
      const site = await data.site();
      box.innerHTML = site.contact.offline.map((o, i) =>
        '<div class="card card-hover"><div class="sc-top" style="display:flex;gap:12px;align-items:center">' +
          '<span class="icon-box icon-box-sm">' + icon("pin") + "</span>" +
          "<div><h3 style=\"font-size:16px\">" + esc(o.name) + "</h3>" +
          '<span class="faint tiny">网点 0' + (i + 1) + "</span></div></div>" +
          '<dl class="spec-list mt-16">' +
            '<div class="spec-row"><dt>地址</dt><dd>' + esc(o.address) + "</dd></div>" +
            '<div class="spec-row"><dt>电话</dt><dd>' + esc(o.phone) + "</dd></div>" +
            '<div class="spec-row"><dt>时间</dt><dd>' + esc(site.contact.workTime) + "</dd></div>" +
          "</dl></div>").join("");
    } catch (err) { console.error("[about]", err); }
  });
})();
