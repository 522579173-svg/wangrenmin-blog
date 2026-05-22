"""Generate RSS 2.0 feed for wangrenmin-blog by parsing index.html."""
import re
import os
from datetime import datetime
from xml.sax.saxutils import escape

SITE_URL = "https://wangrenmin.com"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BLOG_DIR = os.path.dirname(SCRIPT_DIR)
INDEX = os.path.join(BLOG_DIR, "index.html")
OUTPUT = os.path.join(BLOG_DIR, "rss.xml")


def rss_date(date_str):
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    return dt.strftime("%a, %d %b %Y 08:00:00 +0800")


def main():
    with open(INDEX, "r", encoding="utf-8") as fp:
        html = fp.read()

    # Extract article cards from index.html
    # Each card is an <article class="article-card">...</article>
    cards = re.findall(
        r'<article class="article-card">(.*?)</article>',
        html, re.DOTALL,
    )

    items = []
    for card in cards:
        # Date: <time datetime="2026-05-22">2026年5月22日</time>
        date_m = re.search(r'datetime="([^"]+)"', card)
        # Title/link: <h3><a href="...">Title</a></h3>
        link_m = re.search(r'<a href="([^"]+)">([^<]+)</a>', card)
        # Description: <p>...</p>
        desc_m = re.search(r'<p>([^<]+)</p>', card)
        # Category: <span class="article-category">...</span>
        cat_m = re.search(r'<span class="article-category">([^<]+)</span>', card)

        if not (date_m and link_m):
            continue

        filename = link_m.group(1)
        title = link_m.group(2).strip()
        date = date_m.group(1)
        desc = escape(desc_m.group(1).strip()) if desc_m else ""
        category = cat_m.group(1).strip() if cat_m else "日常保健"

        items.append(f"""  <item>
    <title>{escape(title)}</title>
    <link>{SITE_URL}/{filename}</link>
    <guid isPermaLink="true">{SITE_URL}/{filename}</guid>
    <description>{desc}</description>
    <pubDate>{rss_date(date)}</pubDate>
    <author>wangrenmin@wangrenmin.com (王仁民)</author>
    <category>{escape(category)}</category>
  </item>""")

    now = rss_date(datetime.now().strftime("%Y-%m-%d"))

    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>老王的健康指南</title>
  <link>{SITE_URL}</link>
  <description>全科医生王仁民的健康科普博客。用科学的态度讲健康，用生活的智慧养身体。</description>
  <language>zh-CN</language>
  <lastBuildDate>{now}</lastBuildDate>
  <atom:link href="{SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
{chr(10).join(items)}
</channel>
</rss>"""

    with open(OUTPUT, "w", encoding="utf-8") as fp:
        fp.write(rss)

    print(f"OK: {OUTPUT} — {len(items)} articles")


if __name__ == "__main__":
    main()
