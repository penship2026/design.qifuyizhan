# 企服驿站 · 改造版站点源码

一套**纯静态、无构建、无框架**的企业全流程服务网站。所有内容（服务、政策、流程、站点信息）放在 `assets/data/*.json`，页面按业务模块拆成独立 HTML，改内容不用改代码。

---

## 一、怎么跑起来

浏览器出于安全限制不允许 `file://` 页面读取本地 JSON，所以**必须通过 HTTP 打开**：

```bash
# 方式一（推荐）：回到上一级目录，双击「启动网站.command」
# 方式二：命令行
cd frontend
python3 -m http.server 8080
# 然后浏览器访问 http://localhost:8080/index.html
```

> 如果直接双击 HTML 打开，页面顶部会出现红色提示条，说明该改用上面的方式。

部署也同理：把 `frontend/` 整个目录丢到任意静态托管（Nginx / OSS+CDN / Vercel / GitHub Pages）即可，不需要 Node、不需要编译。

---

## 二、目录结构

```
项目源码/
├── index.html            首页：需求自测 + 分类矩阵 + 四阶段路径 + 政策快讯 + 工具
├── services.html         服务清单：搜索 / 分类 / 阶段 / 排序
├── service.html          服务详情：?id=xxx，含流程、材料、FAQ、关联政策
├── process.html          办事流程向导：四阶段任务清单，可勾选并本地保存进度
├── policy.html           政策库：类型 / 层级 / 阶段 / 关键词筛选
├── policy-detail.html    政策详情：?id=xxx，要点、条件、材料、渠道
├── tools.html            企业工具箱：6 个纯前端测算工具
├── about.html            关于我们：理念、能力边界、时间线、线下网点
├── contact.html          联系我们：留言表单 + 联系方式 + 网点 + FAQ
├── terms.html            服务条款（示例，已设 noindex）
├── privacy.html          隐私政策（示例，已设 noindex）
├── robots.txt
├── sitemap.xml           由 scripts/gen_sitemap.py 生成
├── assets/
│   ├── css/
│   │   ├── base.css       设计令牌、重置、排版、按钮、标签、图标尺寸
│   │   ├── layout.css     顶栏 / 导航 / 抽屉 / 页脚 / 页头 / 面包屑
│   │   ├── components.css 卡片、服务卡、统计、步骤、时间轴、筛选、表单、空状态
│   │   ├── pages.css      各页专属区块（hero、matcher、分类磁贴、工具、关于、联系）
│   │   └── responsive.css 1280 / 1080 / 900 / 720 / 520 断点 + 打印
│   ├── js/
│   │   ├── core.js        数据加载、图标库、DOM/模板工具、卡片渲染、URL、本地存储
│   │   ├── nav.js         顶栏、导航下拉、移动端抽屉、全站搜索、页脚、浮动按钮
│   │   ├── home.js        首页各区块
│   │   ├── services.js    服务清单筛选
│   │   ├── service.js     服务详情
│   │   ├── process.js     流程向导与进度
│   │   ├── policy.js      政策库筛选
│   │   ├── policy-detail.js 政策详情
│   │   ├── tools.js       6 个工具
│   │   ├── about.js       线下网点
│   │   └── contact.js     表单校验与提交
│   ├── data/
│   │   ├── site.json      品牌、联系方式、备案信息、导航、页脚、公告条
│   │   ├── services.json  8 个分类 + 17 项服务（含流程、材料、FAQ、关联政策）
│   │   ├── processes.json 4 个阶段 + 22 个任务 + 每阶段目标与踩坑
│   │   └── policies.json  5 类 + 14 条政策（要点、条件、材料、渠道）
│   └── img/
│       └── favicon.svg
└── scripts/
    └── gen_sitemap.py     从 JSON 生成 sitemap.xml（新增服务/政策后跑一次）
```

---

## 三、几条设计约定

1. **内容与页面分离**：页面里只写结构，文案一律来自 JSON。改价格、加政策、调流程，都只动 `assets/data/`。
2. **一个分类一个模块**：CSS 按基础/布局/组件/页面/响应式五层拆，JS 按页面拆，互不干扰；公共能力集中在 `core.js` 的 `window.App`。
3. **URL 即状态**：详情页用 `?id=`，服务清单用 `?cat=&stage=&need=`，政策库用 `?type=&stage=`，工具用 `?tool=`。链接可分享、可回填。
4. **不依赖任何第三方库**：无 jQuery、无 Bootstrap、无 CDN。图标是内联 SVG 字符串，断网也能完整显示。
5. **数据可核验**：券/税/社保等数字写在 JSON 与工具注释里，`_note` 字段声明"示例数据、上线前替换"，不假装是官方数据。

---

## 四、常见改动怎么做

| 想改什么 | 改哪里 |
|---|---|
| 电话、邮箱、地址、备案号 | `assets/data/site.json` → `contact` / `legal` |
| 顶部滚动公告 | `site.json` → `notice` |
| 导航菜单 | `site.json` → `nav` |
| 加一项服务 | `services.json` → `services` 数组（详见 `docs/一期/内容维护指南.md`） |
| 加一条政策 | `policies.json` → `policies` 数组 |
| 改阶段任务 | `processes.json` → `stages[].tasks` |
| 换主色 | `assets/css/base.css` 顶部 `--brand` 与 `--brand-50/100/700/800` |
| SEO 描述 | 各 HTML 的 `<meta name="description">`，政策/服务详情页由 JSON 的 `summary` 自动写入 |

---

## 五、已知边界

- **客户端渲染**：所有列表由 JS 读 JSON 渲染，搜索引擎能抓到页面骨架与标题，但抓不到列表正文。若 SEO 是硬指标，见 `docs/一期/上线检查清单.md` 的"预渲染"一节。
- **示例数据**：联系方式、备案号、网点地址、价格、政策有效期均为示例，上线前必须替换。
- **表单不发送**：`contact.html` 的提交把记录写进浏览器 localStorage，仅作演示；接后端只改 `contact.js` 的提交段。
- **工具为简化模型**：未考虑专项附加扣除、地方附加差异、优惠叠加限制，结论仅用于内部估算。
