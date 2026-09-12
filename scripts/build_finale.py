import os
import re

def build_single_file_presentation():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    rt_dir = os.path.join(base_dir, "public", "rt")
    dist_dir = os.path.join(base_dir, "dist")

    os.makedirs(dist_dir, exist_ok=True)

    index_path = os.path.join(rt_dir, "index.html")
    out_path = os.path.join(dist_dir, "roundtable-finale.html")

    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    # Inline CSS
    def inline_css(match):
        rel_path = match.group(1)
        full_path = os.path.join(rt_dir, rel_path.replace("/", os.sep))
        if os.path.exists(full_path):
            with open(full_path, "r", encoding="utf-8") as css_f:
                return f"<style>\n{css_f.read()}\n</style>"
        return match.group(0)

    html = re.sub(r'<link\s+rel="stylesheet"\s+href="([^"]+)">', inline_css, html)

    # Inline JS
    def inline_js(match):
        rel_path = match.group(1)
        full_path = os.path.join(rt_dir, rel_path.replace("/", os.sep))
        if os.path.exists(full_path):
            with open(full_path, "r", encoding="utf-8") as js_f:
                return f"<script>\n{js_f.read()}\n</script>"
        return match.group(0)

    html = re.sub(r'<script\s+src="([^"]+)"></script>', inline_js, html)

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"Successfully generated single-file presentation: {out_path} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    build_single_file_presentation()
