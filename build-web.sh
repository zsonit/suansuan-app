#!/bin/bash
# 把三端网页合并成一个站点：根 = 家长控制台，/kids/ = 孩子端，/parent/ = 家长端
# 用法：bash build-web.sh  →  产物在 suansuan-app/web-dist
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
WEB="$ROOT/web-dist"
KIDS="$ROOT/dist/build/h5"
PARENT="$ROOT/parent-app/dist/build/h5"

[ -f "$KIDS/index.html" ] || { echo "缺少孩子端构建产物：先 npm run build:h5"; exit 1; }
[ -f "$PARENT/index.html" ] || { echo "缺少家长端构建产物：先 cd parent-app && npm run build:h5"; exit 1; }

# 不整目录删除（安全策略会拦批量删除），直接覆盖写入；python 注入时会先清掉旧按钮
mkdir -p "$WEB/kids" "$WEB/parent"

# 1. 根入口 = 家长控制台（保持原网址习惯：打开域名直接是控制台）
cp "$ROOT/parent-console/index.html" "$WEB/index.html"

# 2. 两个 H5 应用
cp -r "$KIDS/." "$WEB/kids/"
cp -r "$PARENT/." "$WEB/parent/"

# 3. 给两个子应用注入「返回入口」小按钮，并设置标题
python - "$WEB" << 'PY'
import sys, os, re
web = sys.argv[1]
def make_btn(sub):
    # kids 页底部有 tabbar，按钮抬高避开；parent 页放右下角
    bottom = '96px' if sub == 'kids' else '20px'
    return ('<a href="../" style="position:fixed;right:12px;bottom:' + bottom + ';z-index:99999;'
            'background:rgba(51,44,38,.72);color:#fff;font-size:13px;font-weight:700;'
            'padding:8px 14px;border-radius:100px;text-decoration:none;'
            'font-family:-apple-system,\'PingFang SC\',sans-serif">返回入口 ›</a>')

old_btn = re.compile(r'<a href="\.\./" style="position:fixed[^"]*">[^<]*返回入口[^<]*</a>')
titles = {'kids': '算算星球 · 网页版', 'parent': '算算星球家长 · 网页版'}
for sub in ('kids', 'parent'):
    p = os.path.join(web, sub, 'index.html')
    html = open(p, encoding='utf-8').read()
    html = old_btn.sub('', html)
    html = html.replace('<title>算算星球</title>', f'<title>{titles[sub]}</title>')
    html = html.replace('<title>算算星球家长</title>', f'<title>{titles[sub]}</title>')
    if '</body>' in html:
        html = html.replace('</body>', make_btn(sub) + '</body>')
    open(p, 'w', encoding='utf-8').write(html)
    print('injected', sub)
PY

echo "OK -> $WEB"
du -sh "$WEB"
