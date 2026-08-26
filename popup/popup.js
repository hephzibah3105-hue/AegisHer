// AegisHer Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const shieldToggle = document.getElementById('shield-toggle');
  const statScanned = document.getElementById('stat-scanned');
  const statIntercepted = document.getElementById('stat-intercepted');
  const statVaulted = document.getElementById('stat-vaulted');
  const openVaultBtn = document.getElementById('open-vault-btn');
  const openDashboardBtn = document.getElementById('open-dashboard-btn');

  // 1. Load toggle state, total vaulted evidence count, risks blocked, and honeypot stats
  chrome.storage.local.get(['aegis_shield_active', 'aegis_evidence_vault', 'aegis_honeypot_stats', 'risks_blocked'], (res) => {
    const isActive = res.aegis_shield_active !== false;
    if (shieldToggle) shieldToggle.checked = isActive;
    updateStatusText(isActive);

    const vaultList = res.aegis_evidence_vault || [];
    if (statVaulted) statVaulted.textContent = vaultList.length;

    if (statIntercepted) statIntercepted.textContent = res.risks_blocked || 0;

    const hpStats = res.aegis_honeypot_stats || { totalBaited: 0 };
    const alertBanner = document.getElementById('honeypot-alert-banner');
    if (alertBanner) {
      if (hpStats.totalBaited > 0) {
        alertBanner.style.display = 'flex';
      } else {
        alertBanner.style.display = 'none';
      }
    }
  });

  // Clear banner and reset stats button listener
  const clearBannerBtn = document.getElementById('dismiss-badge-btn');
  if (clearBannerBtn) {
    clearBannerBtn.addEventListener('click', () => {
      chrome.action.setBadgeText({ text: '' });
      chrome.storage.local.set({
        aegis_honeypot_stats: { totalBaited: 0, decoyInput: 0, apiHook: 0, decoyLink: 0 },
        risks_blocked: 0
      }, () => {
        const alertBanner = document.getElementById('honeypot-alert-banner');
        if (alertBanner) alertBanner.style.display = 'none';
        if (statIntercepted) statIntercepted.textContent = '0';
      });
    });
  }

  // 1b. Listen for local storage modifications to dynamically update popup views in real-time
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.risks_blocked !== undefined) {
        if (statIntercepted) statIntercepted.textContent = changes.risks_blocked.newValue || 0;
      }
      if (changes.aegis_evidence_vault !== undefined) {
        if (statVaulted) statVaulted.textContent = changes.aegis_evidence_vault.newValue.length;
      }
      if (changes.aegis_honeypot_stats !== undefined) {
        const alertBanner = document.getElementById('honeypot-alert-banner');
        if (alertBanner) {
          const newStats = changes.aegis_honeypot_stats.newValue || { totalBaited: 0 };
          alertBanner.style.display = newStats.totalBaited > 0 ? 'flex' : 'none';
        }
      }
    }
  });

  // 2. Fetch live metrics directly from the active tab
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.id) {
      chrome.tabs.sendMessage(activeTab.id, { action: 'GET_LIVE_TAB_STATS' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          if (statScanned) statScanned.textContent = '0';
          if (statIntercepted) statIntercepted.textContent = '0';
          return;
        }

        if (statScanned) statScanned.textContent = response.linksScanned;
        if (statIntercepted) statIntercepted.textContent = response.risksBlocked;
        
        const alertBanner = document.getElementById('honeypot-alert-banner');
        if (alertBanner && response.isIsolated) {
          alertBanner.style.display = 'flex';
        }
      });
    }
  } catch (err) {
    console.error('Error loading tab metrics:', err);
  }

  // Toggle switch handler
  if (shieldToggle) {
    shieldToggle.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      chrome.storage.local.set({ aegis_shield_active: isChecked }, () => {
        updateStatusText(isChecked);
      });
    });
  }

  // Navigation button handlers
  if (openVaultBtn) {
    openVaultBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('vault/vault.html') });
    });
  }

  if (openDashboardBtn) {
    openDashboardBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
    });
  }

  // Listen for real-time threat alerts broadcasted from background worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'REALTIME_ALERT') {
      console.log('[AegisHer Popup] Real-time threat alert broadcast received:', request.threat);
      const alertBanner = document.getElementById('honeypot-alert-banner');
      if (alertBanner) {
        alertBanner.style.display = 'flex';
      }
      // Refresh vaulted counter
      chrome.storage.local.get(['aegis_evidence_vault'], (res) => {
        const vaultList = res.aegis_evidence_vault || [];
        if (statVaulted) statVaulted.textContent = vaultList.length;
      });
    }
  });
});

function updateStatusText(active) {
  const statusTitle = document.getElementById('shield-status-title');
  const statusSub = document.getElementById('shield-status-sub');
  if (!statusTitle) return;

  if (active) {
    statusTitle.textContent = 'Shield Protection: ON';
    if (statusSub) statusSub.textContent = 'Real-time threat interception active';
    statusTitle.style.color = '#f8fafc';
  } else {
    statusTitle.textContent = 'Shield Protection: OFF';
    if (statusSub) statusSub.textContent = 'Protection paused by user';
    statusTitle.style.color = '#ef4444';
  }
}