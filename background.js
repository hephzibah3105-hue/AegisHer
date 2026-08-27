// AegisHer Background Service Worker (Manifest V3)

console.log('AegisHer Service Worker active.');

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AegisHer AI Protection installed.');
  // Initialize storage if empty
  chrome.storage.local.get(['aegis_evidence_vault', 'aegis_honeypot_logs', 'aegis_honeypot_stats'], (result) => {
    if (!result.aegis_evidence_vault) {
      chrome.storage.local.set({ aegis_evidence_vault: [] });
    }
    if (!result.aegis_honeypot_logs) {
      chrome.storage.local.set({ aegis_honeypot_logs: [] });
    }
    if (!result.aegis_honeypot_stats) {
      chrome.storage.local.set({ aegis_honeypot_stats: { totalBaited: 0, decoyInput: 0, apiHook: 0, decoyLink: 0 } });
    }
  });
});

// Heuristic Risk Scoring Engine for URLs
function calculateUrlRiskScore(urlString) {
  let score = 0;
  const factors = [];

  try {
    const urlObj = new URL(urlString);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    const fullUrl = urlString.toLowerCase();

    // 1. IP address hostname check
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(hostname)) {
      score += 40;
      factors.push('Host uses raw IP address instead of domain name (+40)');
    }

    // 2. Suspicious High-Risk TLD check
    const highRiskTLDs = ['.xyz', '.top', '.phishing', '.cc', '.ru', '.work', '.click', '.tk', '.ml', '.ga', '.cf', '.gq', '.biz', '.info', '.zip', '.mov', '.country', '.kim'];
    if (highRiskTLDs.some(tld => hostname.endsWith(tld))) {
      score += 30;
      factors.push('Domain uses high-risk top-level domain (+30)');
    }

    // 3. Deceptive or Sensitive Keywords in URL
    const threatKeywords = ['login', 'verify', 'account', 'security', 'update', 'banking', 'paypal', 'crypto', 'wallet', 'claim', 'nude', 'leak', 'threat', 'ransom', 'blackmail', 'extort', 'passcode', 'credential'];
    const matchedKeywords = threatKeywords.filter(kw => fullUrl.includes(kw));
    if (matchedKeywords.length > 0) {
      const kwScore = Math.min(30, matchedKeywords.length * 15);
      score += kwScore;
      factors.push(`Contains suspicious security/threat keywords: [${matchedKeywords.join(', ')}] (+${kwScore})`);
    }

    // 4. Excessive Subdomains or Typo-squatting indicators
    const domainParts = hostname.split('.');
    if (domainParts.length > 3) {
      score += 15;
      factors.push('Excessive subdomain depth indicating potential spoofing (+15)');
    }

    // 5. Insecure Protocol for Sensitive Operations
    if (urlObj.protocol === 'http:' && matchedKeywords.length > 0) {
      score += 20;
      factors.push('Insecure HTTP connection for login/sensitive parameters (+20)');
    }

    // 6. Long URL / Encoded Entropy
    if (fullUrl.length > 130) {
      score += 10;
      factors.push('Excessively long URL with possible obfuscation (+10)');
    }

  } catch (e) {
    // Malformed URL
    score += 50;
    factors.push('Malformed or unparseable URL (+50)');
  }

  score = Math.min(100, Math.max(0, score));

  let riskLevel = 'LOW';
  if (score >= 75) riskLevel = 'CRITICAL';
  else if (score >= 60) riskLevel = 'HIGH';
  else if (score >= 35) riskLevel = 'MEDIUM';

  return { score, riskLevel, factors };
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'UPDATE_LIVE_PAGE_STATS') {
    const tabId = sender.tab ? sender.tab.id : 'global';
    chrome.storage.local.set({
      [`tab_stats_${tabId}`]: request.stats
    });
    return true;
  }

  if (request.action === 'ANALYZE_LINK') {
    fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: request.url })
    })
      .then(res => res.json())
      .then(data => {
        sendResponse({
          score: data.score,
          riskLevel: data.riskLevel || 'LOW',
          factors: data.factors || []
        });
      })
      .catch(err => {
        console.warn('[AegisHer Background] Local backend offline, falling back to local heuristic calculation:', err);
        const analysis = calculateUrlRiskScore(request.url);
        sendResponse(analysis);
      });
    return true;
  }

  if (request.action === 'THREAT_DETECTED') {
    const { score, threatType, matches, snippet, url, title } = request;

    if (score < 80) {
      sendResponse({ success: false, reason: 'Threat score below 80 threshold' });
      return true;
    }

    const targetWindowId = (sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;
    const targetUrl = (sender.tab && sender.tab.url) ? sender.tab.url : (url || 'Unknown URL');
    const targetTitle = (sender.tab && sender.tab.title) ? sender.tab.title : (title || 'Page Capture');

    // Capture visible tab screenshot for the specific target window
    chrome.tabs.captureVisibleTab(targetWindowId, { format: 'jpeg', quality: 60 }, (dataUrl) => {
      const lastError = chrome.runtime.lastError;
      const screenshotData = lastError ? null : dataUrl;

      const evidenceRecord = {
        id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        url: targetUrl,
        title: targetTitle,
        threatScore: score,
        threatType: threatType || 'HIGH_RISK_THREAT',
        threatCategory: threatType || 'HIGH_RISK_THREAT',
        matches: matches || [],
        snippet: snippet || '',
        screenshot: screenshotData
      };

      chrome.storage.local.get({ aegis_vault: [], aegis_evidence_vault: [] }, (res) => {
        const currentVault = res.aegis_vault || res.aegis_evidence_vault || [];
        currentVault.unshift(evidenceRecord);
        const cappedVault = currentVault.slice(0, 20); // Capped to 20 items

        chrome.storage.local.set({
          aegis_vault: cappedVault,
          aegis_evidence_vault: cappedVault
        }, () => {
          console.log(`[AegisHer] High-severity threat evidence vaulted. Type: ${threatType}, Score: ${score}, ID: ${evidenceRecord.id}`);

          fetch('http://localhost:5000/api/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timestamp: evidenceRecord.timestamp,
              event: 'THREAT_DETECTED',
              threatType: evidenceRecord.threatType,
              score: evidenceRecord.threatScore,
              trapType: 'DOM_CONTENT_ANALYSIS',
              url: evidenceRecord.url,
              details: evidenceRecord.snippet
            })
          }).catch(err => console.warn('[AegisHer Background] Local telemetry server offline.'));

          chrome.runtime.sendMessage({
            action: 'REALTIME_ALERT',
            threat: evidenceRecord
          }).catch(e => { /* ignore error when views closed */ });

          sendResponse({ success: true, evidenceId: evidenceRecord.id });
        });
      });
    });

    return true; // Keep channel open for async response
  }

  if (request.action === 'GET_EVIDENCE_VAULT') {
    chrome.storage.local.get({ aegis_evidence_vault: [], aegis_vault: [] }, (res) => {
      sendResponse({ vault: res.aegis_vault || res.aegis_evidence_vault || [] });
    });
    return true;
  }

  if (request.action === 'CLEAR_VAULT') {
    chrome.storage.local.set({
      aegis_vault: [],
      aegis_evidence_vault: []
    }, () => {
      console.log('[AegisHer] Evidence vault cleared.');
      chrome.runtime.sendMessage({ action: 'REALTIME_ALERT' }).catch(e => {});
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'HONEYPOT_TRIGGERED') {
    const { trapType, detail, score, threatType, url, title } = request;

    chrome.storage.local.get({ aegis_honeypot_stats: { totalBaited: 0, decoyInput: 0, apiHook: 0, decoyLink: 0 } }, (res) => {
      const hpStats = res.aegis_honeypot_stats || { totalBaited: 0, decoyInput: 0, apiHook: 0, decoyLink: 0 };
      hpStats.totalBaited += 1;

      chrome.storage.local.set({ aegis_honeypot_stats: hpStats }, () => {
        sendResponse({ success: true, logged: true });
      });
    });
    return true;
  }

  if (request.action === 'MANUAL_VAULT_CAPTURE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      const targetWindowId = activeTab ? activeTab.windowId : null;
      const targetUrl = activeTab ? activeTab.url : (request.url || 'Active Tab');
      const targetTitle = activeTab ? activeTab.title : (request.title || 'Manual Evidence Capture');

      chrome.tabs.captureVisibleTab(targetWindowId, { format: 'jpeg', quality: 60 }, (dataUrl) => {
        const lastError = chrome.runtime.lastError;
        const screenshotData = lastError ? null : dataUrl;

        const evidenceRecord = {
          id: 'ev_manual_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toISOString(),
          url: targetUrl,
          title: targetTitle,
          threatScore: 'N/A',
          threatType: 'USER_MANUAL_REPORT',
          threatCategory: 'USER_MANUAL_REPORT',
          matches: ['USER_MANUAL_REPORT'],
          snippet: 'Manually vaulted by user via AegisHer Shield overlay.',
          screenshot: screenshotData
        };

        chrome.storage.local.get({ aegis_vault: [], aegis_evidence_vault: [] }, (res) => {
          const currentVault = res.aegis_vault || res.aegis_evidence_vault || [];
          currentVault.unshift(evidenceRecord);
          const cappedVault = currentVault.slice(0, 20);

          chrome.storage.local.set({
            aegis_vault: cappedVault,
            aegis_evidence_vault: cappedVault
          }, () => {
            console.log(`[AegisHer] Manual evidence vaulted successfully. ID: ${evidenceRecord.id}`);

            fetch('http://localhost:5000/api/telemetry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                timestamp: evidenceRecord.timestamp,
                event: 'MANUAL_VAULT_CAPTURE',
                threatType: evidenceRecord.threatType,
                score: evidenceRecord.threatScore,
                trapType: 'MANUAL_EVIDENCE',
                url: evidenceRecord.url,
                details: evidenceRecord.snippet
              })
            }).catch(err => console.warn('[AegisHer Background] Local telemetry server offline.'));

            chrome.runtime.sendMessage({
              action: 'REALTIME_ALERT',
              threat: evidenceRecord
            }).catch(e => { /* ignore error when views closed */ });

            sendResponse({ success: true, evidenceId: evidenceRecord.id });
          });
        });
      });
    });

    return true; // Keep channel open for async response
  }
});
