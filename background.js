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

    // Capture visible tab screenshot as evidence
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      const lastError = chrome.runtime.lastError;
      const screenshotData = lastError ? null : dataUrl;

      const evidenceRecord = {
        id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        url: url || (sender.tab ? sender.tab.url : 'Unknown URL'),
        title: title || (sender.tab ? sender.tab.title : 'Page Capture'),
        threatScore: score,
        threatType: threatType || 'HIGH_RISK_THREAT',
        matches: matches || [],
        snippet: snippet || '',
        screenshot: screenshotData
      };

      // Save into chrome.storage.local
      chrome.storage.local.get(['aegis_evidence_vault', 'risks_blocked'], (res) => {
        const currentVault = res.aegis_evidence_vault || [];
        currentVault.unshift(evidenceRecord);
        const risksBlocked = (res.risks_blocked || 0) + 1;
        chrome.storage.local.set({ aegis_evidence_vault: currentVault, risks_blocked: risksBlocked }, () => {
          console.log(`[AegisHer] Evidence vaulted successfully for threat score ${score}. ID: ${evidenceRecord.id}`);

          // Forward telemetry to local Python server
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

          // Broadcast alert to active extension pages
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
    chrome.storage.local.get(['aegis_evidence_vault'], (res) => {
      sendResponse({ vault: res.aegis_evidence_vault || [] });
    });
    return true;
  }

  if (request.action === 'HONEYPOT_TRIGGERED') {
    const { trapType, detail, score, threatType, url, title } = request;

    // Set extension badge to warning mode
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });

    // Capture visible tab evidence screenshot
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      const lastError = chrome.runtime.lastError;
      const screenshotData = lastError ? null : dataUrl;

      const evidenceId = 'hp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const honeypotRecord = {
        id: evidenceId,
        timestamp: new Date().toISOString(),
        url: url || (sender.tab ? sender.tab.url : 'Unknown URL'),
        title: title || (sender.tab ? sender.tab.title : 'Honeypot Decoy Page'),
        threatScore: score || 95,
        threatType: threatType || 'AUTOMATED_BOT',
        matches: [trapType],
        snippet: detail || '',
        screenshot: screenshotData,
        isHoneypot: true
      };

      // Save to evidence vault, logs, and statistics
      chrome.storage.local.get(['aegis_evidence_vault', 'aegis_honeypot_logs', 'aegis_honeypot_stats', 'risks_blocked'], (res) => {
        const vault = res.aegis_evidence_vault || [];
        vault.unshift(honeypotRecord);

        const hpLogs = res.aegis_honeypot_logs || [];
        hpLogs.unshift(honeypotRecord);

        const hpStats = res.aegis_honeypot_stats || { totalBaited: 0, decoyInput: 0, apiHook: 0, decoyLink: 0 };
        hpStats.totalBaited += 1;
        if (trapType.includes('INPUT')) hpStats.decoyInput += 1;
        else if (trapType.includes('API')) hpStats.apiHook += 1;
        else if (trapType.includes('LINK')) hpStats.decoyLink += 1;

        const risksBlocked = (res.risks_blocked || 0) + 1;

        chrome.storage.local.set({
          aegis_evidence_vault: vault,
          aegis_honeypot_logs: hpLogs,
          aegis_honeypot_stats: hpStats,
          risks_blocked: risksBlocked
        }, () => {
          console.log(`[AegisHer] Honeypot record saved. Threat: ${threatType}. ID: ${evidenceId}`);

          // Forward telemetry to local Python server
          fetch('http://localhost:5000/api/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timestamp: honeypotRecord.timestamp,
              event: 'HONEYPOT_TRIGGERED',
              threatType: honeypotRecord.threatType,
              score: honeypotRecord.threatScore,
              trapType: trapType,
              url: honeypotRecord.url,
              details: honeypotRecord.snippet
            })
          }).catch(err => console.warn('[AegisHer Background] Local telemetry server offline.'));

          // Broadcast alert to active extension pages
          chrome.runtime.sendMessage({
            action: 'REALTIME_ALERT',
            threat: honeypotRecord
          }).catch(e => { /* ignore error when views closed */ });

          sendResponse({ success: true, logged: true });
        });
      });
    });
    return true; // Keep channel open for async response
  }
});
