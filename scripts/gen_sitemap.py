#!/usr/bin/env python3
"""
从 assets/data/*.json 生成 sitemap.xml
用法：在 frontend/ 目录下执行  python3 scripts/gen_sitemap.py
新增服务或政策后跑一次即可保持 sitemap 与数据同步。
"""
import json
import datetime
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE_DIR, "assets", "data")
SITE = "https://www.qifuyizhan.com"   # 上线时替换为正式域名

STATIC_PAGES = [
    ("index.html", "1.0", "weekly"),
    ("services.html", "0.9", "weekly"),
    ("process.html", "0.9", "monthly"),
    ("policy.html", "0.9", "weekly"),
    ("tools.html", "0.8", "monthly"),
    ("compute.html", "0.8", "monthly"),
    ("about.html", "0.6", "yearly"),
    ("contact.html", "0.7", "yearly"),
]


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


def main():
    today = datetime.date.today().isoformat()
    urls = []

    for page, priority, freq in STATIC_PAGES:
        urls.append(
            f"  <url><loc>{SITE}/{page}</loc><lastmod>{today}</lastmod>"
            f"<changefreq>{freq}</changefreq><priority>{priority}</priority></url>"
        )

    for s in load("services.json")["services"]:
        urls.append(
            f"  <url><loc>{SITE}/service.html?id={s['id']}</loc><lastmod>{today}</lastmod>"
            f"<changefreq>monthly</changefreq><priority>0.7</priority></url>"
        )

    for p in load("policies.json")["policies"]:
        urls.append(
            f"  <url><loc>{SITE}/policy-detail.html?id={p['id']}</loc><lastmod>{today}</lastmod>"
            f"<changefreq>monthly</changefreq><priority>0.6</priority></url>"
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )
    out = os.path.join(BASE_DIR, "sitemap.xml")
    with open(out, "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"已生成 {out}，共 {len(urls)} 条 URL")


if __name__ == "__main__":
    main()
