// AegisHer Content Script (AI + Core Protection Suite)

(function () {
  'use strict';

  console.log('[AegisHer] Core Protection Suite Initialized.');

  // ============================================================
  // 1. AI MODEL LOADER
  // ============================================================

  let threatModel = null;
  let hasVaultedEvidence = false;

  async function loadThreatModel() {
    try {
      const modelURL = chrome.runtime.getURL('threat_model.json');
      const response = await fetch(modelURL);

      if (!response.ok) {
        throw new Error('Could not load threat_model.json');
      }

      threatModel = await response.json();

      console.log(
        '[AegisHer AI] Naive Bayes threat model loaded successfully.'
      );

      // Run an AI scan after the model has loaded
      scanPageTextThreats();

    } catch (error) {
      console.error(
        '[AegisHer AI] Failed to load threat model:',
        error
      );
    }
  }

  // Tokenize text exactly like train_model.py
  function tokenize(text) {
    return text.match(/\b\w+\b/g) || [];
  }

  // ============================================================
  // 2. AI NAIVE BAYES CLASSIFIER
  // ============================================================

  function classifyWithAI(text) {
    if (!threatModel) {
      return null;
    }

    const words = new Set(tokenize(text.toLowerCase()));
    const scores = {};

    // Calculate Naive Bayes log-probability for every category
    for (const category of threatModel.classes) {

      let score = threatModel.priors[category];

      for (const word of words) {

        if (
          threatModel.likelihoods[category] &&
          threatModel.likelihoods[category][word] !== undefined
        ) {
          score += threatModel.likelihoods[category][word];
        }
      }

      scores[category] = score;
    }

    // Find highest scoring category
    let bestCategory = 'SAFE';
    let bestLogScore = -Infinity;

    for (const category in scores) {

      if (scores[category] > bestLogScore) {
        bestLogScore = scores[category];
        bestCategory = category;
      }

    }

    // Convert log scores into approximate probability
    const values = Object.values(scores);
    const maxScore = Math.max(...values);

    let totalProbability = 0;
    const probabilities = {};

    for (const category in scores) {

      const probability = Math.exp(
        scores[category] - maxScore
      );

      probabilities[category] = probability;
      totalProbability += probability;
    }

    const confidence =
      probabilities[bestCategory] / totalProbability;

    return {
      category: bestCategory,
      confidence: confidence,
      logScore: bestLogScore
    };
  }

  // ============================================================
  // 3. AI THREAT SCORE
  // ============================================================

  function calculateAIScore(aiResult) {

    if (!aiResult || aiResult.category === 'SAFE') {
      return 0;
    }

    const weight =
      threatModel.threatWeights[aiResult.category] || 50;

    const score = Math.round(
      aiResult.confidence * weight
    );

    return Math.min(100, score);
  }

  // ============================================================
  // 4. FLOATING AEGISHER SHIELD
  // ============================================================

  function injectShieldWidget() {

    if (document.getElementById('aegis-shield-widget')) {
      return;
    }

    const shield = document.createElement('div');

    shield.id = 'aegis-shield-widget';

    shield.title =
      'AegisHer Real-Time AI Security Shield Active';

    shield.innerHTML = `
      <span class="aegis-dot"></span>
      <span class="aegis-text">
        🛡️ AegisHer AI Shield — ON
      </span>
    `;

    document.body.appendChild(shield);
  }

  function updateShieldState(alertMode, message) {

    const shield =
      document.getElementById('aegis-shield-widget');

    if (!shield) {
      return;
    }

    const textSpan =
      shield.querySelector('.aegis-text');

    if (alertMode) {

      shield.classList.add('aegis-alert-state');

      if (textSpan) {
        textSpan.textContent =
          message || '🛡️ AegisHer — THREAT VAULTED';
      }

    } else {

      shield.classList.remove('aegis-alert-state');

      if (textSpan) {
        textSpan.textContent =
          '🛡️ AegisHer AI Shield — ON';
      }
    }
  }

  // ============================================================
  // 5. URL RISK INTERCEPTOR
  // ============================================================

  const linkRiskCache = new Map();

  function getAnchorElement(target) {

    let current = target;

    while (current && current !== document) {

      if (
        current.tagName === 'A' &&
        current.href
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  // Analyze links when user hovers
  document.addEventListener(
    'mouseover',
    (e) => {

      const anchor =
        getAnchorElement(e.target);

      if (!anchor || !anchor.href) {
        return;
      }

      const url = anchor.href;

      if (
        url.startsWith('javascript:') ||
        url.startsWith('#')
      ) {
        return;
      }

      if (!linkRiskCache.has(url)) {

        chrome.runtime.sendMessage(
          {
            action: 'ANALYZE_LINK',
            url: url
          },
          (response) => {

            if (chrome.runtime.lastError) {
              return;
            }

            if (response) {

              linkRiskCache.set(url, response);

              if (response.score >= 60) {

                anchor.style.outline =
                  '2px dashed #ef4444';

                anchor.title =
                  `[AegisHer Risk Warning: ${response.score}/100] High Risk Link!`;
              }
            }
          }
        );
      }

    },
    true
  );

  // Intercept dangerous navigation
  document.addEventListener(
    'click',
    (e) => {

      const anchor =
        getAnchorElement(e.target);

      if (!anchor || !anchor.href) {
        return;
      }

      const url = anchor.href;

      if (
        url.startsWith('javascript:') ||
        url.startsWith('#')
      ) {
        return;
      }

      const cachedRisk =
        linkRiskCache.get(url);

      if (
        cachedRisk &&
        cachedRisk.score >= 60
      ) {

        e.preventDefault();
        e.stopPropagation();

        showRiskWarningModal(
          url,
          cachedRisk.score,
          cachedRisk.riskLevel,
          cachedRisk.factors
        );

        return;
      }

      chrome.runtime.sendMessage(
        {
          action: 'ANALYZE_LINK',
          url: url
        },
        (response) => {

          if (
            chrome.runtime.lastError ||
            !response
          ) {
            return;
          }

          linkRiskCache.set(url, response);

          if (response.score >= 60) {

            e.preventDefault();
            e.stopPropagation();

            showRiskWarningModal(
              url,
              response.score,
              response.riskLevel,
              response.factors
            );
          }

        }
      );

    },
    true
  );

  // ============================================================
  // 6. URL WARNING MODAL
  // ============================================================

  function showRiskWarningModal(
    url,
    score,
    riskLevel,
    factors
  ) {

    if (
      document.getElementById(
        'aegis-risk-modal-overlay'
      )
    ) {
      return;
    }

    const overlay =
      document.createElement('div');

    overlay.id =
      'aegis-risk-modal-overlay';

    const factorsHTML =
      factors && factors.length > 0
        ? `<ul>${factors.map(
            f => `<li>${f}</li>`
          ).join('')}</ul>`
        : '<p>Suspicious URL structures detected.</p>';

    overlay.innerHTML = `
      <div id="aegis-risk-modal">

        <div class="aegis-modal-header">

          <span class="aegis-modal-icon">
            ⚠️
          </span>

          <div>

            <h3 class="aegis-modal-title">
              High Risk Link Detected
            </h3>

            <span
              style="
                font-size:12px;
                color:#94a3b8;
              "
            >
              AegisHer AI Threat Interceptor
            </span>

          </div>

        </div>

        <div class="aegis-modal-url">
          ${url}
        </div>

        <div class="aegis-score-box">

          <span
            style="
              font-size:13px;
              font-weight:600;
            "
          >
            Calculated Threat Score
          </span>

          <span
            style="
              font-size:16px;
              font-weight:800;
              color:#ef4444;
            "
          >
            ${score} / 100 (${riskLevel})
          </span>

        </div>

        <div class="aegis-score-bar-bg">

          <div
            class="aegis-score-bar-fill"
            style="width:${score}%"
          ></div>

        </div>

        <div class="aegis-factors-list">

          <strong>
            Risk Indicators Detected:
          </strong>

          ${factorsHTML}

        </div>

        <div class="aegis-modal-actions">

          <button
            class="aegis-btn aegis-btn-proceed"
            id="aegis-proceed-btn"
          >
            Proceed Anyway
          </button>

          <button
            class="aegis-btn aegis-btn-cancel"
            id="aegis-cancel-btn"
          >
            Cancel (Stay Safe)
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    document
      .getElementById('aegis-cancel-btn')
      .addEventListener(
        'click',
        () => {
          overlay.remove();
        }
      );

    document
      .getElementById('aegis-proceed-btn')
      .addEventListener(
        'click',
        () => {

          overlay.remove();

          window.location.href = url;
        }
      );
  }

  // ============================================================
  // 7. RULE-BASED THREAT PATTERNS
  // ============================================================

  const THREAT_PATTERNS = [

    // SEXTORTION & NCII BLACKMAIL

    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 85,
      regex:
        /(send|give|upload)\s+(me\s+)?(your\s+)?(nudes|nude|private\s+photos|explicit\s+pictures|intimate\s+videos|nsfw|naked\s+pics)/i
    },

    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 85,
      regex:
        /(leak|publish|upload|spread|share|post)\s+(your|these|the)?\s*(photos|videos|pictures|nudes|recordings|tape|webcam|private\s+content)\s+(online|everywhere|on\s+social|on\s+telegram|on\s+instagram|to\s+your\s+friends)/i
    },

    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 80,
      regex:
        /pay\s+(me\s+)?(\$?\d+|money|cash|bitcoin|btc|crypto)\s+or\s+(i\s+will\s+)?(send|leak|expose|ruin|post)/i
    },

    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 75,
      regex:
        /i\s+have\s+(recorded|captured|hacked|taped)\s+(your|you|you\s+through\s+your)\s*(webcam|screen|camera|phone|private\s+moments)/i
    },

    {
      category: 'SEXTORTION_BLACKMAIL',
      weight: 75,
      regex:
        /(expose|ruin)\s+you\s+to\s+(your\s+)?(family|friends|parents|relatives|contacts|followers|school|college|boss|workplace)/i
    },

    // VIOLENT THREATS

    {
      category: 'VIOLENT_THREAT',
      weight: 90,
      regex:
        /i\s+(will|am\s+going\s+to)\s+(kill|murder|hunt|shoot|stab|choke|beat|harm|destroy)\s+you/i
    },

    {
      category: 'VIOLENT_THREAT',
      weight: 85,
      regex:
        /(you\s+deserve\s+to\s+die|die\s+bitch|burn\s+in\s+hell|end\s+your\s+life)/i
    },

    {
      category: 'VIOLENT_THREAT',
      weight: 80,
      regex:
        /i\s+will\s+(find|track|hunt)\s+you\s+down\s+and/i
    },

    // CYBERSTALKING & DOXXING

    {
      category: 'CYBERSTALKING_DOXXING',
      weight: 80,
      regex:
        /i\s+know\s+where\s+you\s+(live|stay|sleep|work|study|hangout|commute)/i
    },

    {
      category: 'CYBERSTALKING_DOXXING',
      weight: 75,
      regex:
        /(watching|stalking)\s+(you|your\s+every\s+move|your\s+house|your\s+window|outside\s+your)/i
    },

    {
      category: 'CYBERSTALKING_DOXXING',
      weight: 70,
      regex:
        /(tracking|monitoring)\s+your\s+(gps|real-time\s+location|ip|device|phone\s+calls)/i
    },

    {
      category: 'CYBERSTALKING_DOXXING',
      weight: 75,
      regex:
        /(i\s+have\s+your|posting\s+your)\s+(home\s+address|phone\s+number|id\s+card|real\s+identity|ssn|aadhaar|location)/i
    },

    // GENDER BASED HARASSMENT

    {
      category: 'GENDER_BASED_HARASSMENT',
      weight: 75,
      regex:
        /(slut|whore|bitch|cunt)\s+(deserves|needs\s+to\s+be|should\s+be)/i
    },

    {
      category: 'GENDER_BASED_HARASSMENT',
      weight: 80,
      regex:
        /i\s+will\s+(assault|rape|violate|force)\s+you/i
    },

    {
      category: 'GENDER_BASED_HARASSMENT',
      weight: 65,
      regex:
        /you\s+are\s+(worthless|ugly|disgusting)\s+(kill\s+yourself|nobody\s+cares)/i
    },

    // COERCION & MANIPULATION

    {
      category: 'COERCION_MANIPULATION',
      weight: 70,
      regex:
        /do\s+(what\s+i\s+say|as\s+you\s+are\s+told)\s+or\s+(else|face\s+the\s+consequences)/i
    },

    {
      category: 'COERCION_MANIPULATION',
      weight: 65,
      regex:
        /(no\s+one\s+will\s+believe\s+you|if\s+you\s+tell\s+anyone\s+i\s+will)/i
    },

    {
      category: 'COERCION_MANIPULATION',
      weight: 65,
      regex:
        /you\s+have\s+(\d+\s+hours|24h|until\s+tonight)\s+to\s+(respond|reply|comply|send)/i
    },

    // PHISHING & OTP FRAUD

    {
      category: 'PHISHING_FRAUD',
      weight: 75,
      regex:
        /(share|send|provide)\s+(your\s+)?(otp|verification\s+code|one-time\s+password|2fa\s+code)\s+(immediately|now|to\s+unlock)/i
    },

    {
      category: 'PHISHING_FRAUD',
      weight: 70,
      regex:
        /account\s+(has\s+been\s+suspended|will\s+be\s+terminated|blocked)\s+(click\s+here|verify\s+now|confirm\s+identity)/i
    },

    {
      category: 'PHISHING_FRAUD',
      weight: 65,
      regex:
        /(login|enter)\s+your\s+(netbanking|credit\s+card|password|pin|security\s+pin)\s+to\s+(claim|prevent\s+closure)/i
    }
  ];

  // ============================================================
  // 8. PAGE THREAT SCANNER
  // ============================================================

  function scanPageTextThreats() {

    if (hasVaultedEvidence) {
      return;
    }

    const pageText =
      document.body
        ? document.body.innerText
        : '';

    if (
      !pageText ||
      pageText.trim().length < 8
    ) {
      return;
    }

    // ----------------------------------------------------------
    // A. EXISTING REGEX ENGINE
    // ----------------------------------------------------------

    let regexScore = 0;

    const matchesFound = [];

    let regexCategory =
      'SECURITY_THREAT';

    let snippet = '';

    for (const pattern of THREAT_PATTERNS) {

      const match =
        pageText.match(pattern.regex);

      if (match) {

        regexScore += pattern.weight;

        regexCategory =
          pattern.category;

        matchesFound.push(
          match[0]
        );

        if (!snippet) {

          const matchIndex =
            match.index || 0;

          const start =
            Math.max(
              0,
              matchIndex - 50
            );

          const end =
            Math.min(
              pageText.length,
              matchIndex +
              match[0].length +
              50
            );

          snippet =
            pageText
              .substring(start, end)
              .replace(/\s+/g, ' ')
              .trim();
        }
      }
    }

    regexScore =
      Math.min(100, regexScore);

    // ----------------------------------------------------------
    // B. AI NAIVE BAYES ENGINE
    // ----------------------------------------------------------

    const aiResult =
      classifyWithAI(pageText);

    const aiScore =
      calculateAIScore(aiResult);

    let finalScore =
      regexScore;

    let primaryCategory =
      regexCategory;

    // AI result is used when it detects a threat
    // with reasonable confidence.
    if (
      aiResult &&
      aiResult.category !== 'SAFE' &&
      aiResult.confidence >= 0.60
    ) {

      if (aiScore > finalScore) {

        finalScore = aiScore;

        primaryCategory =
          aiResult.category;
      }

      if (
        !matchesFound.includes(
          `AI: ${aiResult.category}`
        )
      ) {

        matchesFound.push(
          `AI Classification: ${aiResult.category} (${Math.round(aiResult.confidence * 100)}% confidence)`
        );
      }
    }

    finalScore =
      Math.min(100, finalScore);

    // ----------------------------------------------------------
    // C. DISPLAY AI RESULT IN CONSOLE
    // ----------------------------------------------------------

    if (aiResult) {

      console.log(
        '[AegisHer AI] Classification:',
        aiResult.category,
        '| Confidence:',
        Math.round(
          aiResult.confidence * 100
        ) + '%',
        '| AI Score:',
        aiScore
      );
    }

    // ----------------------------------------------------------
    // D. VAULT HIGH-RISK THREATS
    // ----------------------------------------------------------

    if (
      finalScore >= 75 &&
      !hasVaultedEvidence
    ) {

      hasVaultedEvidence = true;

      console.warn(
        `[AegisHer Engine] High-risk threat detected (${finalScore}/100) in category: ${primaryCategory}`
      );

      updateShieldState(
        true,
        `🚨 AegisHer — THREAT VAULTED (${finalScore}/100)`
      );

      chrome.runtime.sendMessage(
        {
          action: 'THREAT_DETECTED',

          score: finalScore,

          threatType:
            primaryCategory,

          matches:
            matchesFound,

          snippet:
            snippet ||
            pageText.slice(0, 200),

          url:
            window.location.href,

          title:
            document.title,

          aiCategory:
            aiResult
              ? aiResult.category
              : null,

          aiConfidence:
            aiResult
              ? aiResult.confidence
              : null
        },
        (response) => {

          if (chrome.runtime.lastError) {
            return;
          }

          showToastAlert(
            `🚨 AegisHer Shield: ${primaryCategory.replace(/_/g, ' ')} (${finalScore}/100) Detected! Evidence automatically captured & vaulted.`
          );
        }
      );
    }
  }

  // ============================================================
  // 9. TOAST ALERT
  // ============================================================

  function showToastAlert(message) {

    if (
      document.getElementById(
        'aegis-toast-alert'
      )
    ) {
      return;
    }

    const toast =
      document.createElement('div');

    toast.id =
      'aegis-toast-alert';

    toast.innerHTML = `
      <span style="font-size:18px;">
        🛡️
      </span>

      <div>

        <strong>
          AegisHer Evidence Vault
        </strong>

        <div
          style="
            font-size:12px;
            color:#cbd5e1;
            margin-top:2px;
          "
        >
          ${message}
        </div>

      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(
      () => {

        if (toast) {
          toast.remove();
        }

      },
      6000
    );
  }

  // ============================================================
  // 10. INITIALIZATION
  // ============================================================

  function init() {

    injectShieldWidget();

    // Run existing rule-based scanner
    scanPageTextThreats();

    // Watch dynamic content such as:
    // chats, comments and social media messages
    const observer =
      new MutationObserver(
        () => {

          if (!hasVaultedEvidence) {
            scanPageTextThreats();
          }

        }
      );

    if (document.body) {

      observer.observe(
        document.body,
        {
          childList: true,
          subtree: true,
          characterData: true
        }
      );
    }
  }

  // Start extension
  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init
    );

  } else {

    init();
  }

  // Additional scan after page finishes loading
  window.addEventListener(
    'load',
    () => {

      setTimeout(
        scanPageTextThreats,
        800
      );

    }
  );

  // Start loading the trained AI model
  loadThreatModel();

  // Manual testing helper
  window.__AegisHerTestScan =
    scanPageTextThreats;

})();