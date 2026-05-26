# 🔐 RootLock — Know Your Weakness Before They Do

> Real-time password intelligence from the depths of the terminal.

[![RootLock Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://rootlock.netlify.app)

> 📸 *Replace the thumbnail above with your actual YouTube demo link once uploaded*

🚀 **[Live Site](https://rootlock.netlify.app)**

---

## 🛡️ About RootLock

**RootLock** is a browser-based password strength analyzer built to help users understand exactly how secure — or vulnerable — their passwords really are.

Most people pick passwords they think are strong. RootLock tears that assumption apart with real metrics: entropy in bits, estimated crack time across different attack scenarios, and a strength rating that updates character by character as you type. The interface is built around a cyberpunk terminal aesthetic — dark, precise, and a little intimidating — because password security should feel serious.

No data is sent anywhere. Everything runs entirely in your browser, client-side, with no server, no storage, and no tracking.

---

## ✨ Features

- ⚡ **Real-Time Strength Checking** — Instant feedback as you type, no submit button needed
- 🧮 **Entropy Display** — Shows password entropy in bits so you understand *why* it's weak or strong
- ⏱️ **Crack Time Estimation** — Estimates how long it would take to brute-force your password
- 🎨 **Cyberpunk UI** — Terminal-inspired dark interface with glowing accents and monospace typography
- 🔒 **100% Client-Side** — Your password never leaves your browser

---

## 🛠️ Tech Stack

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)

| Technology | Purpose |
|------------|---------|
| **HTML5** | Page structure and semantic markup |
| **CSS3** | Cyberpunk theming, animations, and responsive layout |
| **Vanilla JavaScript** | Entropy calculation, crack time estimation, real-time DOM updates |
| **Netlify** | Deployment and global CDN hosting |

> No frameworks. No libraries. No dependencies. Pure HTML/CSS/JS — intentionally lightweight and self-contained.

---

## 🚀 Getting Started

### Prerequisites

```bash
# Just Git — no build tools or package managers needed
git --version
```

### Clone & Run

```bash
# 1. Clone the repository
git clone https://github.com/AtharvaK-XD/rootlock.git

# 2. Move into the project folder
cd rootlock

# 3. Open directly in browser
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows

# OR run a local server (recommended)
python -m http.server 8000
# Open: http://localhost:8000
```

**Alternative local server options:**

```bash
# Using Node.js
npx serve .
# Open: http://localhost:3000

# Using VS Code
# Right-click index.html → "Open with Live Server"
```

---

## 📦 Deployment

### Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Authenticate
netlify login

# Deploy to production
netlify deploy --prod --dir .
```

### Netlify Dashboard (No CLI)

1. Fork this repo on GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
3. Select your fork
4. Set **publish directory** to `.` (root) — leave build command empty
5. Click **Deploy**

### GitHub Pages (Alternative)

```bash
# Push to GitHub, then:
# Settings → Pages → Source: main branch → / (root) → Save
```

---

## 🤝 Contributing

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/rootlock.git
cd rootlock

git checkout -b feature/your-feature-name

# Make your changes, then:
git add .
git commit -m "feat: your change description"
git push origin feature/your-feature-name

# Open a Pull Request on GitHub
```

---

## 📌 Disclaimer

RootLock is a **portfolio project** built for educational purposes. It does not store, transmit, or log any passwords entered. All analysis happens locally in your browser.

---

## 📄 License

Open and free for inspiration. Feel free to explore, fork, and build on the idea.

---

<div align="center">
  <p>Built with ☕ and a paranoia for weak passwords by <a href="https://github.com/AtharvaK-XD">@AtharvaK-XD</a></p>
</div>
