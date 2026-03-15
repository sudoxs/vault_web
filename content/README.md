---
title: "Vault — Getting Started"
layout: default
---

# Getting Started

Drop files into `/content` and they appear in the sidebar automatically.

## Front matter

Every `.md` file needs this at the top:

```yaml
---
title: "My Note"
layout: default
---
```

---

## Linking between files

### Link to another Markdown page

Use relative paths from the current file's location:

```markdown
[Go to GitHub notes](../git/GitHub.md)
[Go to a sibling file](./other-note.md)
```

### Link to an image or file inside `/content`

```markdown
![My screenshot](./screenshot.png)
[Download this script](./my-script.sh)
```

If the file is in a different folder:

```markdown
![Logo](../media/logo.png)
[See the report](../reports/q1.pdf)
```

### Link to a root page

```markdown
[Home](/)
[Map](/map/)
```

---

## Supported file types

| Type | What you see |
|---|---|
| `.md` | Rendered as a full page |
| `.png` `.jpg` `.gif` `.webp` `.svg` | Image preview |
| `.mp4` `.webm` `.mov` | Video player |
| `.mp3` `.ogg` `.wav` `.flac` | Audio player |
| `.pdf` | Download / browser preview |
| `.txt` `.sh` `.py` `.json` etc. | Download link |
| `.zip` `.tar.gz` | Download link |

### Embedding media inside Markdown

```markdown
![Alt text](./screenshot.png)

<video controls src="./demo.mp4"></video>

<audio controls src="./clip.mp3"></audio>
```

---

## Folder structure example

```
content/
├── README.md
├── notes/
│   ├── linux.md
│   └── windows.md
├── tools/
│   ├── scanner.md
│   └── scanner.py
└── media/
    ├── demo.mp4
    └── screenshot.png
```

To link from `notes/linux.md` to `tools/scanner.py`:

```markdown
[Download the scanner](../tools/scanner.py)
```

To embed an image from `media/` inside `notes/linux.md`:

```markdown
![Network diagram](../media/screenshot.png)
```
