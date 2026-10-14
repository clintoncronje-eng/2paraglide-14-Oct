#!/usr/bin/env python3
"""Build tool: compiles the ENTIRE site into ONE self-contained code file.

Runs a production Vite build with all lazy chunks inlined and every local asset
embedded as a base64 data URI, then merges the JS bundle + CSS into a single
HTML document. The result (site-single-file.html) contains 100% of the site's
logic, styles and images and can be opened or deployed as one file.

Usage: python3 scripts/inline_single_file.py [output.html]
"""
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'site-single-file.html')
DIST = os.path.join(ROOT, '.single-file-dist')


def strip_css_comments(css):
    """Remove /* ... */ comments while skipping data URIs (base64 may contain '/*')."""
    out, i = [], 0
    while i < len(css):
        if css.startswith('data:', i):
            j = i
            while j < len(css) and css[j] not in ' ;)"\'':
                j += 1
            out.append(css[i:j])
            i = j
        elif css.startswith('/*', i):
            end = css.find('*/', i + 2)
            i = len(css) if end == -1 else end + 2
        else:
            out.append(css[i])
            i += 1
    return ''.join(out)


def main():
    print('[1/4] Building production bundle (all chunks inlined)...')
    env = dict(os.environ)
    env['VITE_CONFIG_NATIVE_IGNORE_WARNING'] = 'true'
    subprocess.run(
        ['npm', 'run', 'build', '--', '--outDir', '.single-file-dist',
         '--emptyOutDir', '--minify', 'esbuild'],
        cwd=ROOT, check=True, env=env)

    html = open(os.path.join(DIST, 'index.html'), encoding='utf-8').read()

    print('[2/4] Inlining stylesheets...')

    def repl_css(m):
        p = os.path.normpath(os.path.join(DIST, m.group(1).lstrip('./')))
        css = open(p, encoding='utf-8').read()
        os.remove(p)
        return '<style>' + strip_css_comments(css) + '</style>'

    html = re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', repl_css, html)

    print('[3/4] Inlining script bundle...')

    def repl_js(m):
        p = os.path.normpath(os.path.join(DIST, m.group(1).lstrip('./')))
        code = open(p, encoding='utf-8').read()
        os.remove(p)
        return '<script type="module">' + code.replace('</script>', '<\\/script>') + '</script>'

    html = re.sub(r'<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*></script>', repl_js, html)

    print('[4/4] Verifying self-containment...')
    leftovers = [f for d, _, fs in os.walk(DIST) for f in fs if f != 'index.html']
    if leftovers:
        raise SystemExit(f'Unexpected files left in dist: {leftovers}')
    # Static markup (before the inline script) must have zero relative references;
    # dynamic src strings inside the JS are runtime URLs (map tiles, auth popups).
    head = html[:html.index('<script type="module">')]
    ext = re.findall(r'(?:src|href)="(?!#|data:|https?://)([^"]+)"', head)
    if ext:
        raise SystemExit(f'Refusing to emit single file; external refs remain: {ext}')
    shutil.rmtree(DIST, ignore_errors=True)

    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'DONE: {OUT} ({os.path.getsize(OUT)/1e6:.2f} MB, fully self-contained)')


if __name__ == '__main__':
    main()
