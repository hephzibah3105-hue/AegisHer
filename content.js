// AegisHer Content Script (Core Protection Suite)

// AegisHer Content Script (Core Protection Suite)

(function () {
  'use strict';

  console.log('[AegisHer] Core Protection Suite Initialized.');

  // Cache for URL link evaluation results
  const linkRiskCache = new Map();
  let hasVaultedEvidence = false;
  let currentDetectedThreatCount = 0;

  // Listen for Live Tab Metric requests from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_LIVE_TAB_STATS') {
      const links = document.querySelectorAll('a[href]');
      const validLinks = Array.from(links).filter(a => {
        const href = a.getAttribute('href');
        return href && !href.startsWith('#') && !href.startsWith('javascript:');
      });

      sendResponse({
        linksScanned: validLinks.length,
        risksBlocked: currentDetectedThreatCount
      });
      return true;
    }
  });

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
    const shield = document.getElementById('aegis-shield-widget');
    if (!shield) return;

    const textSpan = shield.querySelector('.aegis-text');

    if (alertMode) {
      shield.classList.add('aegis-alert-state');
      if (textSpan) textSpan.textContent = message || '🚨 AegisHer — THREAT VAULTED';
    } else {
      shield.classList.remove('aegis-alert-state');
      if (textSpan) textSpan.textContent = '🛡️ AegisHer AI Shield — ON';
    }
  }

  // Initial shield mount on load
  chrome.storage.local.get(['aegis_shield_active'], (res) => {
    const isActive = res.aegis_shield_active !== false;
    if (isActive) {
      injectShieldWidget();
    }
  });

  // Real-time toggle listener from popup switch
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.aegis_shield_active !== undefined) {
      if (changes.aegis_shield_active.newValue) {
        injectShieldWidget();
      } else {
        removeShieldWidget();
      }
    }
  });

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
      chrome.runtime.sendMessage({ action: 'ANALYZE_LINK', url: url }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response) {
          linkRiskCache.set(url, response);
          applyRiskStyle(response.score);
        }
      });
    }
  }, true);

  // Click listener for high-risk navigation interception
  document.addEventListener('click', (e) => {
    const anchor = getAnchorElement(e.target);
    if (!anchor || !anchor.href) return;

    const url = anchor.href;
    if (url.startsWith('javascript:') || url.startsWith('#')) return;

    // Check if we already have risk evaluation
    const cachedRisk = linkRiskCache.get(url);

    if (cachedRisk && cachedRisk.score >= 60) {
      e.preventDefault();
      e.stopPropagation();
      showRiskWarningModal(url, cachedRisk.score, cachedRisk.riskLevel, cachedRisk.factors);
      return;
    }

    // If not cached yet, analyze synchronously via message
    chrome.runtime.sendMessage({ action: 'ANALYZE_LINK', url: url }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      linkRiskCache.set(url, response);
      if (response.score >= 60) {
        showRiskWarningModal(url, response.score, response.riskLevel, response.factors);
      } else {
        // Safe to proceed normally
      }
    });
  }, true);

  function showRiskWarningModal(url, score, riskLevel, factors) {
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

  // --- 3. Production-Grade Threat Detector (Sextortion, Violent Threats, Cyberstalking, Doxxing, Phishing) ---
  const THREAT_PATTERNS = [
    // 1. SEXTORTION & NCII BLACKMAIL (Immediate High Risk)
    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 85,
      regex: /(send|give|upload)\s+(me\s+)?(your\s+)?(nudes|nude|private\s+photos|explicit\s+pictures|intimate\s+videos|nsfw|naked\s+pics)/i
    },
    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 85,
      regex: /(leak|publish|upload|spread|share|post)\s+(your|these|the)?\s*(photos|videos|pictures|nudes|recordings|tape|webcam|private\s+content)\s+(online|everywhere|on\s+social|on\s+telegram|on\s+instagram|to\s+your\s+friends)/i
    },
    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 80,
      regex: /pay\s+(me\s+)?(\$?\d+|money|cash|bitcoin|btc|crypto)\s+or\s+(i\s+will\s+)?(send|leak|expose|ruin|post)/i
    },
    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 75,
      regex: /i\s+have\s+(recorded|captured|hacked|taped)\s+(your|you|you\s+through\s+your)\s*(webcam|screen|camera|phone|private\s+moments)/i
    },
    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 75,
      regex: /(expose|ruin)\s+you\s+to\s+(your\s+)?(family|friends|parents|relatives|contacts|followers|school|college|boss|workplace)/i
    },

    // 2. PHYSICAL THREATS & VIOLENT INTIMIDATION
    {
      category: 'VIOLENT_THREAT',
      weight: 90,
      regex: /i\s+(will|am\s+going\s+to)\s+(kill|murder|hunt|shoot|stab|choke|beat|harm|destroy)\s+you/i
    },
    {
      category: 'VIOLENT_THREAT',
      weight: 85,
      regex: /(you\s+deserve\s+to\s+die|die\s+bitch|burn\s+in\s+hell|end\s+your\s+life)/i
    },
    {
      category: 'VIOLENT_THREAT',
      weight: 80,
      regex: /i\s+will\s+(find|track|hunt)\s+you\s+down\s+and/i
    },

    // 3. CYBERSTALKING, DOXXING & SURVEILLANCE
    {
      category: 'CYBERSTALKING_DOXXING',
      weight: 80,
      regex: /i\s+know\s+where\s+you\s+(live|stay|sleep|work|study|hangout|commute)/i
    },
    {
      category: 'CYBERSTALKING_DOXXING',
      weight: 75,
      regex: /(watching|stalking)\s+(you|your\s+every\s+move|your\s+house|your\s+window|outside\s+your)/i
    },
    {
      category: 'CYBERSTALKING_DOXXING',
      weight: 70,
      regex: /(tracking|monitoring)\s+your\s+(gps|real-time\s+location|ip|device|phone\s+calls)/i
    },
    {
      category: 'CYBERSTALKING_DOXXING',
      weight: 75,
      regex: /(i\s+have\s+your|posting\s+your)\s+(home\s+address|phone\s+number|id\s+card|real\s+identity|ssn|aadhaar|location)/i
    },

    // 4. GENDER-BASED HARASSMENT & TARGETED ABUSE
    {
      category: 'GENDER_BASED_HARASSMENT',
      weight: 75,
      regex: /(slut|whore|bitch|cunt)\s+(deserves|needs\s+to\s+be|should\s+be)/i
    },
    {
      category: 'GENDER_BASED_HARASSMENT',
      weight: 80,
      regex: /i\s+will\s+(assault|rape|violate|force)\s+you/i
    },
    {
      category: 'GENDER_BASED_HARASSMENT',
      weight: 65,
      regex: /you\s+are\s+(worthless|ugly|disgusting)\s+(kill\s+yourself|nobody\s+cares)/i
    },

    // 5. COERCION & PSYCHOLOGICAL MANIPULATION
    {
      category: 'COERCION_MANIPULATION',
      weight: 70,
      regex: /do\s+(what\s+i\s+say|as\s+you\s+are\s+told)\s+or\s+(else|face\s+the\s+consequences)/i
    },
    {
      category: 'COERCION_MANIPULATION',
      weight: 65,
      regex: /(no\s+one\s+will\s+believe\s+you|if\s+you\s+tell\s+anyone\s+i\s+will)/i
    },
    {
      category: 'COERCION_MANIPULATION',
      weight: 65,
      regex: /you\s+have\s+(\d+\s+hours|24h|until\s+tonight)\s+to\s+(respond|reply|comply|send)/i
    },

    // 6. PHISHING, CREDENTIAL HARVESTING & OTP FRAUD
    {
      category: 'PHISHING_FRAUD',
      weight: 75,
      regex: /(share|send|provide)\s+(your\s+)?(otp|verification\s+code|one-time\s+password|2fa\s+code)\s+(immediately|now|to\s+unlock)/i
    },
    {
      category: 'PHISHING_FRAUD',
      weight: 70,
      regex: /account\s+(has\s+been\s+suspended|will\s+be\s+terminated|blocked)\s+(click\s+here|verify\s+now|confirm\s+identity)/i
    },
    {
      category: 'PHISHING_FRAUD',
      weight: 65,
      regex: /(login|enter)\s+your\s+(netbanking|credit\s+card|password|pin|security\s+pin)\s+to\s+(claim|prevent\s+closure)/i
    }
  ];

  function scanPageTextThreats() {
    if (hasVaultedEvidence) return;

    const pageText = document.body ? document.body.innerText : '';
    if (!pageText || pageText.trim().length < 8) return;

    let totalScore = 0;
    const matchesFound = [];
    let primaryCategory = 'SECURITY_THREAT';
    let snippet = '';

    for (const pattern of THREAT_PATTERNS) {
      const match = pageText.match(pattern.regex);
      if (match) {
        totalScore += pattern.weight;
        primaryCategory = pattern.category;
        matchesFound.push(match[0]);

        if (!snippet) {
          const matchIndex = match.index || 0;
          const start = Math.max(0, matchIndex - 50);
          const end = Math.min(pageText.length, matchIndex + match[0].length + 50);
          snippet = pageText.substring(start, end).replace(/\s+/g, ' ').trim();
        }
      }
    }

    totalScore = Math.min(100, totalScore);

    if (totalScore >= 75 && !hasVaultedEvidence) {
      hasVaultedEvidence = true;
      currentDetectedThreatCount = matchesFound.length || 1;
      console.log(`[AegisHer Engine] High-risk threat detected (${totalScore}/100) in category: ${primaryCategory}`);
      if (typeof updateShieldState === 'function') {
        updateShieldState(true, `🚨 AegisHer — THREAT VAULTED (${totalScore}/100)`);
      }

      chrome.runtime.sendMessage({
        action: 'THREAT_DETECTED',
        score: totalScore,
        threatType: primaryCategory,
        matches: matchesFound,
        snippet: snippet || pageText.slice(0, 200),
        url: window.location.href,
        title: document.title
      }, (response) => {
        if (chrome.runtime.lastError) return;
        if (typeof showToastAlert === 'function') {
          showToastAlert(`🚨 AegisHer Shield: ${primaryCategory.replace(/_/g, ' ')} (${totalScore}/100) Detected! Evidence automatically captured & vaulted.`);
        }
      });
    }
  }

  function showToastAlert(message) {
    if (document.getElementById('aegis-toast-alert')) return;

    const toast = document.createElement('div');
    toast.id = 'aegis-toast-alert';
    toast.innerHTML = `
      <span style="font-size: 18px;">🛡️</span>
      <div>
        <strong>AegisHer Evidence Vault</strong>
        <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">${message}</div>
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast) toast.remove();
    }, 6000);
  }

  // --- 4. Initialization & Event Observers ---
  function init() {
    injectShieldWidget();
    scanPageTextThreats();

    // Observe DOM mutations to scan dynamic content (chat messages, comments, etc.)
    const observer = new MutationObserver(() => scanPageTextThreats());
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', () => setTimeout(scanPageTextThreats, 800));

  // Expose test helper on window for manual testing if needed
  window.__AegisHerTestScan = scanPageTextThreats;

})();

function enableWidgetDragging(widget) {
  let isDragging = false;
  let startX, startY;
  let startLeft, startTop;

  widget.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only trigger on left-click

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = widget.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    // Reset right/bottom styles with !important override to stop stretching
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

      // Keep entirely within browser boundaries
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
