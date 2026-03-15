# Vault

<p align="center">
  <img src="https://img.shields.io/badge/Jekyll-static-red?style=flat-square" alt="Jekyll">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT">
  <img src="https://img.shields.io/badge/GitHub%20Pages-ready-brightgreen?style=flat-square" alt="GitHub Pages">
  <img src="https://img.shields.io/badge/self--hosted-ready-orange?style=flat-square" alt="Self-hosted">
</p>

<p align="center">
  A minimal, dark-themed Jekyll site for publishing personal notes, write-ups, and files.<br>
  Drop Markdown into <code>/content</code>, run one command, and you have a searchable vault.
</p>

---

## Table of Contents / 目次

- [English](#english)
- [日本語](#日本語)

---

# English

## Features

- **Zero-config content** — drop any file into `/content`, it appears in the sidebar
- **Full-text search** — indexed at build time, no server or database needed
- **Media support** — images, video, audio, PDFs all rendered or linked automatically
- **Interactive setup** — one Python script handles all customization and generates server configs
- **Dual deployment** — works on GitHub Pages and self-hosted servers (Nginx / Apache)
- **Security-first** — security headers, CSP, HSTS, dotfile blocking generated automatically
- **Dark theme** — clean hacker aesthetic with ambient glow effects
- **Responsive** — works on mobile, tablet, and desktop

## Quick Start

**Requirements:** Ruby >= 3.0, Jekyll >= 4.0, Python >= 3.8

```bash
git clone https://github.com/sudoxs/vault.git
cd vault

python3 setup.py        # interactive customizer

gem install bundler jekyll

jekyll serve
# http://localhost:4000/vault
```

## Setup Script

`setup.py` is an interactive terminal wizard. Run it once before deploying.

```bash
python3 setup.py
```

It asks you:

1. **Deployment mode** — GitHub Pages or self-hosted server
2. **Which sections to customize** — you pick from a menu
3. **Section details** — title, description, author, URLs, GitHub link, footer, side panels, robots, security

Based on your choices it automatically:
- Patches `_config.yml`
- Updates side panel labels in the layout
- Generates `nginx.conf.example` and `.htaccess` (self-hosted only)
- Prints step-by-step deployment instructions

## Adding Content

Any file placed inside `/content` is automatically indexed and shown in the sidebar.

**Markdown pages** need front matter:

```yaml
---
title: "My Note"
layout: default
---

Your content here.
```

**Any other file** (images, scripts, PDFs, archives) just gets dropped in — no front matter needed.

### Supported media

| Extension | Displayed as |
|---|---|
| `.png` `.jpg` `.gif` `.webp` `.svg` | Inline image |
| `.mp4` `.webm` `.mov` `.ogv` | Video player |
| `.mp3` `.ogg` `.wav` `.flac` `.aac` | Audio player |
| `.pdf` | Browser preview / download |
| `.txt` `.sh` `.py` `.json` etc. | Download link |
| `.zip` `.tar.gz` `.rar` | Download link |

## Linking Between Files

Use **relative paths** from the current file's location. This works on both local and GitHub Pages.

```markdown
[See GitHub notes](../git/GitHub.md)
[Same folder file](./other.md)

![Screenshot](./screenshot.png)
![Image from another folder](../media/logo.png)

<video controls src="./demo.mp4"></video>
<audio controls src="./clip.mp3"></audio>

[Download script](../tools/scanner.py)
```

**Cross-folder example** — if your file is `content/notes/linux.md`:

```markdown
[Download tool](../tools/scanner.py)
![Network diagram](../media/network.png)
[Back to README](../README.md)
```

**Root site pages:**

```markdown
[Home](/)
[Map](/map/)
```

The `<base>` tag in the layout handles the base path automatically on both local and GitHub Pages.

## GitHub Pages Deployment

1. Create a GitHub repository (e.g. `vault`)
2. Set `_config.yml`:
   ```yaml
   url: "https://yourusername.github.io"
   baseurl: "/vault"
   ```
3. Push:
   ```bash
   git init && git add . && git commit -m "initial"
   git remote add origin https://github.com/yourusername/vault.git
   git push -u origin main
   ```
4. Settings → Pages → Source: main branch
5. Live at `https://yourusername.github.io/vault`

> **Note:** GitHub Pages does not support custom HTTP response headers. Meta-tag equivalents are included in the layout for partial protection. For full security header control, use self-hosted.

## Self-Hosted Deployment

```bash
jekyll build
rsync -avz _site/ user@yourserver:/var/www/vault/
```

Run `python3 setup.py`, choose **self-hosted**, enable **security** section. It generates:
- `nginx.conf.example` — Nginx server block with all headers
- `.htaccess` — Apache config with all headers

Then enable HTTPS:
```bash
certbot --nginx -d yourdomain.com
```

## Security

| Measure | GitHub Pages | Self-Hosted |
|---|---|---|
| X-Frame-Options | meta tag | HTTP header |
| X-Content-Type-Options | meta tag | HTTP header |
| Referrer-Policy | meta tag | HTTP header |
| Permissions-Policy | meta tag | HTTP header |
| Content-Security-Policy | meta tag | HTTP header |
| HSTS | GitHub enforces | generated |
| Dotfile blocking | not needed | generated |
| Static asset caching | automatic | generated |

**Recommendations:**
- Never commit secrets or private data to `/content` — the whole folder is public
- Keep Jekyll and gems updated: `bundle update`
- Use HTTPS in production
- Review the CSP in `setup.py` before adding any external resources (CDN, fonts, analytics)

## Project Structure

```
vault/
├── _config.yml
├── _layouts/
│   └── default.html
├── assets/
│   ├── css/site.css
│   ├── js/site.js
│   ├── img/
│   ├── map.html
│   └── search_index.json
├── content/
│   └── README.md
├── index.html
├── 404.html
├── setup.py
└── README.md
```

## Configuration Reference

| Key | Description | Example |
|---|---|---|
| `title` | Site name | `"MyVault"` |
| `tagline` | Sidebar subtitle | `"Personal Knowledge Vault"` |
| `description` | Meta description and hero text | `"A personal archive..."` |
| `author` | Name shown in footer copyright | `"sudoxs"` |
| `url` | Full domain | `"https://sudoxs.github.io"` |
| `baseurl` | Sub-path | `"/vault"` |
| `github_url` | GitHub profile link | `"https://github.com/sudoxs"` |
| `content_dir` | Content folder name | `"content"` |
| `robots` | Crawler directive | `"index, follow"` |

---

# 日本語

## 特徴

- **設定不要のコンテンツ管理** — `/content` にファイルを置くだけでサイドバーに自動表示
- **全文検索** — ビルド時にインデックス化。サーバーやDBは不要
- **メディア対応** — 画像・動画・音声・PDFを自動でプレビューまたはリンク
- **インタラクティブセットアップ** — Pythonスクリプト一つで全カスタマイズとサーバー設定生成
- **2種類のデプロイ** — GitHub PagesとNginx/Apacheの自己ホストに対応
- **セキュリティ重視** — セキュリティヘッダー、CSP、HSTS、ドットファイル制限を自動生成
- **ダークテーマ** — グロウエフェクト付きのクリーンなデザイン
- **レスポンシブ** — モバイル・タブレット・デスクトップ対応

## クイックスタート

**必要環境:** Ruby >= 3.0、Jekyll >= 4.0、Python >= 3.8

```bash
git clone https://github.com/sudoxs/vault.git
cd vault

python3 setup.py        # インタラクティブカスタマイザー

gem install bundler jekyll

jekyll serve
# http://localhost:4000/vault
```

## セットアップスクリプト

`setup.py` はターミナル上でインタラクティブに動作するウィザードです。デプロイ前に一度実行してください。

```bash
python3 setup.py
```

聞かれること:

1. **デプロイ方法** — GitHub Pages または 自己ホストサーバー
2. **カスタマイズするセクション** — メニューから選択
3. **各セクションの詳細** — タイトル、説明、作者、URL、GitHubリンク、フッター、サイドパネル、robots、セキュリティ

実行後:
- `_config.yml` を自動更新
- レイアウトのサイドパネルラベルを更新
- `nginx.conf.example` と `.htaccess` を生成（自己ホストのみ）
- デプロイ手順を表示

## コンテンツの追加

`/content` 以下に置いたファイルは自動でインデックスされ、サイドバーに表示されます。

**Markdownページ**にはフロントマターが必要:

```yaml
---
title: "ノートのタイトル"
layout: default
---

ここにMarkdownを書く。
```

**その他のファイル**（画像・スクリプト・PDF・アーカイブ）はそのまま置くだけ。フロントマター不要。

### 対応メディア

| 拡張子 | 表示 |
|---|---|
| `.png` `.jpg` `.gif` `.webp` `.svg` | インライン画像 |
| `.mp4` `.webm` `.mov` | 動画プレーヤー |
| `.mp3` `.ogg` `.wav` `.flac` | 音声プレーヤー |
| `.pdf` | ブラウザプレビュー / ダウンロード |
| `.txt` `.sh` `.py` `.json` など | ダウンロードリンク |
| `.zip` `.tar.gz` | ダウンロードリンク |

## ファイル間のリンク

現在のファイルからの**相対パス**で記述します。ローカルでもGitHub Pagesでもそのまま動きます。

```markdown
[Gitノートを見る](../git/GitHub.md)
[同じフォルダのノート](./other.md)

![スクリーンショット](./screenshot.png)
![別フォルダの画像](../media/logo.png)

<video controls src="./demo.mp4"></video>
<audio controls src="./recording.mp3"></audio>

[スクリプトをダウンロード](../tools/scanner.py)
```

**フォルダをまたぐ例** — `content/notes/linux.md` から:

```markdown
[ツールをダウンロード](../tools/scanner.py)
[図を表示](../media/network.png)
[READMEに戻る](../README.md)
```

**サイトルートページへのリンク:**

```markdown
[ホーム](/)
[マップ](/map/)
```

レイアウト内の `<base>` タグがベースパスを自動処理します。

## GitHub Pagesへのデプロイ

1. GitHubにリポジトリを作成（例: `vault`）
2. `_config.yml` を設定:
   ```yaml
   url: "https://yourusername.github.io"
   baseurl: "/vault"
   ```
3. プッシュ:
   ```bash
   git init && git add . && git commit -m "initial"
   git remote add origin https://github.com/yourusername/vault.git
   git push -u origin main
   ```
4. Settings → Pages → Source: main ブランチ
5. `https://yourusername.github.io/vault` で公開完了

> **注意:** GitHub PagesはカスタムHTTPヘッダーに対応していません。レイアウト内のmetaタグで部分的な保護が行われますが、完全なヘッダー制御には自己ホストサーバーが必要です。

## 自己ホストのデプロイ

```bash
jekyll build
rsync -avz _site/ user@yourserver:/var/www/vault/
```

`python3 setup.py` を実行し **自己ホスト** を選択。**セキュリティ** セクションを有効にすると自動生成:
- `nginx.conf.example` — 全ヘッダー設定済みのNginxサーバーブロック
- `.htaccess` — 全ヘッダー設定済みのApache設定

HTTPS化:
```bash
certbot --nginx -d yourdomain.com
```

## セキュリティ

| 対策 | GitHub Pages | 自己ホスト |
|---|---|---|
| X-Frame-Options | metaタグ | HTTPヘッダー |
| X-Content-Type-Options | metaタグ | HTTPヘッダー |
| Referrer-Policy | metaタグ | HTTPヘッダー |
| Content-Security-Policy | metaタグ | HTTPヘッダー |
| HSTS | GitHub側が対応 | 生成済み |
| ドットファイル制限 | 不要 | 生成済み |

**推奨事項:**
- `/content` に秘密情報を絶対に置かないこと（フォルダ全体が公開される）
- Jekyllとgemを定期的に更新: `bundle update`
- 本番環境では必ずHTTPS使用
- 外部リソースを追加する場合は `setup.py` 内のCSPを見直すこと

---

<p align="center">
  Built by <a href="https://github.com/sudoxs">sudoxs</a> · MIT License
</p>
