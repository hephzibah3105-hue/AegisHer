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
      const isHoneypot = !!item.isHoneypot;
      const badgeType = escapeHtml(item.threatType || 'HIGH_RISK_THREAT');
      const matchesLabel = isHoneypot ? 'Triggered Trap Type' : 'Matched Threat Terms';
      const matchesStr = (item.matches && item.matches.length > 0)
        ? item.matches.join(', ')
        : (isHoneypot ? 'Stealth honeypot interaction' : 'Multiple extortion/stalking patterns detected');

      card.innerHTML = `
        <div class="incident-meta">
          <div class="meta-left">
            <span class="badge-type" style="${isHoneypot ? 'background: rgba(239, 68, 68, 0.25); color: #ef4444; border-color: rgba(239, 68, 68, 0.4);' : ''}">${badgeType}</span>
            <span class="score-tag">Threat Score: ${item.threatScore} / 100</span>
          </div>
          <div class="timestamp">📅 ${formattedDate} (ID: ${escapeHtml(item.id || 'N/A')})</div>
        </div>

        <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">${escapeHtml(item.title || 'Target Web Page')}</div>
        <div class="incident-url">🔗 ${escapeHtml(item.url || 'Unknown URL')}</div>

        <div class="snippet-box" style="${isHoneypot ? 'border-left-color: #ef4444;' : ''}">
          <strong>${isHoneypot ? 'Honeypot Trap Evidence Log:' : 'Extracted Evidence Text Evidence Snippet:'}</strong><br/>
          <em>"${escapeHtml(item.snippet || 'Extortion text pattern detected on page.')}"</em>
          <div style="margin-top: 6px; font-size: 11px; color: #f87171;">
            ${matchesLabel}: <strong>[${escapeHtml(matchesStr)}]</strong>
          </div>
        </div>

        <div class="screenshot-section">
          <label>📸 Captured Tab Evidence Screenshot:</label>
          ${item.screenshot
          ? `<img src="${item.screenshot}" alt="Evidence Screenshot" class="screenshot-img" />`
          : `<div class="no-screenshot">Screenshot unavailable for this entry.</div>`
        }
        </div>

        <div class="incident-actions" style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px;">
        <button class="btn btn-secondary export-single-txt" data-id="${item.id}" style="font-size: 12px; padding: 6px 12px;">📄 Export TXT</button>
        <button class="btn btn-primary export-single-pdf" data-id="${item.id}" style="font-size: 12px; padding: 6px 12px; background: linear-gradient(135deg, #0284c7, #2563eb);">📑 Export PDF</button>
        <button class="btn btn-danger delete-single-btn" data-index="${index}" style="font-size: 12px; padding: 6px 12px;">Delete</button>
      </div>
      `;

      incidentListEl.appendChild(card);
    });

    // Attach button listeners for individual card exports
    document.querySelectorAll('.export-single-txt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const incidentId = e.currentTarget.getAttribute('data-id');
        const item = currentVault.find(v => v.id === incidentId);
        if (item) exportSingleIncidentReportTXT(item);
      });
    });

    document.querySelectorAll('.export-single-pdf').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const incidentId = e.currentTarget.getAttribute('data-id');
        const item = currentVault.find(v => v.id === incidentId);
        if (item) exportSingleIncidentReportPDF(item);
      });
    });

    document.querySelectorAll('.delete-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        deleteSingleIncident(idx);
      });
    });
  }

  // --- 3A. Full Incident TXT Exporter ---
  function exportFullIncidentReportTXT() {
    if (!currentVault || currentVault.length === 0) {
      alert('No vaulted incidents available to export.');
      return;
    }

    let reportText = `======================================================================\n`;
    reportText += `               AEGISHER OFFICIAL INCIDENT REPORT                     \n`;
    reportText += `            Tamper-Evident Cyber Harassment Evidence                 \n`;
    reportText += `======================================================================\n\n`;
    reportText += `Generated Date: ${new Date().toISOString()}\n`;
    reportText += `Total Incidents Recorded: ${currentVault.length}\n`;
    reportText += `System Integrity: AEGISHER AI PROTECTION SHIELD V1.0\n\n`;

    currentVault.forEach((item, idx) => {
      reportText += `----------------------------------------------------------------------\n`;
      reportText += `INCIDENT #${idx + 1} | ID: ${item.id}\n`;
      reportText += `----------------------------------------------------------------------\n`;
      reportText += `Timestamp     : ${item.timestamp}\n`;
      reportText += `Threat Type   : ${item.threatType || item.category || 'THREAT_DETECTED'}\n`;
      reportText += `Threat Score  : ${item.threatScore || 85} / 100\n`;
      reportText += `Target URL    : ${item.url || 'N/A'}\n`;
      reportText += `Page Title    : ${item.title || 'N/A'}\n`;
      reportText += `Matched Terms : ${item.matches ? item.matches.join(', ') : 'N/A'}\n\n`;
      reportText += `EXTRACTED EVIDENCE TEXT:\n`;
      reportText += `"${item.snippet || 'No text snippet'}"\n\n`;
      reportText += `SCREENSHOT ATTACHMENT:\n`;
      reportText += `${item.screenshot ? '[PNG Base64 Encoded Image Data Attached]' : '[No Screenshot Recorded]'}\n\n`;
    });

    reportText += `======================================================================\n`;
    reportText += `END OF INCIDENT REPORT - AEGISHER LEGAL VAULT\n`;
    reportText += `======================================================================\n`;

    downloadFile(reportText, `AegisHer_Incident_Report_${Date.now()}.txt`, 'text/plain');
  }

  // --- 3B. Single Incident TXT Exporter ---
  function exportSingleIncidentReportTXT(item) {
    if (!item) return;
    let reportText = `======================================================================\n`;
    reportText += `     AEGISHER INCIDENT REPORT - ${item.id}\n`;
    reportText += `======================================================================\n\n`;
    reportText += `Timestamp      : ${item.timestamp}\n`;
    reportText += `Threat Category: ${item.threatType || item.category || 'SECURITY_THREAT'}\n`;
    reportText += `Threat Score   : ${item.threatScore || 85} / 100\n`;
    reportText += `Target URL     : ${item.url || 'N/A'}\n`;
    reportText += `Page Title     : ${item.title || 'N/A'}\n`;
    reportText += `Matched Terms  : ${item.matches ? item.matches.join(', ') : 'N/A'}\n\n`;
    reportText += `EXTRACTED EVIDENCE TEXT:\n"${item.snippet || 'No text snippet'}"\n\n`;
    reportText += `======================================================================\n`;

    downloadFile(reportText, `Incident_${item.id}.txt`, 'text/plain');
  }

  // --- 3C. Single Incident PDF Exporter ---
  function exportSingleIncidentReportPDF(item) {
    if (!item) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('AEGISHER -- SINGLE INCIDENT REPORT', 14, 16);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Incident ID: ${item.id} | Generated: ${new Date().toUTCString()}`, 14, 23);

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(12, 36, 186, 48, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Category: ${item.threatType || item.category || 'SECURITY_THREAT'}`, 16, 44);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Timestamp: ${item.timestamp || 'N/A'}`, 16, 51);
    doc.text(`Threat Score: ${item.threatScore || 85}/100`, 135, 51);
    doc.text(`Target URL: ${item.url || 'N/A'}`, 16, 58);
    doc.text(`Matched Patterns: ${item.matches ? item.matches.join(', ') : 'N/A'}`, 16, 65);

    doc.setTextColor(225, 29, 72);
    doc.setFont('helvetica', 'bold');
    doc.text('Extracted Evidence Payload:', 14, 94);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    const snippet = item.snippet || 'No text snippet recorded';
    const lines = doc.splitTextToSize(`"${snippet}"`, 182);
    doc.text(lines, 14, 102);

    if (item.screenshot && item.screenshot.startsWith('data:image')) {
      try {
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'bold');
        doc.text('Forensic Screenshot:', 14, 126);
        doc.addImage(item.screenshot, 'JPEG', 14, 132, 140, 78);
      } catch (e) {
        console.warn('PDF image render skipped:', e);
      }
    }

    doc.save(`Incident_${item.id}.pdf`);
  }

  // --- 3D. Full Dossier PDF Exporter ---
  function exportFullIncidentReportPDF() {
    if (!currentVault || currentVault.length === 0) {
      alert('No vaulted incidents available to export.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AEGISHER -- FORENSIC EVIDENCE DOSSIER', 14, 16);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toUTCString()} | Chain of Custody Verified`, 14, 23);

    let yPos = 36;

    currentVault.forEach((item, idx) => {
      const hasImage = item.screenshot && item.screenshot.startsWith('data:image');
      const cardHeight = hasImage ? 85 : 52;

      if (yPos + cardHeight > 275) {
        doc.addPage();
        yPos = 20;
      }

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(12, yPos, 186, cardHeight, 2, 2, 'FD');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Incident #${idx + 1} [ID: ${item.id || 'N/A'}]`, 16, yPos + 7);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Category: ${item.threatType || item.category || 'DETECTED THREAT'}`, 16, yPos + 13);
      doc.text(`Threat Score: ${item.threatScore || 85}/100`, 135, yPos + 13);
      doc.text(`Timestamp: ${item.timestamp || 'N/A'}`, 16, yPos + 19);
      doc.text(`Target URL: ${item.url || 'Local Page / Direct Context'}`, 16, yPos + 25);

      doc.setTextColor(225, 29, 72);
      doc.setFont('helvetica', 'bold');
      doc.text('Extracted Evidence Payload:', 16, yPos + 32);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      const snippet = item.snippet || 'No text snippet recorded';
      const lines = doc.splitTextToSize(`"${snippet}"`, 175);
      doc.text(lines, 16, yPos + 38);

      if (hasImage) {
        try {
          doc.addImage(item.screenshot, 'JPEG', 16, yPos + 44, 60, 36);
        } catch (e) {
          console.warn('PDF image render skipped:', e);
        }
      }

      yPos += cardHeight + 6;
    });

    doc.save(`AegisHer_Evidence_Report_${Date.now()}.pdf`);
  }

  function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // --- 4. Seed Demo Incident ---
  function seedDemoIncident() {
    // 1. Text Blackmail Demo Screenshot
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

    // 2. Honeypot Automated Scraper Demo Screenshot
    const canvas2 = document.createElement('canvas');
    canvas2.width = 600;
    canvas2.height = 300;
    const ctx2 = canvas2.getContext('2d');
    ctx2.fillStyle = '#0f172a';
    ctx2.fillRect(0, 0, 600, 300);
    ctx2.fillStyle = '#ef4444';
    ctx2.font = 'bold 20px sans-serif';
    ctx2.fillText('🚨 AEGISHER HONEYPOT AI ISOLATION DETECTED', 40, 60);
    ctx2.fillStyle = '#cbd5e1';
    ctx2.font = '14px sans-serif';
    ctx2.fillText('Url: https://bait-target-portal.local/checkout', 40, 100);
    ctx2.fillText('Trap Type: API_HOOK_ACCESS (Decoy key property read)', 40, 140);
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('Active Page Isolation Shield Enabled 🛡️', 40, 220);

    const hpScreenshot = canvas2.toDataURL('image/png');

    const hpItem = {
      id: 'ev_demo_hp_' + Date.now().toString().substring(8),
      timestamp: new Date(Date.now() - 30000).toISOString(),
      url: 'https://bait-target-portal.local/checkout',
      title: 'Decoy Checkout Portal - Protected Area',
      threatScore: 95,
      threatType: 'AUTOMATED_BOT',
      matches: ['API_HOOK_ACCESS'],
      snippet: 'Automated script attempted to access window._aegisDecoyCredentials configuration parameters.',
      screenshot: hpScreenshot,
      isHoneypot: true
    };

    chrome.storage.local.get(['aegis_evidence_vault'], (res) => {
      const vault = res.aegis_evidence_vault || [];
      vault.unshift(demoItem);
      vault.unshift(hpItem);
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

  // --- Event Listeners ---
  const clearBtn = document.getElementById('clear-vault-btn');
  if (clearBtn) clearBtn.addEventListener('click', clearAllVault);

  const demoBtn = document.getElementById('add-demo-btn') || document.getElementById('seed-demo-btn');
  if (demoBtn) demoBtn.addEventListener('click', seedDemoIncident);

  const exportTxtBtn = document.getElementById('export-txt-btn');
  if (exportTxtBtn) exportTxtBtn.addEventListener('click', exportFullIncidentReportTXT);

  const exportPdfBtn = document.getElementById('export-pdf-btn');
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportFullIncidentReportPDF);

  // Initialize Vault Data
  loadVaultData();
});
