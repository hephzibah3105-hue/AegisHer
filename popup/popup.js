// AegisHer Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const shieldToggle = document.getElementById('shield-toggle');
  const statScanned = document.getElementById('stat-scanned');
  const statIntercepted = document.getElementById('stat-intercepted');
  const statVaulted = document.getElementById('stat-vaulted');
  const openVaultBtn = document.getElementById('open-vault-btn');
  const openDashboardBtn = document.getElementById('open-dashboard-btn');

  // 1. Load toggle state and total vaulted evidence count
  chrome.storage.local.get(['aegis_shield_active', 'aegis_evidence_vault'], (res) => {
    const isActive = res.aegis_shield_active !== false;
    if (shieldToggle) shieldToggle.checked = isActive;
    updateStatusText(isActive);

    const vaultList = res.aegis_evidence_vault || [];
    if (statVaulted) statVaulted.textContent = vaultList.length;
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