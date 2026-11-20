/* ============================================================
   tools.js —— 企业工具箱（六件，纯前端计算）
   ============================================================ */
(function () {
  "use strict";
  const { qs, qsa, esc, icon, toast, param } = window.App;

  const fmt = n => (isFinite(n) ? Number(n).toLocaleString("zh-CN", { maximumFractionDigits: 2 }) : "—");
  const num = (id, def) => {
    const v = parseFloat(qs("#" + id)?.value);
    return isFinite(v) ? v : (def || 0);
  };
  const outRow = (label, value, hl) => hl
    ? '<div class="to-highlight"><span class="th-label">' + esc(label) + '</span><span class="th-value">' + value + "</span></div>"
    : '<div class="to-row"><span class="to-label">' + esc(label) + '</span><span class="to-value">' + value + "</span></div>";

  /* ---------- 通用面板外壳 ---------- */
  function shell(id, title, sub, formHtml, outHtml) {
    const box = qs("#" + id);
    if (!box || box.dataset.ready) return;
    box.dataset.ready = "1";
    box.innerHTML =
      '<div class="tool-shell"><div class="tool-shell-head">' +
        "<div><h2>" + esc(title) + "</h2>" +
        '<p class="small muted" style="margin-top:2px">' + esc(sub) + "</p></div>" +
        '<button class="btn-text" data-close="' + id + '" type="button">收起 ×</button>' +
      "</div><div class=\"tool-shell-body\">" +
        '<div class="tool-form">' + formHtml + "</div>" +
        '<div class="tool-output" id="' + id + '-out">' + outHtml + "</div>" +
        '<p class="tool-live" id="' + id + '-live" aria-live="polite"></p>' +
      "</div></div>";

    // 输入即算：改数字/下拉立刻刷新结果，按钮仍然保留（点一下也能重算）
    const form = box.querySelector(".tool-form");
    const runBtn = form && form.querySelector(".btn-primary");
    if (form && runBtn) {
      const live = e => {
        if (!e.target.matches("input, select")) return;
        runBtn.click();
      };
      form.addEventListener("input", live);
      form.addEventListener("change", live);

      // 结果时间戳：点按钮/改输入都能看到"确实重算过"，避免以为按钮没生效
      const liveLine = box.querySelector(".tool-live");
      runBtn.addEventListener("click", () => {
        if (!liveLine) return;
        const t = new Date();
        const hh = String(t.getHours()).padStart(2, "0");
        const mm = String(t.getMinutes()).padStart(2, "0");
        const ss = String(t.getSeconds()).padStart(2, "0");
        liveLine.textContent = "已按当前输入计算 · " + hh + ":" + mm + ":" + ss;
      });
    }
  }

  /* ================= 1. 注册资本与印花税 ================= */
  function buildCapital() {
    shell("tool-capital", "注册资本与印花税测算", "资金账簿印花税按实收资本计缴，认缴未实缴部分不产生纳税义务。",
      '<div class="field"><label>注册资本（万元）</label><input type="number" id="cap-total" value="100" min="0" step="10"></div>' +
      '<div class="field"><label>已实缴金额（万元）</label><input type="number" id="cap-paid" value="0" min="0" step="10">' +
        '<span class="hint">认缴制下，按实际到位金额计税</span></div>' +
      '<div class="field"><label>企业是否符合小型微利条件</label>' +
        '<select id="cap-small"><option value="1">是（可享减半征收）</option><option value="0">否 / 暂不确定</option></select></div>' +
      '<button class="btn btn-primary" id="cap-calc" type="button">计算印花税</button>' +
      '<p class="to-note">资金账簿印花税税率为实收资本与资本公积合计金额的 0.025%，符合条件的小微企业可减半征收。</p>',
      outRow("计税依据（实收资本）", "0 万元"));

    qs("#cap-calc").addEventListener("click", () => {
      const total = num("cap-total"), paid = Math.min(num("cap-paid"), total), small = qs("#cap-small").value === "1";
      const rate = small ? 0.000125 : 0.00025;
      const tax = paid * 10000 * rate;
      const fullTax = total * 10000 * rate;
      qs("#tool-capital-out").innerHTML =
        outRow("注册资本", fmt(total) + " 万元") +
        outRow("已实缴金额", fmt(paid) + " 万元") +
        outRow("适用税率", small ? "0.0125%（减半）" : "0.025%") +
        outRow("本次应缴印花税", fmt(tax) + " 元", true) +
        outRow("若全额实缴", fmt(fullTax) + " 元") +
        '<p class="to-note">提示：注册资本代表股东承担的出资责任上限。定得过高会放大责任与股权转让税负，定得过低可能不满足投标或资质门槛。建议按未来 3 年业务规模与行业惯例确定。</p>' +
        '<a class="btn btn-ghost btn-sm" href="service.html?id=gongsi-zhuce">看公司注册怎么办理</a>';
    });
    qs("#cap-calc").click();
  }

  /* ================= 2. 小规模 vs 一般纳税人 ================= */
  function buildVat() {
    shell("tool-vat", "小规模 vs 一般纳税人", "按年销售额与可抵扣进项，比较两种纳税人身份的增值税与附加税负担。",
      '<div class="field"><label>年销售额（万元，不含税）</label><input type="number" id="vat-s" value="300" min="0" step="10"></div>' +
      '<div class="field"><label>可抵扣进项金额（万元，不含税）</label><input type="number" id="vat-in" value="120" min="0" step="10"></div>' +
      '<div class="field"><label>一般纳税人适用税率</label><select id="vat-rate">' +
        '<option value="0.13">13%（货物销售）</option><option value="0.09">9%（建筑、运输、不动产）</option>' +
        '<option value="0.06" selected>6%（现代服务、技术服务）</option></select></div>' +
      '<div class="field"><label>小规模征收率</label><select id="vat-small">' +
        '<option value="0.01" selected>1%（现行优惠）</option><option value="0.03">3%（法定征收率）</option></select></div>' +
      '<button class="btn btn-primary" id="vat-calc" type="button">对比税负</button>' +
      '<p class="to-note">附加税按增值税额的 12%（城建税 7% + 教育费附加 3% + 地方教育附加 2%）简化计算。</p>',
      outRow("增值税差额", "0 元"));

    qs("#vat-calc").addEventListener("click", () => {
      const s = num("vat-s"), inp = num("vat-in"), rate = parseFloat(qs("#vat-rate").value), sr = parseFloat(qs("#vat-small").value);
      const smallVat = Math.max(0, s * 10000 * sr);
      const genVat = Math.max(0, (s - inp) * 10000 * rate);
      const smallTotal = smallVat * 1.12;
      const genTotal = genVat * 1.12;
      const diff = genTotal - smallTotal;
      qs("#tool-vat-out").innerHTML =
        outRow("小规模纳税人增值税", fmt(smallVat) + " 元") +
        outRow("小规模含附加合计", fmt(smallTotal) + " 元", true) +
        outRow("一般纳税人增值税", fmt(genVat) + " 元") +
        outRow("一般纳税人含附加合计", fmt(genTotal) + " 元", true) +
        outRow("差额（一般 − 小规模）", (diff >= 0 ? "+" : "") + fmt(diff) + " 元") +
        '<p class="to-note">' + (diff > 0
          ? "在当前参数下，保持小规模纳税人税负更低。若下游客户多为一般纳税人、需要 13%/6% 专票抵扣，则需把客户议价与订单机会一并考虑。"
          : "在当前参数下，转为一般纳税人更划算，通常意味着进项充足、毛利结构适合抵扣。") +
        " 年应税销售额超过 500 万元的，须登记为一般纳税人。</p>";
    });
    qs("#vat-calc").click();
  }

  /* ================= 3. 社保公积金用工成本 ================= */
  function buildPayroll() {
    shell("tool-payroll", "社保公积金用工成本", "按北京现行缴费基数区间测算单位成本与个人到手。",
      '<div class="field"><label>月工资（元，应发）</label><input type="number" id="pay-salary" value="12000" min="0" step="500"></div>' +
      '<div class="field"><label>住房公积金比例</label><select id="pay-hf">' +
        '<option value="0.05">5%</option><option value="0.07">7%</option><option value="0.08">8%</option>' +
        '<option value="0.12" selected>12%</option></select></div>' +
      '<div class="field"><label>社保缴费基数</label><select id="pay-base">' +
        '<option value="actual" selected>按实际工资（在上下限内）</option>' +
        '<option value="min">按最低基数缴纳</option></select></div>' +
      '<button class="btn btn-primary" id="pay-calc" type="button">测算</button>' +
      '<p class="to-note">北京社保基数区间按 6,821–35,283 元、公积金下限 2,420 元简化处理；比例：养老 16%、失业 0.5%、工伤 0.4%、医疗含生育 9.8%。</p>',
      outRow("单位月成本", "0 元"));

    qs("#pay-calc").addEventListener("click", () => {
      const salary = num("pay-salary");
      const hfRate = parseFloat(qs("#pay-hf").value);
      const minBase = qs("#pay-base").value === "min";
      const S_MIN = 6821, S_MAX = 35283, H_MIN = 2420;
      const sBase = minBase ? S_MIN : Math.min(Math.max(salary, S_MIN), S_MAX);
      const hBase = Math.min(Math.max(minBase ? H_MIN : salary, H_MIN), S_MAX);

      const erSI = sBase * (0.16 + 0.005 + 0.004 + 0.098);
      const eeSI = sBase * (0.08 + 0.005 + 0.02) + 3;
      const erHF = hBase * hfRate;
      const eeHF = hBase * hfRate;
      const cost = salary + erSI + erHF;
      const net = salary - eeSI - eeHF;

      qs("#tool-payroll-out").innerHTML =
        outRow("社保缴费基数", fmt(sBase) + " 元") +
        outRow("单位社保（约 26.7%）", fmt(erSI) + " 元") +
        outRow("单位公积金", fmt(erHF) + " 元") +
        outRow("单位月总成本", fmt(cost) + " 元", true) +
        outRow("个人社保扣缴", fmt(eeSI) + " 元") +
        outRow("个人公积金扣缴", fmt(eeHF) + " 元") +
        outRow("个人到手（税前扣缴后）", fmt(net) + " 元", true) +
        '<p class="to-note">按最低基数缴纳属于常见违规操作：员工可要求补缴差额，企业仍需承担补缴与滞纳金。用工成本应按实际基数预算。</p>';
    });
    qs("#pay-calc").click();
  }

  /* ================= 4. 企业所得税 ================= */
  function buildCit() {
    shell("tool-cit", "企业所得税测算", "对比小微优惠、高新技术企业 15% 与标准 25% 的税额差异。",
      '<div class="field"><label>年利润总额（万元）</label><input type="number" id="cit-p" value="200" min="0" step="10">' +
        '<span class="hint">简化假设：利润总额 = 应纳税所得额</span></div>' +
      '<div class="field"><label>是否满足小型微利条件</label><select id="cit-small">' +
        '<option value="1" selected>是（≤300 万、≤300 人、≤5,000 万资产）</option><option value="0">否</option></select></div>' +
      '<div class="field"><label>是否高新技术企业</label><select id="cit-hn">' +
        '<option value="0" selected>否</option><option value="1">是（15% 税率）</option></select></div>' +
      '<button class="btn btn-primary" id="cit-calc" type="button">测算税额</button>' +
      '<p class="to-note">小型微利企业：应纳税所得额减按 25% 计入、按 20% 税率，实际税负 5%。超过 300 万元即不再符合小微条件。</p>',
      outRow("标准税率税额", "0 元"));

    qs("#cit-calc").addEventListener("click", () => {
      const p = num("cit-p");
      const small = qs("#cit-small").value === "1" && p <= 300;
      const hn = qs("#cit-hn").value === "1";
      const std = p * 10000 * 0.25;
      const smallTax = p * 10000 * 0.05;
      const hnTax = p * 10000 * 0.15;
      qs("#tool-cit-out").innerHTML =
        outRow("标准税率 25%", fmt(std) + " 元") +
        outRow("高新技术企业 15%", fmt(hnTax) + " 元") +
        (small ? outRow("小型微利（实际 5%）", fmt(smallTax) + " 元", true) : outRow("小型微利优惠", "不适用")) +
        outRow("可节省（相对 25%）", fmt(std - (small ? Math.min(smallTax, hn ? hnTax : Infinity) : (hn ? hnTax : std))) + " 元") +
        '<p class="to-note">高新技术企业资格与小微优惠不能叠加，按孰低适用。高企还有市、区两级一次性奖励与研发加计扣除可叠加。</p>' +
        '<a class="btn btn-ghost btn-sm" href="service.html?id=gaoxin-rending">看高企认定条件</a>';
    });
    qs("#cit-calc").click();
  }

  /* ================= 5. 商标 45 类 ================= */
  const CLASSES = [
    ["1", "化学原料", "工业化学品、肥料、粘合剂"], ["2", "颜料油漆", "染料、油墨、防锈剂"], ["3", "日化用品", "洗护、化妆品、香料"],
    ["4", "燃料油脂", "工业油、润滑油、蜡烛"], ["5", "医药", "药品、保健品、消毒剂"], ["6", "金属材料", "金属建材、五金件"],
    ["7", "机械设备", "机床、泵、工业机器人"], ["8", "手工器械", "手动工具、刀具"], ["9", "科学仪器", "软件、电子设备、眼镜"],
    ["10", "医疗器械", "医疗设备、假肢、缝合材料"], ["11", "灯具空调", "照明、取暖、通风设备"], ["12", "运输工具", "汽车、电动车、零部件"],
    ["13", "军火烟火", "火器、烟花"], ["14", "珠宝钟表", "珠宝、手表、贵金属"], ["15", "乐器", "乐器及配件"],
    ["16", "办公用品", "纸、印刷品、文具"], ["17", "橡胶制品", "橡胶、塑料半成品"], ["18", "皮革皮具", "箱包、皮具"],
    ["19", "建筑材料", "非金属建材、门窗"], ["20", "家具", "家具、木制品"], ["21", "厨房洁具", "餐具、清洁用具"],
    ["22", "绳网袋篷", "帐篷、绳索、包装袋"], ["23", "纱线丝", "纺织用纱线"], ["24", "布料床单", "面料、床上用品"],
    ["25", "服装鞋帽", "服装、鞋、帽"], ["26", "纽扣拉链", "服饰辅料"], ["27", "地毯席垫", "地毯、地垫"],
    ["28", "健身器材", "玩具、健身器材"], ["29", "食品", "肉、蛋、奶、食用油"], ["30", "方便食品", "咖啡、调味品、糕点"],
    ["31", "饲料种籽", "农产品、饲料、种子"], ["32", "啤酒饮料", "饮料、矿泉水"], ["33", "酒", "白酒、葡萄酒"],
    ["34", "烟草烟具", "烟草制品、烟具"], ["35", "广告销售", "广告、连锁经营、店铺销售"], ["36", "金融物管", "金融、保险、不动产管理"],
    ["37", "建筑修理", "施工、安装、维修"], ["38", "通讯服务", "电信、信息传输"], ["39", "运输贮藏", "物流、仓储、旅行安排"],
    ["40", "材料加工", "材料处理、印刷、定制加工"], ["41", "教育娱乐", "培训、出版、文娱活动"], ["42", "网站服务", "软件开发、SaaS、技术服务"],
    ["43", "餐饮住宿", "餐饮、酒店"], ["44", "医疗园艺", "医疗服务、园艺、美容"], ["45", "社会服务", "法律服务、安保、家政"]
  ];

  function buildTrademark() {
    shell("tool-trademark", "商标 45 类速查", "输入业务关键词，快速定位应注册的核心类别。第 1–34 类为商品，第 35–45 类为服务。",
      '<div class="field"><label>你的业务是什么</label><input type="text" id="tm-kw" placeholder="如：软件、餐饮、服装、饮料"></div>' +
      '<div class="field"><label>常见组合建议</label>' +
        '<p class="small muted">软件/SaaS：第 9 类 + 第 42 类 + 第 35 类；餐饮：第 43 类 + 第 30/29 类 + 第 35 类；服装：第 25 类 + 第 35 类。</p></div>' +
      '<button class="btn btn-primary" id="tm-go" type="button">筛选类别</button>',
      '<div id="tm-list" class="class-grid"></div>');

    const list = qs("#tm-list");
    function paint(kw) {
      const q = (kw || "").trim().toLowerCase();
      const rows = q ? CLASSES.filter(c => (c[1] + c[2]).toLowerCase().indexOf(q) >= 0 || c[0] === q) : CLASSES;
      list.innerHTML = rows.map(c =>
        '<div class="class-item"><b>' + c[0] + " 类 · " + esc(c[1]) + "</b><span>" + esc(c[2]) + "</span></div>").join("");
    }
    paint("");
    qs("#tm-go").addEventListener("click", () => {
      const kw = qs("#tm-kw").value;
      paint(kw);
      if (!qs(".class-item")) toast("没有匹配的类别，换个关键词试试");
    });
    qs("#tm-kw").addEventListener("input", e => paint(e.target.value));
  }

  /* ================= 6. 名称合规自检 ================= */
  function buildName() {
    shell("tool-name", "公司名称合规自检", "按“行政区划 + 字号 + 行业 + 组织形式”结构检查名称是否规范。",
      '<div class="field"><label>拟用公司名称</label><input type="text" id="nm-val" value="北京云启科技有限公司">' +
        '<span class="hint">示例：北京 + 云启 + 科技 + 有限公司</span></div>' +
      '<button class="btn btn-primary" id="nm-go" type="button">开始自查</button>',
      '<div id="nm-out" class="stack"></div>');

    const WARN_WORDS = ["中国", "中华", "国际", "集团", "控股", "金融", "银行", "证券", "保险", "基金", "信托", "交易所", "医院", "大学", "研究院", "协会", "中心"];
    const AREAS = ["北京", "上海", "广州", "深圳", "天津", "重庆", "河北", "山西", "辽宁", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "四川", "陕西"];

    function check(name) {
      const issues = [];
      const n = (name || "").trim();
      if (!n) return [{ ok: false, text: "请输入名称" }];
      if (n.length < 4) issues.push({ ok: false, text: "名称过短，至少应包含字号与组织形式" });
      if (n.length > 30) issues.push({ ok: false, text: "名称过长，建议控制在 30 个汉字以内" });

      const hasArea = AREAS.some(a => n.indexOf(a) === 0);
      issues.push({ ok: true, text: hasArea ? "行政区划表述正常（以城市/省份开头）" : "未使用行政区划开头，可能采用无区划名称，需另行核准" });

      const tail = n.slice(-3);
      const orgOk = ["有限公司", "有限责任公司", "股份有限公司", "合伙企业", "个人独资"].some(k => n.indexOf(k) >= 0);
      issues.push({ ok: orgOk, text: orgOk ? "组织形式表述完整" : "缺少组织形式，结尾应为“有限公司/有限责任公司”等" });

      const hits = WARN_WORDS.filter(w => n.indexOf(w) >= 0 && !(w === "中心" && n.length < 8));
      issues.push({ ok: hits.length === 0, text: hits.length ? "含需审批或限制使用的表述：" + hits.join("、") + "，需符合对应条件" : "未包含需前置审批的敏感表述" });

      const digits = (n.match(/\d/g) || []).length;
      const letters = (n.match(/[a-zA-Z]/g) || []).length;
      issues.push({ ok: digits + letters <= 2, text: digits + letters > 2 ? "字号中数字/字母偏多，容易被认定为不规范或近似" : "字号以汉字为主，符合常规表述习惯" });

      const industry = ["科技", "商贸", "文化", "咨询", "服务", "实业", "投资", "建设", "物流", "教育"].some(k => n.indexOf(k) >= 0);
      issues.push({ ok: industry, text: industry ? "含行业表述，与经营范围易于对应" : "建议补一个行业表述（如科技、商贸、咨询），便于与经营范围匹配" });

      return issues;
    }

    function render() {
      const rows = check(qs("#nm-val").value);
      qs("#nm-out").innerHTML = rows.map(r =>
        '<div class="to-row" style="align-items:flex-start"><span class="to-label" style="display:flex;gap:8px">' +
          (r.ok ? '<span style="color:var(--green)">' + icon("check") + "</span>" : '<span style="color:var(--red)">' + icon("alert") + "</span>") +
          esc(r.text) + "</span></div>").join("") +
        '<p class="to-note">以上为结构规范自查，不构成核名结果。最终能否通过取决于同行业近似名称、禁用词库与属地规则，建议同时提交 3–5 个备选名称。</p>' +
        '<a class="btn btn-ghost btn-sm" href="service.html?id=gongsi-zhuce">看注册公司流程</a>';
    }
    qs("#nm-go").addEventListener("click", render);
    render();
  }

  /* ================= 7. 个税与到手工资 ================= */
  const IIT_BRACKETS = [
    [36000, 0.03, 0], [144000, 0.1, 2520], [300000, 0.2, 16920],
    [420000, 0.25, 31920], [660000, 0.3, 52920], [960000, 0.35, 85920],
    [Infinity, 0.45, 181920]
  ];
  const iitOf = t => {
    if (t <= 0) return 0;
    const b = IIT_BRACKETS.find(x => t <= x[0]);
    return t * b[1] - b[2];
  };

  function buildIit() {
    shell("tool-iit", "个税与到手工资", "按年度综合所得口径估算工资薪金个税，已考虑五险一金与专项附加扣除。",
      '<div class="field"><label>月工资（元，应发）</label><input type="number" id="iit-salary" value="20000" min="0" step="500"></div>' +
      '<div class="field"><label>住房公积金比例</label><select id="iit-hf">' +
        '<option value="0.05">5%</option><option value="0.07">7%</option><option value="0.08">8%</option>' +
        '<option value="0.12" selected>12%</option></select></div>' +
      '<div class="field"><label>专项附加扣除（元/月）</label><input type="number" id="iit-special" value="2000" min="0" step="500">' +
        '<span class="hint">子女教育 2000/孩、赡养老人 3000、房贷利息 1000、住房租金 1500</span></div>' +
      '<button class="btn btn-primary" id="iit-calc" type="button">测算个税</button>' +
      '<p class="to-note">按全年 12 个月工资不变、年度税率表估算；年终奖、股权激励等单独计税项目未计入。</p>',
      outRow("全年个税", "0 元"));

    qs("#iit-calc").addEventListener("click", () => {
      const salary = num("iit-salary"), hfRate = parseFloat(qs("#iit-hf").value), special = num("iit-special");
      const S_MIN = 6821, S_MAX = 35283, H_MIN = 2420;
      const sBase = Math.min(Math.max(salary, S_MIN), S_MAX);
      const hBase = Math.min(Math.max(salary, H_MIN), S_MAX);
      const eeSI = sBase * (0.08 + 0.005 + 0.02) + 3;
      const eeHF = hBase * hfRate;
      const annual = salary * 12;
      const deduct = (eeSI + eeHF) * 12 + 60000 + special * 12;
      const taxable = Math.max(0, annual - deduct);
      const tax = iitOf(taxable);
      const monthlyTax = tax / 12;
      const net = salary - eeSI - eeHF - monthlyTax;
      qs("#tool-iit-out").innerHTML =
        outRow("个人社保公积金", fmt(eeSI + eeHF) + " 元/月") +
        outRow("全年应纳税所得额", fmt(taxable) + " 元") +
        outRow("全年个税", fmt(tax) + " 元", true) +
        outRow("月均个税", fmt(monthlyTax) + " 元") +
        outRow("月到手（税后）", fmt(net) + " 元", true) +
        outRow("实际税负率", (annual ? (tax / annual * 100).toFixed(2) : "0") + "%") +
        '<p class="to-note">专项附加扣除填报得越完整，预扣个税越接近实际。年度汇算多退少补，赡养老人、住房租金等需留存备查资料。</p>' +
        '<a class="btn btn-ghost btn-sm" href="service.html?id=daili-jizhang">看代理记账服务</a>';
    });
    qs("#iit-calc").click();
  }

  /* ================= 8. 残疾人就业保障金 ================= */
  function buildDisability() {
    shell("tool-disability", "残疾人就业保障金", "按北京 1.5% 比例与分档减缴政策，估算年度应缴保障金。",
      '<div class="field"><label>上年在职职工人数</label><input type="number" id="pd-staff" value="80" min="0" step="1"></div>' +
      '<div class="field"><label>上年实际安排残疾人就业人数</label><input type="number" id="pd-dis" value="0" min="0" step="0.5">' +
        '<span class="hint">按残疾人证/残疾军人证核定，1–2 级可按 2 人折算（以认定为准）</span></div>' +
      '<div class="field"><label>上年在职职工年平均工资（万元）</label><input type="number" id="pd-wage" value="12" min="0" step="0.5"></div>' +
      '<button class="btn btn-primary" id="pd-calc" type="button">测算保障金</button>' +
      '<p class="to-note">北京安排比例 1.5%；安排比例达 1%（含）以上但未达 1.5% 按 50% 缴纳，1% 以下按 90% 缴纳；在职职工 30 人（含）以下的企业免征。</p>',
      outRow("年度应缴保障金", "0 元"));

    qs("#pd-calc").addEventListener("click", () => {
      const staff = num("pd-staff"), dis = num("pd-dis"), avgWage = num("pd-wage");
      const required = staff * 0.015;
      const gap = Math.max(0, required - dis);
      const ratio = staff ? dis / staff : 0;
      const raw = gap * avgWage * 10000;
      const exempt = staff > 0 && staff <= 30;
      const level = exempt ? 0 : (ratio >= 0.015 ? 0 : (ratio >= 0.01 ? 0.5 : 0.9));
      const due = raw * level;
      qs("#tool-disability-out").innerHTML =
        outRow("应安排残疾人就业人数", fmt(required) + " 人") +
        outRow("已安排", fmt(dis) + " 人") +
        outRow("差额人数", fmt(gap) + " 人") +
        outRow("减缴前应缴额", fmt(raw) + " 元") +
        outRow("分档减缴比例", exempt ? "免征（30 人以下）" : (level === 0 ? "不需缴纳" : (level * 100) + "%")) +
        outRow("年度应缴保障金", fmt(due) + " 元", true) +
        (exempt
          ? '<p class="to-note">在职职工 30 人（含）以下的企业免征保障金，但仍需按规定申报，避免漏报。</p>'
          : '<p class="to-note">按比例安排残疾人就业是法定义务：未达 1.5% 需缴保障金，且不能以缴代雇。招用残疾人还可享增值税即征即退、工资加计扣除等优惠。</p>') +
        '<a class="btn btn-ghost btn-sm" href="contact.html?policy=' + encodeURIComponent("残保金与残疾人就业") + '">咨询减免与安置方案</a>';
    });
    qs("#pd-calc").click();
  }

  /* ================= 9. 离职经济补偿 ================= */
  function buildSeverance() {
    shell("tool-severance", "离职经济补偿（N）测算", "按劳动合同法第 47 条估算经济补偿金，含 3 倍封顶与 12 年上限。",
      '<div class="field"><label>本单位工作年限（年，可填 0.5 的倍数）</label><input type="number" id="sv-years" value="3" min="0" step="0.5"></div>' +
      '<div class="field"><label>离职前 12 个月平均工资（元）</label><input type="number" id="sv-salary" value="15000" min="0" step="500"></div>' +
      '<div class="field"><label>当地上年度职工月平均工资（元）</label><input type="number" id="sv-avg" value="12000" min="0" step="500">' +
        '<span class="hint">按当地人社局公布口径填写，用于判断 3 倍封顶</span></div>' +
      '<div class="field"><label>是否未提前 30 天书面通知</label><select id="sv-notice">' +
        '<option value="0" selected>否（已提前通知）</option><option value="1">是（需另付 1 个月代通知金）</option></select></div>' +
      '<button class="btn btn-primary" id="sv-calc" type="button">测算补偿金</button>' +
      '<p class="to-note">满 6 个月不满 1 年按 1 年计，不满 6 个月按半个月计；月工资高于当地社平 3 倍的按 3 倍计，且年限最高 12 年。</p>',
      outRow("经济补偿金", "0 元"));

    qs("#sv-calc").addEventListener("click", () => {
      const years = num("sv-years"), salary = num("sv-salary"), avg = num("sv-avg");
      const cap = avg * 3;
      const base = Math.min(salary, cap);
      let months;
      if (years < 0.5) months = 0.5;
      else if (years < 1) months = 1;
      else {
        const frac = years % 1;
        months = Math.floor(years) + (frac === 0 ? 0 : (frac >= 0.5 ? 1 : 0.5));
      }
      if (salary > cap) months = Math.min(months, 12);
      const comp = base * months;
      const notice = qs("#sv-notice").value === "1" ? salary : 0;
      qs("#tool-severance-out").innerHTML =
        outRow("计算基数（月工资）", fmt(base) + " 元" + (salary > cap ? "（按 3 倍社平封顶）" : "")) +
        outRow("补偿月数", months + " 个月") +
        outRow("经济补偿金（N）", fmt(comp) + " 元", true) +
        (notice ? outRow("代通知金（+1）", fmt(notice) + " 元") : "") +
        outRow("合计", fmt(comp + notice) + " 元", true) +
        '<p class="to-note">协商一致解除、经济性裁员通常为 N；用人单位违法解除需按 2N 支付赔偿金。劳动者主动辞职一般无补偿，但以未缴社保、拖欠工资为由解除的除外。实际计算请以劳动合同、工资流水与当地仲裁口径为准。</p>' +
        '<a class="btn btn-ghost btn-sm" href="contact.html?policy=' + encodeURIComponent("离职补偿与用工风险") + '">找顾问核对用工风险</a>';
    });
    qs("#sv-calc").click();
  }

  /* ================= 10. 高新技术企业条件自检 ================= */
  function buildHn() {
    shell("tool-hn", "高新技术企业条件自检", "按认定办法的 6 项硬条件逐条核对，先看能不能报，再谈材料。",
      '<div class="field"><label>企业成立年限（年）</label><input type="number" id="hn-years" value="3" min="0" step="1"></div>' +
      '<div class="field"><label>最近一年销售收入（万元）</label><input type="number" id="hn-rev" value="3000" min="0" step="100"></div>' +
      '<div class="field"><label>近三年销售收入合计（万元）</label><input type="number" id="hn-rev3" value="8000" min="0" step="100"></div>' +
      '<div class="field"><label>近三年研发费用合计（万元）</label><input type="number" id="hn-rd" value="500" min="0" step="50"></div>' +
      '<div class="field"><label>职工总数 / 科技人员数</label>' +
        '<div style="display:flex;gap:8px"><input type="number" id="hn-staff" value="60" min="1" step="1" style="flex:1"><input type="number" id="hn-tech" value="12" min="0" step="1" style="flex:1"></div>' +
        '<span class="hint">左：职工总数；右：科技人员数</span></div>' +
      '<div class="field"><label>近一年高新技术产品（服务）收入（万元）</label><input type="number" id="hn-hi" value="1800" min="0" step="100"></div>' +
      '<div class="field"><label>知识产权数量（件）</label><input type="number" id="hn-ip" value="3" min="0" step="1">' +
        '<span class="hint">发明专利、实用新型、软著等均可计入，I 类更有利</span></div>' +
      '<div class="field"><label>近一年是否有重大安全、质量、环保事故或严重违法</label><select id="hn-bad">' +
        '<option value="0" selected>无</option><option value="1">有</option></select></div>' +
      '<button class="btn btn-primary" id="hn-calc" type="button">开始自检</button>' +
      '<p class="to-note">研发费用占比按最近一年销售收入分档：≤5,000 万不低于 5%，5,000 万–2 亿不低于 4%，2 亿以上不低于 3%。</p>',
      '<div id="hn-out" class="stack"></div>');

    const row = (ok, label, val) =>
      '<div class="to-row" style="align-items:flex-start"><span class="to-label" style="display:flex;gap:8px">' +
        (ok ? '<span style="color:var(--green)">' + icon("check") + "</span>" : '<span style="color:var(--red)">' + icon("alert") + "</span>") +
        esc(label) + '</span><span class="to-value">' + esc(val) + "</span></div>";

    qs("#hn-calc").addEventListener("click", () => {
      const years = num("hn-years"), rev = num("hn-rev"), rev3 = num("hn-rev3"), rd = num("hn-rd");
      const staff = num("hn-staff"), tech = num("hn-tech"), hi = num("hn-hi"), ip = num("hn-ip");
      const bad = qs("#hn-bad").value === "1";
      const need = rev <= 5000 ? 0.05 : (rev <= 20000 ? 0.04 : 0.03);
      const rdRatio = rev3 ? rd / rev3 : 0;
      const techRatio = staff ? tech / staff : 0;
      const hiRatio = rev ? hi / rev : 0;
      const checks = [
        [years >= 1, "成立满一年", years + " 年"],
        [ip >= 1, "拥有知识产权", ip + " 件"],
        [techRatio >= 0.1, "科技人员占比不低于 10%", (techRatio * 100).toFixed(1) + "%"],
        [rdRatio >= need, "研发费用占比不低于 " + (need * 100) + "%", (rdRatio * 100).toFixed(1) + "%"],
        [hiRatio >= 0.6, "高新技术产品收入占比不低于 60%", (hiRatio * 100).toFixed(1) + "%"],
        [!bad, "无重大事故与严重违法", bad ? "存在" : "无"]
      ];
      const fails = checks.filter(c => !c[0]);
      qs("#hn-out").innerHTML = checks.map(c => row(c[0], c[1], c[2])).join("") +
        '<div class="to-highlight"><span class="th-label">自检结论</span><span class="th-value">' +
          (fails.length ? fails.length + " 项未达标" : "6 项硬条件均满足") + "</span></div>" +
        '<p class="to-note">' + (fails.length
          ? "未达标项需先补：研发费用归集要按项目建辅助账，科技人员需有社保与工时记录，高新收入要与合同、发票对应。"
          : "硬条件满足只代表具备申报基础，评分仍需在知识产权质量、成果转化数量、研发组织管理与成长性上拿分（满分 100，需 71 分以上）。") + "</p>" +
        '<a class="btn btn-ghost btn-sm" href="service.html?id=gaoxin-rending">看高企认定服务</a>';
    });
    qs("#hn-calc").click();
  }

  /* ================= 11. 研发费用加计扣除 ================= */
  function buildRd() {
    shell("tool-rd", "研发费用加计扣除测算", "按 100%（集成电路、工业母机 120%）加计比例，估算可少缴的企业所得税。",
      '<div class="field"><label>当年归集研发费用（万元）</label><input type="number" id="rd-cost" value="200" min="0" step="10"></div>' +
      '<div class="field"><label>企业所得税适用税率</label><select id="rd-rate">' +
        '<option value="0.25" selected>25%（标准税率）</option><option value="0.15">15%（高新技术企业）</option>' +
        '<option value="0.05">5%（小型微利，实际税负）</option></select></div>' +
      '<div class="field"><label>加计扣除比例</label><select id="rd-ratio">' +
        '<option value="1" selected>100%（现行一般口径）</option><option value="1.2">120%（集成电路、工业母机）</option>' +
        '<option value="0.75">75%（2022 年及以前年度）</option></select></div>' +
      '<button class="btn btn-primary" id="rd-calc" type="button">测算节税</button>' +
      '<p class="to-note">加计扣除是税基优惠：在据实扣除的基础上再按比例加计，减少的是应纳税所得额，不是直接减免税额。</p>',
      outRow("可少缴企业所得税", "0 元"));

    qs("#rd-calc").addEventListener("click", () => {
      const cost = num("rd-cost"), rate = parseFloat(qs("#rd-rate").value), ratio = parseFloat(qs("#rd-ratio").value);
      const extra = cost * ratio;
      const save = extra * rate;
      qs("#tool-rd-out").innerHTML =
        outRow("据实扣除", fmt(cost) + " 万元") +
        outRow("加计扣除额", fmt(extra) + " 万元", true) +
        outRow("税前合计可扣除", fmt(cost + extra) + " 万元") +
        outRow("可少缴企业所得税", fmt(save) + " 万元", true) +
        outRow("折合每 100 万研发投入节税", fmt(ratio * rate * 100) + " 万元") +
        '<p class="to-note">负面清单行业（烟草制造、住宿餐饮、批发零售、房地产、租赁商务服务、娱乐业等）不适用加计扣除。研发费用需按项目设置辅助账，与生产经营费用分别核算，否则税务可能不予认可。</p>' +
        '<a class="btn btn-ghost btn-sm" href="policy-detail.html?id=pol-rd-deduction">看研发费用加计扣除政策</a>';
    });
    qs("#rd-calc").click();
  }

  /* ================= 12. 合同印花税速查 ================= */
  const STAMP_TYPES = [
    ["借款合同", 0.00005, "借款金额"],
    ["融资租赁合同", 0.00005, "租金"],
    ["买卖合同", 0.0003, "价款"],
    ["承揽合同", 0.0003, "报酬"],
    ["建设工程合同", 0.0003, "价款"],
    ["运输合同", 0.0003, "运输费用"],
    ["技术合同", 0.0003, "价款 / 报酬 / 使用费"],
    ["租赁合同", 0.001, "租金"],
    ["保管合同", 0.001, "保管费"],
    ["仓储合同", 0.001, "仓储费"],
    ["财产保险合同", 0.001, "保险费"],
    ["产权转移书据", 0.0005, "价款"],
    ["营业账簿（实收资本）", 0.00025, "实收资本 + 资本公积"]
  ];
  const pct = v => (v * 100).toFixed(v < 0.0001 ? 4 : 3).replace(/0+$/, "").replace(/\.$/, "") + "%";

  function buildStamp() {
    shell("tool-stamp", "合同印花税速查", "选合同类型、填金额，直接出税额；小微企业可叠加减半。",
      '<div class="field"><label>合同类型</label><select id="st-type">' +
        STAMP_TYPES.map((t, i) => '<option value="' + i + '"' + (i === 2 ? " selected" : "") + ">" + esc(t[0]) + "</option>").join("") +
      "</select></div>" +
      '<div class="field"><label>合同金额（万元，按' + "计税依据" + '）</label><input type="number" id="st-amount" value="100" min="0" step="10">' +
        '<span class="hint" id="st-basis">买卖合同按价款，不含增值税</span></div>' +
      '<div class="field"><label>是否小型微利 / 小规模纳税人</label><select id="st-small">' +
        '<option value="1" selected>是（六税两费减半）</option><option value="0">否</option></select></div>' +
      '<button class="btn btn-primary" id="st-calc" type="button">计算印花税</button>' +
      '<p class="to-note">印花税由书立合同的双方各自全额缴纳；同一合同载有两个以上税目事项、未分别列明金额的，从高适用税率。</p>',
      outRow("应纳税额", "0 元"));

    const sync = () => {
      const t = STAMP_TYPES[parseInt(qs("#st-type").value, 10)] || STAMP_TYPES[0];
      qs("#st-basis").textContent = esc(t[0]) + "按" + t[2] + "计算，不含增值税";
    };
    qs("#st-type").addEventListener("change", sync);
    sync();

    qs("#st-calc").addEventListener("click", () => {
      const t = STAMP_TYPES[parseInt(qs("#st-type").value, 10)] || STAMP_TYPES[0];
      const amount = num("st-amount"), half = qs("#st-small").value === "1";
      const tax = amount * 10000 * t[1];
      const due = half ? tax * 0.5 : tax;
      qs("#tool-stamp-out").innerHTML =
        outRow("合同类型", t[0]) +
        outRow("计税依据", t[2]) +
        outRow("合同金额", fmt(amount) + " 万元") +
        outRow("税率", pct(t[1])) +
        outRow("应纳税额（单方）", fmt(due) + " 元", true) +
        outRow("双方合计", fmt(due * 2) + " 元") +
        (half ? outRow("已按六税两费减半", "省 " + fmt(tax * 0.5) + " 元") : "") +
        '<p class="to-note">未列明金额的应税合同，按实际结算金额申报；电子合同与纸质合同纳税义务相同。印花税一般按季、按次申报，别漏掉框架协议下的具体订单。</p>';
    });
    qs("#st-calc").click();
  }

  /* ---------- 构建器映射：点开时若面板还是空的，就地补建 ---------- */
  const BUILDERS = {
    "tool-capital": buildCapital,
    "tool-vat": buildVat,
    "tool-payroll": buildPayroll,
    "tool-cit": buildCit,
    "tool-trademark": buildTrademark,
    "tool-name": buildName,
    "tool-iit": buildIit,
    "tool-disability": buildDisability,
    "tool-severance": buildSeverance,
    "tool-hn": buildHn,
    "tool-rd": buildRd,
    "tool-stamp": buildStamp
  };

  /* ---------- 面板切换 ---------- */
  function openTool(id, doScroll) {
    const box = qs("#" + id);
    // 面板可能因脚本缓存/构建异常仍是空壳：这里就地补建，保证点开一定有内容
    if (box && !box.querySelector(".tool-shell") && BUILDERS[id]) {
      try {
        BUILDERS[id]();
      } catch (err) {
        console.error("[tools] 构建失败", id, err);
        box.innerHTML = '<div class="tool-shell"><div class="tool-shell-head"><div><h2>工具加载失败</h2>' +
          '<p class="small muted">请强制刷新页面（Cmd/Ctrl + Shift + R）后重试。</p></div></div></div>';
        box.classList.add("is-open");
        return;
      }
    }
    qsa(".tool-panel").forEach(p => p.classList.toggle("is-open", p.id === id));
    if (box && doScroll !== false) {
      // 用即时滚动，避免平滑动画在部分环境下留下空白
      setTimeout(() => box.scrollIntoView({ block: "start" }), 80);
    }
  }

  window.App.ready(() => {
    Object.keys(BUILDERS).forEach(id => {
      try {
        BUILDERS[id]();
      } catch (err) {
        console.error("[tools] 初始化失败", id, err);
      }
    });

    qsa("[data-open]").forEach(btn => {
      btn.addEventListener("click", () => {
        openTool(btn.dataset.open);
        history.replaceState(null, "", "#" + btn.dataset.open);
      });
    });

    /* 整卡可点：点卡片空白处等同于点按钮（点在按钮上不重复触发） */
    qsa(".tool-card").forEach(card => {
      card.addEventListener("click", e => {
        if (e.target.closest("[data-open]")) return;
        const btn = card.querySelector("[data-open]");
        if (btn) btn.click();
      });
    });

    /* ---------- 业务筛选：全部 / 财税测算 / 用工成本 / 资质与合规 ---------- */
    const chips = qsa("[data-filter]");
    const filterCount = qs("#tool-filter-count");
    chips.forEach(chip => {
      const kind = chip.dataset.filter;
      const total = kind === "all"
        ? qsa(".tool-card").length
        : qsa('[data-kind="' + kind + '"]').length;
      const badge = chip.querySelector(".chip-count");
      if (badge) badge.textContent = total;

      chip.addEventListener("click", () => {
        chips.forEach(c => {
          const on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });

        let shown = 0;
        qsa(".tool-card").forEach(card => {
          const show = kind === "all" || card.dataset.kind === kind;
          card.classList.toggle("is-hidden", !show);
          if (show) shown++;
        });
        if (filterCount) filterCount.textContent = shown;

        // 筛选把当前面板的卡片藏起来时，面板一并收起，避免"卡片没了、面板还挂着"
        const open = qs(".tool-panel.is-open");
        if (open) {
          const btn = qs('[data-open="' + open.id + '"]');
          const wrap = btn && btn.closest(".tool-card");
          if (wrap && wrap.classList.contains("is-hidden")) {
            open.classList.remove("is-open");
            history.replaceState(null, "", location.pathname);
          }
        }
      });
    });

    document.addEventListener("click", e => {
      const close = e.target.closest("[data-close]");
      if (close) {
        qs("#" + close.dataset.close).classList.remove("is-open");
        history.replaceState(null, "", location.pathname);
      }
    });

    const hash = location.hash.replace("#", "");
    if (hash && qs("#" + hash)) openTool(hash);
    else {
      const t = param("tool");
      if (t && qs("#" + t)) openTool(t, false);
    }
  });
})();
