#!/usr/bin/env python3
"""
Vault Setup — Interactive site customizer
Supports: GitHub Pages and self-hosted (Nginx/Apache)
"""

import os
import re
import sys
import shutil
import textwrap

# ---- helpers ----

def bold(s):  return f"\033[1m{s}\033[0m"
def cyan(s):  return f"\033[96m{s}\033[0m"
def green(s): return f"\033[92m{s}\033[0m"
def yellow(s):return f"\033[93m{s}\033[0m"
def red(s):   return f"\033[91m{s}\033[0m"
def dim(s):   return f"\033[2m{s}\033[0m"

def ask(prompt, default=""):
    marker = f"  {dim(f'[{default}]') if default else ''} "
    try:
        val = input(f"{cyan('?')} {prompt}{marker}").strip()
    except (EOFError, KeyboardInterrupt):
        print()
        sys.exit(0)
    return val or default

def choose(prompt, options, default=None):
    print(f"\n{cyan('?')} {prompt}")
    for i, (key, label) in enumerate(options, 1):
        mark = green("▶") if default and key == default else " "
        print(f"  {mark} {bold(str(i))}) {label}")
    while True:
        raw = ask("Enter number", str(next((i for i,(k,_) in enumerate(options,1) if k==default), 1)))
        try:
            idx = int(raw) - 1
            if 0 <= idx < len(options):
                return options[idx][0]
        except ValueError:
            pass
        print(red("  Invalid choice, try again."))

def multichoose(prompt, options):
    print(f"\n{cyan('?')} {prompt}")
    print(dim("  Enter numbers separated by commas, or 'all'"))
    for i, (key, label) in enumerate(options, 1):
        print(f"  {bold(str(i))}) {label}")
    while True:
        raw = ask("Your selection", "all").lower()
        if raw == "all":
            return [k for k,_ in options]
        try:
            indices = [int(x.strip())-1 for x in raw.split(",")]
            if all(0 <= i < len(options) for i in indices):
                return [options[i][0] for i in indices]
        except ValueError:
            pass
        print(red("  Invalid, try again."))

def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(green(f"  ✓ Updated {path}"))

def set_yml(content, key, value):
    pattern = rf'^({re.escape(key)}:\s*).*$'
    replacement = f'{key}: "{value}"'
    new, n = re.subn(pattern, replacement, content, flags=re.MULTILINE)
    if n == 0:
        new = content + f'\n{key}: "{value}"\n'
    return new

# ---- sections ----

SECTIONS = [
    ("title",       "Site title & tagline"),
    ("description", "Site description"),
    ("author",      "Author name"),
    ("urls",        "URL & baseurl (deployment paths)"),
    ("github",      "GitHub profile link"),
    ("footer",      "Footer text"),
    ("side_panels", "Side panel labels (SYSTEM / ACCESS)"),
    ("robots",      "Search engine indexing (robots)"),
    ("security",    "Security headers file (for self-hosted)"),
]

def section_title(config, section):
    if section == "title":
        title   = ask("Site title",   config.get("title", "MyVault"))
        tagline = ask("Tagline",      config.get("tagline", "Personal Knowledge Vault"))
        config["title"]   = title
        config["tagline"] = tagline

    elif section == "description":
        desc = ask("Description", config.get("description", "A personal vault of notes and files."))
        config["description"] = desc

    elif section == "author":
        author = ask("Author name", config.get("author", ""))
        config["author"] = author

    elif section == "urls":
        deploy = config.get("_deploy_mode", "github")
        if deploy == "github":
            username = ask("GitHub username", "yourusername")
            reponame = ask("Repo name (= baseurl, e.g. vault)", "vault")
            config["url"]     = f"https://{username}.github.io"
            config["baseurl"] = f"/{reponame}"
            print(yellow(f"  → Site will be at https://{username}.github.io/{reponame}"))
        else:
            domain  = ask("Domain (e.g. https://notes.example.com)", "https://notes.example.com")
            baseurl = ask("Baseurl (leave blank if root)", "")
            config["url"]     = domain.rstrip("/")
            config["baseurl"] = baseurl.rstrip("/") if baseurl else ""

    elif section == "github":
        gh = ask("GitHub profile URL", config.get("github_url", "https://github.com/yourname"))
        config["github_url"] = gh

    elif section == "footer":
        print(dim("  The footer shows: description, links, and copyright."))
        author = ask("Copyright name (shown in footer)", config.get("author", config.get("title", "Me")))
        config["author"] = author

    elif section == "side_panels":
        left_title  = ask("Left panel title",  "SYSTEM")
        left_text   = ask("Left panel text",   "ONLINE")
        right_title = ask("Right panel title", "ACCESS")
        right_text  = ask("Right panel text",  "GRANTED")
        config["side_left_title"]  = left_title
        config["side_left_text"]   = left_text
        config["side_right_title"] = right_title
        config["side_right_text"]  = right_text

    elif section == "robots":
        choice = choose("Search engine indexing", [
            ("index, follow",   "Public — allow all crawlers"),
            ("noindex, follow", "Unlisted — block indexing"),
            ("noindex, nofollow", "Private — block everything"),
        ], default="index, follow")
        config["robots"] = choice

    elif section == "security":
        print(dim("  Security header files are only relevant for self-hosted deployments."))
        if config.get("_deploy_mode") == "self":
            generate_security_files(config)
        else:
            print(yellow("  Skipped — GitHub Pages doesn't support custom server headers."))
            print(yellow("  Deploy mode is GitHub Pages. Switch to self-hosted to generate configs."))

def parse_yml(path):
    """Very basic YAML key extractor — enough for flat _config.yml"""
    result = {}
    if not os.path.exists(path):
        return result
    for line in read_file(path).splitlines():
        m = re.match(r'^(\w[\w_]*):\s*["\']?([^"\'#\n]+?)["\']?\s*$', line.strip())
        if m:
            result[m.group(1)] = m.group(2).strip()
    return result

def apply_to_yml(config, yml_path):
    content = read_file(yml_path)
    fields = ["title","tagline","description","author","url","baseurl","github_url","robots"]
    for key in fields:
        if key in config:
            content = set_yml(content, key, config[key])
    write_file(yml_path, content)

def apply_side_panels(config, layout_path):
    if not any(k in config for k in ("side_left_title","side_left_text","side_right_title","side_right_text")):
        return
    content = read_file(layout_path)
    replacements = {
        "SYSTEM": config.get("side_left_title",  "SYSTEM"),
        "ONLINE": config.get("side_left_text",   "ONLINE"),
        "ACCESS": config.get("side_right_title", "ACCESS"),
        "GRANTED":config.get("side_right_text",  "GRANTED"),
    }
    for old, new in replacements.items():
        content = content.replace(f">{old}<", f">{new}<")
    write_file(layout_path, content)

# ---- security file generation ----

def generate_security_files(config):
    domain  = config.get("url", "https://example.com")
    baseurl = config.get("baseurl", "")
    path    = (baseurl + "/") if baseurl else "/"
    csp = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none';"
    )

    nginx_conf = textwrap.dedent(f"""\
        # Nginx security config — generated by vault setup.py
        # Place this inside your server {{ }} block

        location {path} {{
            root /var/www/vault/_site;
            index index.html;
            try_files $uri $uri/ $uri.html =404;

            # Security headers
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-Content-Type-Options "nosniff" always;
            add_header Referrer-Policy "strict-origin-when-cross-origin" always;
            add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
            add_header Content-Security-Policy "{csp}" always;
            add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

            # Static file caching
            location ~* \\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$ {{
                expires 30d;
                add_header Cache-Control "public, immutable";
            }}

            # Block dotfiles
            location ~ /\\. {{
                deny all;
                return 404;
            }}

            error_page 404 {path}404.html;
        }}
    """)

    apache_conf = textwrap.dedent(f"""\
        # Apache .htaccess — generated by vault setup.py
        # Place at the root of your deployed _site/

        Options -Indexes -MultiViews
        DirectoryIndex index.html

        # Security headers
        <IfModule mod_headers.c>
            Header always set X-Frame-Options "SAMEORIGIN"
            Header always set X-Content-Type-Options "nosniff"
            Header always set Referrer-Policy "strict-origin-when-cross-origin"
            Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
            Header always set Content-Security-Policy "{csp}"
            Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
        </IfModule>

        # Cache static assets
        <IfModule mod_expires.c>
            ExpiresActive On
            ExpiresByType text/css "access plus 30 days"
            ExpiresByType application/javascript "access plus 30 days"
            ExpiresByType image/png "access plus 30 days"
            ExpiresByType image/jpeg "access plus 30 days"
            ExpiresByType image/webp "access plus 30 days"
        </IfModule>

        # Block dotfiles
        <FilesMatch "^\\.">
            Order allow,deny
            Deny from all
        </FilesMatch>

        # Custom 404
        ErrorDocument 404 {path}404.html
    """)

    write_file("nginx.conf.example", nginx_conf)
    write_file(".htaccess", apache_conf)
    print(green("  ✓ nginx.conf.example and .htaccess created"))
    print(dim("  → Deploy your _site/ folder and include these configs on your server."))

# ---- GitHub Pages specific ----

def github_pages_notes(config):
    username = config.get("url","").replace("https://","").replace(".github.io","")
    reponame = config.get("baseurl","").strip("/")
    print(textwrap.dedent(f"""
{bold('GitHub Pages deployment:')}
  1. Create a repo named {cyan(reponame)} on GitHub
  2. Push this project:
       git init
       git add .
       git commit -m "initial"
       git remote add origin https://github.com/{username}/{reponame}.git
       git push -u origin main
  3. Go to Settings → Pages → Source: main branch, / (root)
  4. Your site: {green(f'https://{username}.github.io/{reponame}')}

{bold('Security note for GitHub Pages:')}
  {yellow('GitHub Pages does not support custom HTTP headers.')}
  The meta-tag CSP in the layout provides partial protection.
  For full header control, use a self-hosted server.
"""))

def self_hosted_notes(config):
    print(textwrap.dedent(f"""
{bold('Self-hosted deployment:')}
  1. Build the site:  jekyll build
  2. Copy _site/ to your server:
       rsync -avz _site/ user@yourserver:/var/www/vault/
  3. Point Nginx/Apache at /var/www/vault/
  4. Include the generated nginx.conf.example or .htaccess
  5. Enable HTTPS with Certbot:
       certbot --nginx -d yourdomain.com

{bold('Security checklist:')}
  {green('✓')} Security headers generated in nginx.conf.example / .htaccess
  {green('✓')} Dotfile blocking included
  {green('✓')} HSTS header included
  {yellow('→')} Enable HTTPS (required for HSTS to work)
  {yellow('→')} Keep Jekyll and Ruby gems updated
  {yellow('→')} Review Content-Security-Policy if you add external resources
"""))

# ---- main ----

def main():
    print(f"\n{bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}")
    print(f"   {bold('Vault')} — Site Setup & Customizer")
    print(f"{bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}\n")

    # Check we're in the right directory
    if not os.path.exists("_config.yml"):
        print(red("Error: _config.yml not found."))
        print(red("Run this script from the root of your vault project."))
        sys.exit(1)

    # Step 1: deployment mode
    deploy_mode = choose("How will you deploy this site?", [
        ("github", "GitHub Pages  (free, automatic, limited header control)"),
        ("self",   "Self-hosted server  (Nginx / Apache, full control)"),
    ])

    current = parse_yml("_config.yml")
    current["_deploy_mode"] = deploy_mode

    # Step 2: which sections to customize
    sections = multichoose("Which sections do you want to customize?", SECTIONS)

    print(f"\n{bold('Let\'s fill in the details:')}\n")

    # Step 3: run each section
    for section in sections:
        label = next(l for k,l in SECTIONS if k == section)
        print(f"\n{bold('── ' + label + ' ──')}")
        section_title(current, section)

    # Step 4: apply changes
    print(f"\n{bold('── Applying changes ──')}")
    apply_to_yml(current, "_config.yml")
    apply_side_panels(current, "_layouts/default.html")

    # Step 5: deployment-specific output
    print(f"\n{bold('── Deployment instructions ──')}")
    if deploy_mode == "github":
        github_pages_notes(current)
    else:
        if "security" not in sections:
            # Always generate for self-hosted
            generate_security_files(current)
        self_hosted_notes(current)

    print(f"\n{green('All done!')} Run {cyan('jekyll serve')} to preview locally.\n")

if __name__ == "__main__":
    main()
