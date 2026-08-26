// AegisHer Dashboard Interactive Logic

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Identity Shield Check ---
  const identityInput = document.getElementById('identity-input');
  const identitySearchBtn = document.getElementById('identity-search-btn');
  const breachResultBox = document.getElementById('breach-result-box');

  identitySearchBtn.addEventListener('click', () => {
    const query = identityInput.value.trim();
    if (!query) return;

    identitySearchBtn.textContent = 'Scanning...';
    identitySearchBtn.disabled = true;

    setTimeout(() => {
      identitySearchBtn.textContent = 'Scan Now';
      identitySearchBtn.disabled = false;

      const isClean = query.includes('safe') || query.includes('clean');
      if (isClean) {
        breachResultBox.innerHTML = `
          <div class="breach-status-header">
            <strong style="color: #f8fafc; font-size: 13px;">Target: ${escapeHtml(query)}</strong>
            <span style="background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.4); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">No Breaches Found</span>
          </div>
          <div class="breach-details">
            Great news! This identity was not found in any indexed data dumps or cyber threat leaks.
          </div>
          <div style="font-size: 11px; color: #10b981; font-weight: 600; margin-top: 4px;">
            ✅ AegisHer Status: Protected & Clean.
          </div>
        `;
      } else {
        const breachCount = Math.floor(Math.random() * 3) + 2;
        breachResultBox.innerHTML = `
          <div class="breach-status-header">
            <strong style="color: #f8fafc; font-size: 13px;">Target: ${escapeHtml(query)}</strong>
            <span class="badge-breach">${breachCount} Breaches Found</span>
          </div>
          <div class="breach-details">
            Warning: This identity was detected in <strong>${breachCount} breach database leaks</strong> (DarkWeb Forum Leak, Credential Dump v4, SocialData Exposure).
            <div class="tag-list">
              <span class="tag">Hashed Passwords</span>
              <span class="tag">IP Logs</span>
              <span class="tag">Email Metadata</span>
              <span class="tag">Account Tokens</span>
            </div>
          </div>
          <div style="font-size: 11px; color: #10b981; font-weight: 600; margin-top: 4px;">
            💡 AegisHer Recommendation: Update passwords & turn on 2-Factor Authentication immediately.
          </div>
        `;
      }
    }, 600);
  });

  // --- 2. Deepfake & Synthetic Media Detector ---
  const dropzone = document.getElementById('deepfake-dropzone');
  const demoDeepfakeBtn = document.getElementById('demo-deepfake-btn');
  const demoAuthenticBtn = document.getElementById('demo-authentic-btn');
  const scoreText = document.getElementById('deepfake-score-text');
  const scoreFill = document.getElementById('deepfake-score-fill');
  const valFacial = document.getElementById('val-facial');
  const valLighting = document.getElementById('val-lighting');
  const valGan = document.getElementById('val-gan');

  dropzone.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*';
    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) {
        runDeepfakeSimulation(92, '92% (DEEPFAKE DETECTED)', '95 / 100', '89 / 100', '93 / 100');
      }
    };
    fileInput.click();
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#38bdf8';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'rgba(56, 189, 248, 0.3)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'rgba(56, 189, 248, 0.3)';
    runDeepfakeSimulation(96, '96% (CRITICAL DEEPFAKE)', '98 / 100', '94 / 100', '96 / 100');
  });

  demoDeepfakeBtn.addEventListener('click', () => {
    runDeepfakeSimulation(94, '94% (HIGH CONFIDENCE DEEPFAKE)', '96 / 100', '88 / 100', '92 / 100');
  });

  demoAuthenticBtn.addEventListener('click', () => {
    runDeepfakeSimulation(4, '4% (AUTHENTIC MEDIA)', '5 / 100', '3 / 100', '4 / 100');
  });

  function runDeepfakeSimulation(percent, scoreStr, facial, lighting, gan) {
    scoreFill.style.width = '0%';
    setTimeout(() => {
      scoreFill.style.width = percent + '%';
      scoreFill.style.background = percent > 50
        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
        : 'linear-gradient(90deg, #10b981, #059669)';

      scoreText.textContent = scoreStr;
      scoreText.style.color = percent > 50 ? '#ef4444' : '#10b981';

      valFacial.textContent = facial;
      valFacial.style.color = percent > 50 ? '#ef4444' : '#10b981';

      valLighting.textContent = lighting;
      valLighting.style.color = percent > 50 ? '#f59e0b' : '#10b981';

      valGan.textContent = gan;
      valGan.style.color = percent > 50 ? '#ef4444' : '#10b981';
    }, 150);
  }

  // --- 3. Cyber Harassment Heatmap Widget ---
  const heatmapContainer = document.getElementById('heatmap-grid-container');
  const filterBtns = document.querySelectorAll('.filter-btn');

  const platforms = ['Instagram', 'Twitter / X', 'Telegram', 'WhatsApp', 'Web Forums'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Seeded Heatmap dataset
  const heatmapData = {
    ALL: [
      [2, 1, 3, 4, 2, 3, 4], // Instagram
      [4, 3, 2, 4, 3, 4, 2], // Twitter / X
      [1, 2, 4, 3, 4, 2, 3], // Telegram
      [0, 1, 2, 1, 3, 2, 1], // WhatsApp
      [3, 2, 3, 4, 3, 4, 4]  // Web Forums
    ],
    EXTORTION: [
      [1, 0, 2, 4, 1, 3, 3],
      [3, 2, 1, 3, 2, 4, 1],
      [1, 2, 4, 2, 3, 1, 2],
      [0, 1, 1, 0, 2, 1, 0],
      [2, 1, 2, 3, 2, 3, 4]
    ],
    STALKING: [
      [2, 1, 1, 2, 2, 2, 3],
      [2, 3, 1, 2, 3, 2, 2],
      [0, 1, 2, 3, 2, 1, 3],
      [0, 0, 1, 1, 2, 2, 1],
      [1, 2, 2, 3, 2, 3, 2]
    ],
    PHISHING: [
      [0, 1, 2, 1, 1, 1, 2],
      [3, 1, 1, 2, 2, 1, 1],
      [2, 1, 3, 1, 2, 2, 1],
      [1, 2, 1, 0, 1, 1, 0],
      [2, 1, 1, 2, 2, 2, 1]
    ]
  };

  let currentFilter = 'ALL';

  function renderHeatmap() {
    heatmapContainer.innerHTML = '';

    // Render Header Row (Empty corner + Days)
    const emptyCorner = document.createElement('div');
    emptyCorner.className = 'heatmap-cell cell-day-header';
    emptyCorner.textContent = '';
    heatmapContainer.appendChild(emptyCorner);

    days.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'heatmap-cell cell-day-header';
      dayHeader.textContent = day;
      heatmapContainer.appendChild(dayHeader);
    });

    // Render Grid Rows per Platform
    const matrix = heatmapData[currentFilter] || heatmapData['ALL'];

    platforms.forEach((platform, rowIdx) => {
      // Platform Label Cell
      const labelCell = document.createElement('div');
      labelCell.className = 'heatmap-cell cell-label';
      labelCell.textContent = platform;
      heatmapContainer.appendChild(labelCell);

      // 7 Day Cells
      for (let colIdx = 0; colIdx < 7; colIdx++) {
        const intensity = matrix[rowIdx][colIdx];
        const cell = document.createElement('div');
        cell.className = `heatmap-cell level-${intensity}`;

        const incidentCount = intensity * 4 + Math.floor(Math.random() * 3);
        cell.textContent = incidentCount > 0 ? incidentCount : '0';

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerHTML = `
          <strong>${platform} (${days[colIdx]})</strong><br/>
          Threat Incidents: ${incidentCount}<br/>
          Intensity Level: ${intensity}/4
        `;
        cell.appendChild(tooltip);

        heatmapContainer.appendChild(cell);
      }
    });
  }

  // Filter click handlers
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.getAttribute('data-filter');
      renderHeatmap();
    });
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Heatmap render
  renderHeatmap();
});
