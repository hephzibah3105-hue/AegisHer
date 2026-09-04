### 🚀 How to Install & Run AegisHer
1. Download the `AegisHer.zip` file below and extract/unzip it.
```bash
https://github.com/hephzibah3105-hue/AegisHer/releases/download/v1.0.0/AegisHer-main.zip
```
2. Open Google Chrome and go to `chrome://extensions/`.
3. In the top-right corner, toggle **Developer mode** ON.
4. Click **Load unpacked** (top-left corner).
5. Select the extracted folder containing `manifest.json`.# 🛡️ AegisHer — AI-Powered Digital Safety Guardian & Threat Intelligence Engine

> A privacy-first, client-side browser extension and digital forensics suite engineered to detect cyber-threats, prevent sextortion and coercive blackmail, intercept phishing gateways, analyze synthetic deepfakes in real-time, and automatically preserve cryptographic evidence for women and vulnerable internet users.

---

## 📌 Problem Statement & Overview

Digital abuse, non-consensual intimate image (NCII) blackmail, deepfake weaponization, cyberstalking, and credential harvesting are escalating at unprecedented rates. Traditional web security shields focus almost exclusively on network malware and signature-based antivirus scanning, leaving users unprotected against **social engineering, coercive manipulation, synthetic media fabrication, and targeted harassment**.

**AegisHer** bridges this defense gap by combining on-device NLP inference, discrete signal-processing media forensics, live global cyber threat intelligence, and zero-knowledge identity auditing directly inside the browser runtime:
* **Pre-Navigation Phishing Intervention:** Evaluates URL entropy, IP gateways, and deceptive patterns before page navigation occurs.
* **On-Device NLP Threat Classification:** Scans dynamic chats and social feeds for sextortion, stalking, and harassment via a local Bayesian engine without cloud exfiltration.
* **Client-Side Deepfake & Synthetic Forensics:** Decomposes uploaded media via HTML5 Canvas signal extraction (spatial Laplacian edge energy, chromatic channel divergence, high-frequency noise residuals).
* **Live Global Threat Intelligence Stream:** Ingests live threat corpora from the **CISA Known Exploited Vulnerabilities (KEV)** database and **HaveIBeenPwned (HIBP)** feeds with dynamic regional risk modeling.
* **Zero-Knowledge Identity Shield:** Audits exposed credentials using SHA-1 k-anonymity models without transmitting plaintext identifiers.
* **Tamper-Proof Evidence Vault:** Stores incident DOM snapshots, timestamps, and threat scores in isolated local storage with cryptographic integrity validation.

---

## ⚙️ Core Architecture & Feature Matrix

### 1. 🧠 On-Device NLP & Threat Interception (`content.js`, `train_model.py`)
* **DOM Mutation Observer:** Monitors dynamic messaging platforms (Instagram, WhatsApp Web, Telegram, Twitter/X) in real time.
* **Local Bayesian Threat Classifier:** Evaluates text against `threat_model.json` across multi-class vectors (*Sextortion / NCII*, *Cyberstalking / Doxxing*, *Financial Phishing / Coercion*).
* **Zero-Latency Intervention:** Halts malicious link navigation on click and triggers instant visual risk warnings.

### 2. 🔬 Real-Time Deepfake & Media Forensics Engine (`dashboard.js`)
* **Spatial Laplacian Edge Gradient:** Computes high-pass luminance transitions across boundary seams to detect unnatural edge blending and smoothing.
* **Spectral RGB Channel Divergence:** Calculates chromatic disparity across color channels to detect generative lighting inconsistencies.
* **High-Pass Residual Noise Steganalysis:** Measures high-frequency pixel residue density to distinguish camera sensor noise from synthetic GAN checkerboard artifacts.
* **Interactive Diagnostic Modes:** Supports live image file upload, drag-and-drop raster extraction, and standardized baseline sample evaluations.

### 3. 🌐 Global Cyber Threat Intelligence & Trend Matrix (`dashboard.js`)
* **Live Feed Streaming:** Directly ingests and parses live telemetry from `haveibeenpwned.com/api/v3/breaches` and `cisa.gov/.../known_exploited_vulnerabilities.json`.
* **Dynamic Regional Scaling:** Computes weighted threat density across regions (*Global Aggregate*, *Asia-Pacific [APAC]*, *North America [NA]*, *Europe & UK [EU]*).
* **Platform-Level Vector Decomposition:** Maps live Indicators of Compromise (IoCs) across communication vectors (*Instagram*, *Twitter/X*, *Telegram*, *WhatsApp*, *Web/Forums*).

### 4. 🔍 Zero-Knowledge Identity Shield (`dashboard.js`)
* **SHA-1 k-Anonymity Hash Ingestion:** Queries breach corpuses using truncated cryptographic hash prefixes to guarantee zero plaintext transmission of user email addresses or usernames.
* **Risk Breakdown & Remediation:** Displays compromised account volume, breach source lineage, and direct security remediation steps.

### 5. 🗄️ Cryptographic Evidence Vault (`vault/`)
* **Automated Incident Logging:** Records incident timestamps, source URLs, threat classifications, confidence scores, and raw message contexts.
* **Tamper-Proof Verification:** Prepares forensic incident metadata for cyber cell and legal reporting.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Extension Framework** | Chrome Extensions Manifest V3 (MV3) | Background service workers, non-persistent event architecture |
| **Frontend & UI** | Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3 Glassmorphism UI | Responsive dashboard, pixel raster manipulation, real-time heatmaps |
| **Forensic Signal Engine** | Discrete Laplacian & RGB Luminance Filter Algorithms | Real-time synthetic image & deepfake manipulation scoring |
| **Threat Intelligence Feeds** | CISA KEV JSON API, HaveIBeenPwned API (HIBP) | Live Indicators of Compromise (IoCs) and public breach telemetry |
| **AI / NLP Engine** | Custom Log-Likelihood Naive Bayes (`train_model.py` → `threat_model.json`) | On-device text threat classification and coercive intent detection |
| **Security & Privacy** | SHA-1 k-Anonymity, Zero Cloud Exfiltration | 100% Client-side local execution and private credential auditing |

---

## 📁 Project Directory Structure

```text
AegisHer/
├── manifest.json              # MV3 Configuration, permissions, content script declarations
├── background.js              # Service worker handling alerts, badges, and lifecycle events
├── content.js                 # Active DOM observer, real-time text analysis & link guard
├── content.css                # Security warning overlays and detection toast styling
├── icon.png                   # Extension identity icon
├── threat_model.json          # Serialized log-likelihood Bayesian model weights
├── train_model.py             # Python training script to compile and update threat_model.json
├── test.html                  # Local defensive testing sandbox for validation
├── dashboard/
│   ├── dashboard.html         # Interactive dashboard (Matrix, Deepfake Detector, Identity Shield)
│   ├── dashboard.css          # Glassmorphism cyber-defense theme styles
│   └── dashboard.js           # Signal forensics, telemetry fetchers, and heatmap rendering
├── popup/
│   ├── popup.html             # Quick-access extension status popup
│   ├── popup.css              # Compact popup styling
│   └── popup.js               # Status indicators and navigation links
└── vault/
    ├── vault.html             # Forensic Evidence Vault archive interface
    ├── vault.css              # Archive list and report styling
    ├── vault.js               # Local storage retrieval, incident verification, and export
    └── jspdf.umd.min.js       # Client-side legal document generation library
```

---

## 🚀 Installation & Setup Guide

### Step 1: Clone the Repository
```bash
git clone [https://github.com/hephzibah3105-hue/AegisHer.git](https://github.com/hephzibah3105-hue/AegisHer.git)
cd AegisHer
```

## 🧪 Comprehensive Feature Walkthrough & Verification

### 1. Live Threat Sandbox Testing (`test.html`)
Open `test.html` in Google Chrome to test defensive protections in a controlled environment:
* **Pre-Navigation Link Interception:** Click the simulated malicious link. AegisHer intercepts navigation and renders a full-screen warning modal.
* **Sextortion & Coercion Detection:** Refresh `test.html`. The on-page content script analyzes the text blocks and displays a high-threat toast alert in the bottom-right corner.
* **Automatic Vaulting:** Open the extension popup $\rightarrow$ **Open Evidence Vault** to confirm the detected extortion incident was recorded with full metadata.

```html
<!-- test.html Sandbox Code -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AegisHer Security Sandbox</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c0d14; color: #e1e3ec; padding: 40px; margin: 0; }
    h1 { color: #fff; margin-bottom: 24px; }
    .card { background: #151722; border: 1px solid #282c3f; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
    .card h3 { color: #38bdf8; margin-top: 0; }
    .danger-link { color: #ff3366; font-weight: bold; text-decoration: underline; cursor: pointer; }
    .threat-box { background: rgba(255, 51, 102, 0.08); border-left: 4px solid #ff3366; padding: 12px 16px; border-radius: 4px; font-style: italic; color: #ffb4c8; }
  </style>
</head>
<body>
  <h1>🛡️ AegisHer AI Defense Sandbox</h1>
  
  <div class="card">
    <h3>Test 1: Suspicious URL Intervention</h3>
    <a href="[http://192.168.1.1/login-verify-account-update.xyz](http://192.168.1.1/login-verify-account-update.xyz)" class="danger-link">
      [http://192.168.1.1/login-verify-account-update.xyz](http://192.168.1.1/login-verify-account-update.xyz) (Simulated Malicious Gateway)
    </a>
  </div>

  <div class="card">
    <h3>Test 2: Sextortion & NCII Blackmail Detection</h3>
    <div class="threat-box">"Send me your private photos or I will expose you online and ruin your life."</div>
  </div>

  <div class="card">
    <h3>Test 3: Cyberstalking & Physical Threat Detection</h3>
    <div class="threat-box">"I know where you live and I have been watching your house every night."</div>
  </div>
</body>
</html>
```

### 2. Deepfake & Synthetic Media Forensics Testing
1. Navigate to the AegisHer Dashboard (`dashboard/dashboard.html`).
2. Scroll to the **Deepfake & Synthetic Media Detector** module.
3. **Live File Evaluation:** Drag and drop any `.png`, `.jpg`, or `.webp` file into the upload zone.
4. **DevTools Verification:** Open DevTools (`Ctrl + Shift + I` $\rightarrow$ **Console** tab) to inspect the computed signal values:
   * `avgLaplacian`: Spatial edge gradient and seam discontinuity.
   * `avgChromatic`: Cross-channel RGB divergence.
   * `noiseDensity`: High-frequency residual noise matrix.
5. **Preset Baselines:** Use **Load Deepfake Sample** (94% synthetic alert) and **Load Authentic Sample** (7%-8% natural verification) for rapid demonstrations.

### 3. Live Threat Stream & Heatmap Verification
1. On the Dashboard, view the **Global Cyber Threat Intelligence & Trend Matrix**.
2. Open DevTools $\rightarrow$ **Network** tab $\rightarrow$ filter by **Fetch/XHR** $\rightarrow$ refresh the page (`Ctrl + F5`).
3. Verify live external API connectivity:
   * `https://haveibeenpwned.com/api/v3/breaches` (Status `200 OK`)
   * `https://www.cisa.gov/.../known_exploited_vulnerabilities.json` (Status `200 OK`)
4. Switch regions in the dropdown selector (*APAC*, *EU*, *NA*) to verify dynamic threat-score recalculation and risk-tag transitions.

---

## 🔒 Privacy & Safety Compliance

* **Zero Cloud Exfiltration:** All natural language processing, regex scanning, and deepfake image analysis are executed 100% locally in the client runtime.
* **k-Anonymity Identity Ingestion:** Identity auditing uses truncated cryptographic prefixes, preventing full email addresses from ever being transmitted across the network.
* **Tamper-Resistant Local Storage:** Incident metadata and evidence logs remain exclusively on the user's local disk until explicitly exported.
* **Non-Invasive Architecture:** Lightweight signal heuristics preserve system performance without loading heavy multi-gigabyte models into browser memory.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more details.
