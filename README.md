# 🛡️ AegisHer — AI-Powered Digital Safety Guardian

> A proactive, privacy-first AI browser extension engineered to detect cyber-threats, prevent sextortion/blackmail, block phishing traps, and automatically preserve cryptographic evidence for women and vulnerable internet users.

---

## 📌 Problem Statement & Overview

Digital abuse, non-consensual image blackmail (sextortion), cyberstalking, and credential harvesting are escalating at unprecedented rates. Traditional web security shields focus primarily on network malware, leaving users unprotected against **social engineering, coercive manipulation, and targeted online harassment**.

**AegisHer** bridges this critical defense gap by deploying on-device AI inference and heuristic security mechanisms to:
* **Scan and Intercept Phishing & Malicious URLs** before page navigation.
* **Detect Sextortion & Coercive Threats in Real-Time** using a local Bayesian NLP classification engine.
* **Automatically Capture & Vault Forensic Evidence** (DOM snapshots, timestamps, URLs, visual screen evidence) without manual user intervention.
* **Generate Legal-Ready Forensic Incident Reports** formatted for cybercrime reporting.

---

## ⚙️ Key Features

* 🛡️ **Active AI Shield:** Real-time DOM observer monitoring dynamic chats, messages, and social media interfaces for abusive and extortionist patterns.
* 🛑 **Pre-Navigation Intervention:** Evaluates link safety on hover and halts navigation to high-risk URLs with a full-screen warning modal.
* 🧠 **On-Device ML Engine:** Local NLP threat classification model (`threat_model.json`) trained on multi-category attack vectors without sending private user data to third-party servers.
* 📸 **Automated Evidence Vault:** Instantly stores incident metadata and visual captures in local isolated extension storage.
* 📄 **Forensic Incident Export:** Generates standardized `.txt` evidence digests for cyber cell documentation.
* 📊 **Security Dashboard & Identity Shield:** Provides breach analysis, social media exposure risk indicators, and deepfake inspection modules.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Extension Framework** | Chrome Extensions Manifest V3 (MV3) |
| **Frontend & UI** | Vanilla JavaScript (ES6+), HTML5, CSS3 Glassmorphism UI |
| **AI / NLP Engine** | Custom Log-Likelihood Naive Bayes Classifier (`train_model.py` → `threat_model.json`) |
| **Background Services** | MV3 Service Workers (`background.js`), Chrome Storage API, Tabs API |
| **Security & Privacy** | Zero Cloud Exfiltration, 100% Client-Side Local Execution |

---

## 🚀 Installation & Setup Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/hephzibah3105-hue/AegisHer.git
cd AegisHer
```

### Step 2: (Optional) Train or Update the AI Model
To train the model on updated datasets or custom threat categories:

``` Bash
python train_model.py
```

This compiles and generates the updated threat_model.json artifact directly inside the extension root.

### Step 3: Load the Extension into Google Chrome

Open Google Chrome and navigate to chrome://extensions/.

Enable Developer mode using the toggle switch in the top-right corner.

Click the Load unpacked button in the top-left corner.

Select the root AegisHer project folder.

The AegisHer — AI Cybersecurity Guardian extension will appear with its shield active in your toolbar.

### 🧪 Testing the Extension (test.html)

To test every defensive feature in a safe environment, create a file named test.html on your desktop, paste the code below, and open it in Google Chrome.


test.html Sandbox Code

``` HTML
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AegisHer Security Sandbox</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c0d14; color: #e1e3ec; padding: 40px; margin: 0; }
    h1 { color: #fff; margin-bottom: 24px; }
    .card { background: #151722; border: 1px solid #282c3f; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
    .card h3 { color: #00ff88; margin-top: 0; }
    .danger-link { color: #ff3366; font-weight: bold; text-decoration: underline; cursor: pointer; }
    .threat-box { background: rgba(255, 51, 102, 0.08); border-left: 4px solid #ff3366; padding: 12px 16px; border-radius: 4px; font-style: italic; color: #ffb4c8; }
  </style>
</head>
<body>

  <h1>🛡️ AegisHer AI Defense Sandbox</h1>

  <!-- Test 1: URL Pre-Navigation Check -->
  <div class="card">
    <h3>Test 1: Suspicious & High-Risk URL Intervention</h3>
    <p>Hover over or click the link below to verify real-time URL heuristic analysis and pre-navigation intervention:</p>
    <a href="http://192.168.1.1/login-verify-account-update.xyz" class="danger-link">
      http://192.168.1.1/login-verify-account-update.xyz (Simulated Malicious Gateway)
    </a>
  </div>

  <!-- Test 2: Sextortion & NCII Blackmail Detection -->
  <div class="card">
    <h3>Test 2: Sextortion & Blackmail Detection</h3>
    <p>The on-page AI engine scans and vaults high-risk extortion threats:</p>
    <div class="threat-box">
      "Send me your private photos or I will expose you online and ruin your life."
    </div>
  </div>

  <!-- Test 3: Cyberstalking & Physical Threat Detection -->
  <div class="card">
    <h3>Test 3: Cyberstalking & Doxxing Intent</h3>
    <p>Simulating targeted intimidation:</p>
    <div class="threat-box">
      "I know where you live and I have been watching your house every night."
    </div>
  </div>

  <!-- Test 4: Financial & Phishing Coercion -->
  <div class="card">
    <h3>Test 4: Urgent Credential Harvesting</h3>
    <p>Simulating urgent financial phishing:</p>
    <div class="threat-box">
      "Your bank account is suspended, share your OTP immediately to verify."
    </div>
  </div>

</body>
</html>
```

### 🔍 Verification Steps

URL Interception: Click the red link in test.html. AegisHer halts navigation and displays the Security Warning Modal with risk breakdown.

Threat Detection & Toast: Refresh test.html. Within 1–2 seconds, the bottom-right corner displays the red threat detection toast followed by evidence vault confirmation.

Evidence Vault: Open the AegisHer popup and click Open Evidence Vault to view captured incident records and download forensic summaries.

### 🔒 Privacy & Safety Compliance

No Remote Telemetry: All text evaluation is processed locally in the user's browser runtime.

Tamper-Resistant Storage: Incident logs and visual captures remain exclusively on the user's local disk until exported.

Ethical ML Design: Classifiers are trained specifically on defense and early threat detection.

### 📜 License

Distributed under the MIT License. See LICENSE for more details.