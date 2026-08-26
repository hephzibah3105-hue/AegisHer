// AegisHer Evidence Vault Script

document.addEventListener('DOMContentLoaded', () => {
  const incidentListEl = document.getElementById('incident-list');
  const totalCountEl = document.getElementById('total-count');
  const exportAllBtn = document.getElementById('export-all-btn');
  const clearVaultBtn = document.getElementById('clear-vault-btn');
  const seedDemoBtn = document.getElementById('seed-demo-btn');

  let currentVault = [];

  // 1. Load Evidence Vault from Storage
  function loadVaultData() {
    chrome.storage.local.get(['aegis_evidence_vault'], (res) => {
      currentVault = res.aegis_evidence_vault || [];
      renderVaultUI(currentVault);
    });
  }

  // 2. Render Incident Cards
  function renderVaultUI(vault) {
    totalCountEl.textContent = vault.length;
    incidentListEl.innerHTML = '';

    if (!vault || vault.length === 0) {
      incidentListEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛡️</div>
          <h3>No Evidence Items Vaulted Yet</h3>
          <p>AegisHer automatically snapshots evidence when high-severity threats (Threat Score ≥ 80) are detected on web pages.</p>
          <button class="btn btn-export" id="empty-seed-btn">
            <span>+ Load Demo Threat Incident</span>
          </button>
        </div>
      `;
      document.getElementById('empty-seed-btn')?.addEventListener('click', seedDemoIncident);
      return;
    }

    vault.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'incident-card';

      const formattedDate = new Date(item.timestamp).toLocaleString();
      const matchesStr = (item.matches && item.matches.length > 0)
        ? item.matches.join(', ')
        : 'Multiple extortion/stalking patterns detected';

      card.innerHTML = `
        <div class="incident-meta">
          <div class="meta-left">
            <span class="badge-type">${escapeHtml(item.threatType || 'HIGH_RISK_THREAT')}</span>
            <span class="score-tag">Threat Score: ${item.threatScore} / 100</span>
          </div>
          <div class="timestamp">📅 ${formattedDate} (ID: ${escapeHtml(item.id || 'N/A')})</div>
        </div>

        <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">${escapeHtml(item.title || 'Target Web Page')}</div>
        <div class="incident-url">🔗 ${escapeHtml(item.url || 'Unknown URL')}</div>

        <div class="snippet-box">
          <strong>Extracted Text Evidence Snippet:</strong><br/>
          <em>"${escapeHtml(item.snippet || 'Extortion text pattern detected on page.')}"</em>
          <div style="margin-top: 6px; font-size: 11px; color: #f87171;">
            Matched Threat Terms: <strong>[${escapeHtml(matchesStr)}]</strong>
          </div>
        </div>

        <div class="screenshot-section">
          <label>📸 Captured Tab Evidence Screenshot:</label>
          ${
            item.screenshot
              ? `<img src="${item.screenshot}" alt="Evidence Screenshot" class="screenshot-img" />`
              : `<div class="no-screenshot">Screenshot unavailable for this entry.</div>`
          }
        </div>

        <div class="incident-actions">
          <button class="btn btn-secondary export-single-btn" data-index="${index}">
            <span>📄 Export This Incident (.txt)</span>
          </button>
          <button class="btn btn-danger delete-single-btn" data-index="${index}">
            <span>Delete</span>
          </button>
        </div>
      `;

      incidentListEl.appendChild(card);
    });

    // Attach button listeners
    document.querySelectorAll('.export-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        exportSingleIncidentReport(currentVault[idx]);
      });
    });

    document.querySelectorAll('.delete-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        deleteSingleIncident(idx);
      });
    });
  }

  // 3. Export Full Incident Report (.txt)
  function exportFullIncidentReport() {
    if (!currentVault || currentVault.length === 0) {
      alert('No vaulted incidents available to export.');
      return;
    }

    let reportText = `========================================================================\n`;
    reportText += `                AEGISHER OFFICIAL INCIDENT REPORT               \n`;
    reportText += `             Tamper-Evident Cyber Harassment Evidence           \n`;
    reportText += `========================================================================\n\n`;
    reportText += `Generated Date: ${new Date().toISOString()}\n`;
    reportText += `Total Incidents Recorded: ${currentVault.length}\n`;
    reportText += `System Integrity: AEGISHER AI PROTECTION SHIELD V1.0\n\n`;

    currentVault.forEach((item, idx) => {
      reportText += `------------------------------------------------------------------------\n`;
      reportText += `INCIDENT #${idx + 1} | ID: ${item.id}\n`;
      reportText += `------------------------------------------------------------------------\n`;
      reportText += `Timestamp    : ${item.timestamp}\n`;
      reportText += `Threat Type  : ${item.threatType}\n`;
      reportText += `Threat Score : ${item.threatScore} / 100\n`;
      reportText += `Target URL   : ${item.url}\n`;
      reportText += `Page Title   : ${item.title}\n`;
      reportText += `Matched Terms: ${item.matches ? item.matches.join(', ') : 'N/A'}\n\n`;
      reportText += `EXTRACTED TEXT EVIDENCE:\n`;
      reportText += `"${item.snippet}"\n\n`;
      reportText += `SCREENSHOT ATTACHMENT:\n`;
      reportText += `${item.screenshot ? '[PNG Base64 Encoded Image Data Attached]' : '[No Screenshot]'}\n\n`;
    });

    reportText += `========================================================================\n`;
    reportText += `END OF INCIDENT REPORT - AEGISHER LEGAL VAULT\n`;
    reportText += `========================================================================\n`;

    downloadFile(reportText, `AegisHer_Incident_Report_${Date.now()}.txt`, 'text/plain');
  }

  function exportSingleIncidentReport(item) {
    let reportText = `========================================================================\n`;
    reportText += `                AEGISHER INCIDENT REPORT - ${item.id}           \n`;
    reportText += `========================================================================\n\n`;
    reportText += `Timestamp    : ${item.timestamp}\n`;
    reportText += `Threat Category: ${item.threatType}\n`;
    reportText += `Threat Score : ${item.threatScore} / 100\n`;
    reportText += `Target URL   : ${item.url}\n`;
    reportText += `Page Title   : ${item.title}\n`;
    reportText += `Matched Terms: ${item.matches ? item.matches.join(', ') : 'N/A'}\n\n`;
    reportText += `EXTRACTED EVIDENCE TEXT:\n`;
    reportText += `"${item.snippet}"\n\n`;
    reportText += `========================================================================\n`;

    downloadFile(reportText, `Incident_${item.id}.txt`, 'text/plain');
  }

  function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // 4. Seed Demo Incident
  function seedDemoIncident() {
    // Generate a simple sample image placeholder canvas for demo screenshot
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 600, 300);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('⚠️ AEGISHER EVIDENCE CAPTURE DEMO', 40, 60);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px sans-serif';
    ctx.fillText('Url: https://suspicious-threat-forum.xyz/messages', 40, 100);
    ctx.fillText('Text: "Send money within 24h or I will leak your private videos..."', 40, 140);
    ctx.fillStyle = '#10b981';
    ctx.fillText('AegisHer Security Snapshot Validated ✅', 40, 220);

    const demoScreenshot = canvas.toDataURL('image/png');

    const demoItem = {
      id: 'ev_demo_' + Date.now().toString().substring(8),
      timestamp: new Date().toISOString(),
      url: 'https://suspicious-threat-forum.xyz/messages/extortion-thread',
      title: 'Suspicious Messaging Thread - Threat Alert',
      threatScore: 92,
      threatType: 'BLACKMAIL_EXTORTION',
      matches: ['leak your private videos', 'send money within 24h', 'expose you to your friends'],
      snippet: 'Send 0.5 BTC or $500 cash within 24h or I will leak your private videos and expose you to your family and all your social media contacts.',
      screenshot: demoScreenshot
    };

    chrome.storage.local.get(['aegis_evidence_vault'], (res) => {
      const vault = res.aegis_evidence_vault || [];
      vault.unshift(demoItem);
      chrome.storage.local.set({ aegis_evidence_vault: vault }, () => {
        loadVaultData();
      });
    });
  }

  function deleteSingleIncident(index) {
    if (confirm('Are you sure you want to delete this vaulted evidence item?')) {
      currentVault.splice(index, 1);
      chrome.storage.local.set({ aegis_evidence_vault: currentVault }, () => {
        loadVaultData();
      });
    }
  }

  function clearAllVault() {
    if (confirm('Are you sure you want to clear ALL evidence from your vault? This cannot be undone.')) {
      chrome.storage.local.set({ aegis_evidence_vault: [] }, () => {
        loadVaultData();
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Event Listeners
  exportAllBtn.addEventListener('click', exportFullIncidentReport);
  clearVaultBtn.addEventListener('click', clearAllVault);
  seedDemoBtn.addEventListener('click', seedDemoIncident);

  // Initialize
  loadVaultData();
});
