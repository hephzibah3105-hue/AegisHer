// AegisHer Content Script (Core Protection Suite)

(function () {
  'use strict';

  console.log('[AegisHer] Core Protection Suite Initialized.');

  // Cache for URL link evaluation results
  const linkRiskCache = new Map();
  const scannedUrls = new Set();
  let lastVaultTime = 0;
  let currentDetectedThreatCount = 0;
  let isPageIsolated = false;
  let isShieldGloballyActive = true;
  let hasVaultedThisSession = false;

  const WHITELISTED_DOMAINS = [
    'google.com',
    'claude.ai',
    'github.com',
    'chatgpt.com',
    'dcode.fr',
    'base64decode.org'
  ];

  const IGNORED_UI_WORDS = new Set(['code', 'upload', 'decode', 'chat', 'project', 'help', 'cipher', 'decoder']);

  function isCurrentSiteWhitelisted() {
    try {
      const hostname = window.location.hostname.toLowerCase();
      return WHITELISTED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
    } catch (e) {
      return false;
    }
  }

  function scanLinksOnPage() {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      if (link.href && !link.href.startsWith('javascript:')) {
        scannedUrls.add(link.href);
      }
    });
    return scannedUrls.size;
  }

  // Initialize from chrome.storage.local BEFORE injecting UI or running scanners
  try {
    if (chrome.runtime?.id) {
      chrome.storage.local.get({ aegis_shield_active: true }, (res) => {
        if (!chrome.runtime?.id) return;
        isShieldGloballyActive = res.aegis_shield_active;
        if (!isShieldGloballyActive) {
          removeShieldWidgetAndAlerts();
        } else {
          init();
        }
      });
    }
  } catch (e) {
    console.warn('[AegisHer] Extension context invalidated on load:', e);
  }

  // Listen for real-time messages from extension popup or background worker
  if (chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!chrome.runtime?.id) return;
      if (message.action === 'TOGGLE_GLOBAL_SHIELD') {
        isShieldGloballyActive = message.shieldActive;
        if (!isShieldGloballyActive) {
          removeShieldWidgetAndAlerts();
        } else {
          location.reload(); // Refresh to reactivate observers cleanly
        }
      } else if (message.action === 'SHOW_HONEYPOT_BETA_BANNER') {
        showHoneypotBetaBanner();
      }
    });
  }

  function removeShieldWidgetAndAlerts() {
    const widget = document.getElementById('aegis-shield-widget');
    if (widget) widget.remove();
    const toast = document.getElementById('aegis-toast-alert');
    if (toast) toast.remove();
    const modal = document.getElementById('aegis-risk-modal-overlay');
    if (modal) modal.remove();
    const hpToast = document.getElementById('aegis-honeypot-beta-toast');
    if (hpToast) hpToast.remove();
    const badges = document.querySelectorAll('[id*="aegis"], [class*="aegis-badge"], [class*="aegis-shield"]');
    badges.forEach(b => b.remove());
  }

  // Asynchronously load the Bayesian threat classifier model
  let localModel = null;
  try {
    if (chrome.runtime?.id) {
      const modelUrl = chrome.runtime.getURL('threat_model.json');
      fetch(modelUrl)
        .then(r => r.json())
        .then(data => {
          localModel = data;
          console.log('[AegisHer] Bayesian Threat Model loaded successfully.');
        })
        .catch(err => console.error('[AegisHer] Failed to load threat model:', err));
    }
  } catch (e) {
    console.warn('[AegisHer] Extension context invalidated during model fetch:', e);
  }

  // Helper to tokenize text matching train_model.py tokenization
  function tokenizeText(text) {
    if (!text) return [];
    return text.toLowerCase().match(/\b\w+\b/g) || [];
  }

  // Naive Bayes prediction logic with confidence margin check
  function predictNaiveBayes(tokens) {
    if (!localModel || !localModel.classes || !localModel.priors || !localModel.likelihoods) {
      return null;
    }
    if (!tokens || tokens.length === 0) {
      return { bestClass: 'SAFE', maxScore: 0, scoresByClass: {}, threatMargin: 0 };
    }

    let bestClass = 'SAFE';
    let maxScore = -Infinity;
    const scoresByClass = {};

    localModel.classes.forEach(cls => {
      let score = localModel.priors[cls] || 0;
      tokens.forEach(token => {
        if (localModel.likelihoods[cls] && localModel.likelihoods[cls][token] !== undefined) {
          score += localModel.likelihoods[cls][token];
        }
      });
      scoresByClass[cls] = score;
      if (score > maxScore) {
        maxScore = score;
        bestClass = cls;
      }
    });

    const safeScore = scoresByClass['SAFE'] !== undefined ? scoresByClass['SAFE'] : -Infinity;
    const threatMargin = maxScore - safeScore;

    // Require positive log-likelihood margin over SAFE to classify as threat
    if (bestClass !== 'SAFE' && threatMargin < 0.5) {
      bestClass = 'SAFE';
    }

    return { bestClass, maxScore, scoresByClass, threatMargin };
  }

  // Listen for Live Tab Metric requests from the popup
  if (chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!chrome.runtime?.id) return;
      if (request.action === 'GET_LIVE_TAB_STATS') {
        sendResponse({
          linksScanned: scanLinksOnPage()
        });
        return true;
      }
    });
  }

  // --- Draggable Handler for Shield Widget ---
  function enableWidgetDragging(widget) {
    let isDragging = false;
    let startX, startY;
    let startLeft, startTop;

    widget.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = widget.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      widget.style.setProperty('right', 'auto', 'important');
      widget.style.setProperty('bottom', 'auto', 'important');
      widget.style.setProperty('left', `${startLeft}px`, 'important');
      widget.style.setProperty('top', `${startTop}px`, 'important');
      widget.style.setProperty('cursor', 'grabbing', 'important');

      function onMouseMove(event) {
        if (!isDragging) return;
        event.preventDefault();

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;

        const maxLeft = window.innerWidth - widget.offsetWidth - 12;
        const maxTop = window.innerHeight - widget.offsetHeight - 12;

        newLeft = Math.max(12, Math.min(newLeft, maxLeft));
        newTop = Math.max(12, Math.min(newTop, maxTop));

        widget.style.setProperty('left', `${newLeft}px`, 'important');
        widget.style.setProperty('top', `${newTop}px`, 'important');
      }

      function onMouseUp() {
        if (!isDragging) return;
        isDragging = false;
        widget.style.setProperty('cursor', 'grab', 'important');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  // --- 1. Floating Translucent Shield Indicator & Toggle Controller ---
  function injectShieldWidget() {
    if (!chrome.runtime?.id || !isShieldGloballyActive) return;
    if (document.getElementById('aegis-shield-widget')) return;

    const shield = document.createElement('div');
    shield.id = 'aegis-shield-widget';
    shield.title = 'AegisHer Real-Time AI Security Shield Active';

    shield.innerHTML = `
      <span class="aegis-dot"></span>
      <span class="aegis-text">🛡️ AegisHer AI Shield — ON</span>
    `;

    document.body.appendChild(shield);
    enableWidgetDragging(shield);
  }

  function removeShieldWidget() {
    const existing = document.getElementById('aegis-shield-widget');
    if (existing) {
      existing.remove();
    }
  }

  function updateShieldState(alertMode, message) {
    if (!chrome.runtime?.id || !isShieldGloballyActive) return;
    const shield = document.getElementById('aegis-shield-widget');
    if (!shield) return;

    const textSpan = shield.querySelector('.aegis-text');

    if (alertMode) {
      shield.classList.add('aegis-alert-state');
      if (textSpan) textSpan.textContent = message || '🚨 AegisHer — THREAT DETECTED';
    } else {
      shield.classList.remove('aegis-alert-state');
      if (textSpan) textSpan.textContent = '🛡️ AegisHer AI Shield — ON';
    }
  }

  // --- 2. Link Hover & Click Listener (Heuristic Risk Interceptor) ---
  function getAnchorElement(target) {
    let current = target;
    while (current && current !== document) {
      if (current.tagName === 'A' && current.href) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  // Hover listener for link pre-scoring
  document.addEventListener('mouseover', (e) => {
    if (!chrome.runtime?.id || !isShieldGloballyActive) return;
    const anchor = getAnchorElement(e.target);
    if (!anchor || !anchor.href) return;

    const url = anchor.href;
    if (url.startsWith('javascript:') || url.startsWith('#')) return;

    const applyRiskStyle = (score) => {
      if (score >= 60) {
        anchor.style.outline = '2px dashed #ef4444';
        anchor.title = `[AegisHer Risk Warning: ${score}/100] High Risk Link!`;
      }
    };

    if (linkRiskCache.has(url)) {
      const cached = linkRiskCache.get(url);
      if (cached) applyRiskStyle(cached.score);
    } else {
      try {
        chrome.runtime.sendMessage({ action: 'ANALYZE_LINK', url: url }, (response) => {
          if (chrome.runtime.lastError) return;
          if (response) {
            linkRiskCache.set(url, response);
            applyRiskStyle(response.score);
          }
        });
      } catch (err) {
        // Extension context invalidated
      }
    }
  }, true);

  // Click listener for high-risk navigation interception
  document.addEventListener('click', (e) => {
    if (!chrome.runtime?.id || !isShieldGloballyActive) return;
    const anchor = getAnchorElement(e.target);
    if (!anchor || !anchor.href) return;

    const url = anchor.href;
    if (url.startsWith('javascript:') || url.startsWith('#')) return;

    const cachedRisk = linkRiskCache.get(url);

    if (cachedRisk && cachedRisk.score >= 60) {
      e.preventDefault();
      e.stopPropagation();
      if (cachedRisk.score >= 80) {
        currentDetectedThreatCount += 1;
      }
      showRiskWarningModal(url, cachedRisk.score, cachedRisk.riskLevel, cachedRisk.factors);
      return;
    }

    try {
      chrome.runtime.sendMessage({ action: 'ANALYZE_LINK', url: url }, (response) => {
        if (chrome.runtime.lastError || !response) return;
        linkRiskCache.set(url, response);
        if (response.score >= 60) {
          if (response.score >= 80) {
            currentDetectedThreatCount += 1;
          }
          showRiskWarningModal(url, response.score, response.riskLevel, response.factors);
        }
      });
    } catch (err) {
      // Extension context invalidated
    }
  }, true);

  function showRiskWarningModal(url, score, riskLevel, factors) {
    if (!chrome.runtime?.id || !isShieldGloballyActive) return;
    if (document.getElementById('aegis-risk-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'aegis-risk-modal-overlay';

    const factorsHTML = (factors && factors.length > 0)
      ? `<ul>${factors.map(f => `<li>${f}</li>`).join('')}</ul>`
      : '<p>Suspicious URL structures detected.</p>';

    overlay.innerHTML = `
      <div id="aegis-risk-modal">
        <div class="aegis-modal-header">
          <span class="aegis-modal-icon">⚠️</span>
          <div>
            <h3 class="aegis-modal-title">High Risk Link Detected</h3>
            <span style="font-size: 12px; color: #94a3b8;">AegisHer AI Threat Interceptor</span>
          </div>
        </div>
        <div class="aegis-modal-url">${url}</div>
        <div class="aegis-score-box">
          <span style="font-size: 13px; font-weight: 600;">Calculated Threat Score</span>
          <span style="font-size: 16px; font-weight: 800; color: #ef4444;">${score} / 100 (${riskLevel})</span>
        </div>
        <div class="aegis-score-bar-bg">
          <div class="aegis-score-bar-fill" style="width: ${score}%;"></div>
        </div>
        <div class="aegis-factors-list">
          <strong>Risk Indicators Detected:</strong>
          ${factorsHTML}
        </div>
        <div class="aegis-modal-actions">
          <button class="aegis-btn aegis-btn-proceed" id="aegis-proceed-btn">Proceed Anyway</button>
          <button class="aegis-btn aegis-btn-cancel" id="aegis-cancel-btn">Cancel (Stay Safe)</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('aegis-cancel-btn').addEventListener('click', () => {
      overlay.remove();
    });

    document.getElementById('aegis-proceed-btn').addEventListener('click', () => {
      overlay.remove();
      window.location.href = url;
    });
  }

  // --- 3. Contextual Threat Patterns (Require Full Phrase Meaning with strict word boundaries) ---
  const THREAT_PATTERNS = [
    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 95,
      regex: /\b(send|give|upload)\b\s+.*\b(nudes|nude|private\s+photos|explicit\s+pictures|intimate\s+videos|naked\s+pics)\b.*\b(or|else|will|expose|leak|publish|share)\b/i
    },
    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 95,
      regex: /\b(leak|publish|upload|spread|share|post)\b\s+.*\b(photos|videos|pictures|nudes|recordings|tape|webcam|private\s+content)\b\s+.*\b(or|unless|pay|money|bitcoin|btc)\b/i
    },
    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 95,
      regex: /\b(recorded|captured|hacked|taped)\b\s+.*\b(webcam|screen|camera|private\s+moments)\b.*\b(send|pay|leak|expose)\b/i
    },
    {
      category: 'VIOLENT_THREAT',
      weight: 95,
      regex: /\bi\s+(will|am\s+going\s+to)\s+(kill|murder|hunt\s+down|shoot|stab|choke|beat\s+up|harm)\s+you\b/i
    },
    {
      category: 'VIOLENT_THREAT',
      weight: 90,
      regex: /\byou\s+deserve\s+to\s+die\b|\bburn\s+in\s+hell\b|\bend\s+your\s+life\b/i
    },
    {
      category: 'CYBERSTALKING_DOXXING',
      weight: 90,
      regex: /\bi\s+know\s+where\s+you\s+(live|stay|sleep|work|study)\b|\bwatching\s+your\s+house\b|\bstalking\s+you\b/i
    },
    {
      category: 'CYBERSTALKING_DOXXING',
      weight: 90,
      regex: /\b(tracking|monitoring)\s+your\s+(gps|real-time\s+location|ip|device|phone)\b|\bposting\s+your\s+(home\s+address|phone\s+number|ssn)\b/i
    },
    {
      category: 'GENDER_BASED_HARASSMENT',
      weight: 90,
      regex: /\bworthless\s+because\s+you\s+are\s+a\s+woman\b|\b(slut|whore|bitch)\s+(deserves|needs\s+to\s+be|should\s+be)\b|\bwomen\s+should\s+know\s+their\s+place\b/i
    },
    {
      category: 'COERCION_MANIPULATION',
      weight: 85,
      regex: /\bdo\s+(what\s+i\s+say|as\s+you\s+are\s+told)\s+or\s+(else|face\s+the\s+consequences)\b|\bno\s+one\s+will\s+believe\s+you\b|\bif\s+you\s+tell\s+anyone\s+i\s+will\b/i
    },
    {
      category: 'PHISHING_FRAUD',
      weight: 90,
      regex: /\b(give|share|send|provide)\s+(your\s+)?(otp|verification\s+code|one-time\s+password|2fa\s+code)\s+(immediately|now|to\s+unlock)\b|\baccount\s+(has\s+been\s+suspended|will\s+be\s+terminated).*(click\s+here|verify\s+now)\b/i
    }
  ];

  function isIgnoredUIContent(text) {
    if (!text) return true;
    const clean = text.trim().toLowerCase();
    if (IGNORED_UI_WORDS.has(clean)) return true;
    const words = clean.split(/\s+/);
    if (words.length <= 3 && words.every(w => IGNORED_UI_WORDS.has(w))) return true;
    return false;
  }

  // Extracts candidate user content blocks from the page instead of dumping whole body innerText
  function getCandidateTextBlocks(customText) {
    const blocks = [];
    if (customText && typeof customText === 'string' && customText.trim().length >= 8) {
      if (!isIgnoredUIContent(customText)) {
        blocks.push(customText.trim());
      }
    }

    if (!document.body) return blocks;

    // Selector targeting user-visible content blocks (messages, posts, comments, text inputs, paragraphs)
    const selectors = [
      '[class*="message"]', '[class*="comment"]', '[class*="post"]', '[class*="chat"]',
      'p', 'article', 'section', 'li', 'textarea', 'input[type="text"]', '[contenteditable="true"]'
    ];

    const elements = document.body.querySelectorAll(selectors.join(','));
    const seen = new Set();

    elements.forEach(el => {
      // Ignore UI containers, headers, navs, footers, scripts, and Aegis extension widgets
      if (el.closest('header, nav, footer, script, style, svg, button, [id*="aegis"]')) return;

      const txt = (el.value || el.innerText || el.textContent || '').trim();
      if (txt.length >= 8 && txt.length <= 1500 && !seen.has(txt) && !isIgnoredUIContent(txt)) {
        seen.add(txt);
        blocks.push(txt);
      }
    });

    return blocks;
  }

  function scanPageTextThreats(customText) {
    if (!chrome.runtime?.id || !isShieldGloballyActive) return;

    // 1. Whitelist Check for Clean Developer & Trusted Sites
    if (isCurrentSiteWhitelisted()) {
      if (typeof updateShieldState === 'function') {
        updateShieldState(false);
      }
      return;
    }

    const blocks = getCandidateTextBlocks(customText);
    if (!blocks || blocks.length === 0) {
      if (typeof updateShieldState === 'function') {
        updateShieldState(false);
      }
      return;
    }

    let detectedThreat = null;

    for (const blockText of blocks) {
      let score = 0;
      let category = 'SAFE';
      let matchInfo = [];

      // 1. Contextual regex check on individual block with strict word boundaries
      for (const pattern of THREAT_PATTERNS) {
        const match = blockText.match(pattern.regex);
        if (match) {
          score = pattern.weight;
          category = pattern.category;
          matchInfo.push(match[0]);
          break;
        }
      }

      // 2. Bayesian ML Model fallback on individual block (requiring high score and non-UI tokens)
      if (score < 80 && localModel) {
        const tokens = tokenizeText(blockText);
        const filteredTokens = tokens.filter(t => !IGNORED_UI_WORDS.has(t));
        const prediction = predictNaiveBayes(filteredTokens);

        if (prediction && prediction.bestClass !== 'SAFE' && prediction.threatMargin >= 1.5) {
          category = prediction.bestClass;
          const modelWeight = localModel.threatWeights ? (localModel.threatWeights[category] || 85) : 85;
          if (modelWeight >= 80) {
            score = modelWeight;
            matchInfo.push(`Bayesian Context Match: ${category}`);
          }
        }
      }

      if (score >= 80 && category !== 'SAFE') {
        detectedThreat = {
          score,
          category,
          matches: matchInfo,
          snippet: blockText.substring(0, 200)
        };
        break; // Found genuine high-severity threat block
      }
    }

    // 3. If no high-risk pattern matched (threatScore < 80)
    if (!detectedThreat || detectedThreat.score < 80) {
      if (typeof updateShieldState === 'function') {
        updateShieldState(false); // keep shield badge in standard ON status
      }
      return;
    }

    // 4. High-Severity Threat Confirmed (threatScore >= 80)
    const totalScore = detectedThreat.score;
    const primaryCategory = detectedThreat.category;
    const snippet = detectedThreat.snippet;

    if (totalScore >= 80 && !hasVaultedThisSession) {
      if (typeof showToastAlert === 'function') {
        showToastAlert('🚨 AegisHer Shield: ' + primaryCategory.replace(/_/g, ' ') + ' (' + totalScore + '/100) — Evidence Vaulted');
      }

      if (typeof updateShieldState === 'function') {
        updateShieldState(true, '🚨 AegisHer — THREAT VAULTED (' + totalScore + '/100)');
      }

      try {
        chrome.runtime.sendMessage({
          action: 'THREAT_DETECTED',
          score: totalScore,
          threatType: primaryCategory,
          matches: detectedThreat.matches,
          snippet: snippet,
          url: window.location.href,
          title: document.title || 'Security Incident'
        });
      } catch (e) {
        console.warn('[AegisHer] Extension context invalidated during threat message:', e);
      }

      hasVaultedThisSession = true;
      currentDetectedThreatCount += 1;
    }
  }

  function showToastAlert(message) {
    if (!chrome.runtime?.id || !isShieldGloballyActive) return;
    if (document.getElementById('aegis-toast-alert')) return;

    const toast = document.createElement('div');
    toast.id = 'aegis-toast-alert';
    toast.innerHTML = `
      <span style="font-size: 18px;">🛡️</span>
      <div>
        <strong>AegisHer Real-Time Alert</strong>
        <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">${message}</div>
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast) toast.remove();
    }, 6000);
  }

  function showHoneypotBetaBanner() {
    if (!chrome.runtime?.id || !isShieldGloballyActive) return;
    if (document.getElementById('aegis-honeypot-beta-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'aegis-honeypot-beta-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(59, 130, 246, 0.5);
      color: #f8fafc;
      padding: 12px 18px;
      border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
    `;
    toast.innerHTML = `
      <span style="font-size: 16px;">🛡️</span>
      <div>
        <strong>AegisHer Honeypot AI (Beta)</strong>
        <div style="font-size: 11px; color: #93c5fd; margin-top: 2px;">Masking active credentials and preserving forensic metadata.</div>
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast) toast.remove();
    }, 4500);
  }

  // --- 4. Initialization & Event Observers ---
  let isInitialized = false;
  function init() {
    if (isInitialized) return;
    if (!chrome.runtime?.id || !isShieldGloballyActive) return;
    isInitialized = true;

    injectShieldWidget();
    scanLinksOnPage();
    scanPageTextThreats();

    // 1. Observe DOM mutations for incoming chat messages (WhatsApp Web, Telegram, live chats)
    const observer = new MutationObserver(() => {
      if (!chrome.runtime?.id || !isShieldGloballyActive) return;
      scanLinksOnPage();
      scanPageTextThreats();
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    // 2. Real-time typing scanner (WhatsApp Web, textareas, inputs, contenteditable)
    let typingTimer = null;
    document.addEventListener('input', (e) => {
      if (!chrome.runtime?.id || !isShieldGloballyActive) return;
      const target = e.target;
      if (!target) return;

      const isInputOrTextarea = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isContentEditable = target.isContentEditable || target.getAttribute('contenteditable') === 'true';

      if (isInputOrTextarea || isContentEditable) {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
          if (!chrome.runtime?.id || !isShieldGloballyActive) return;
          const typedText = target.value || target.innerText || target.textContent || '';
          if (typedText.trim().length >= 8) {
            scanPageTextThreats(typedText);
          }
        }, 350); // Scans 350ms after user pauses typing
      }
    }, true);

    window.addEventListener('load', () => {
      scanLinksOnPage();
      setTimeout(scanPageTextThreats, 800);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (chrome.runtime?.id && isShieldGloballyActive) init();
    });
  } else {
    if (chrome.runtime?.id && isShieldGloballyActive) init();
  }

  // Expose test helper on window for manual testing if needed
  window.__AegisHerTestScan = scanPageTextThreats;

})();