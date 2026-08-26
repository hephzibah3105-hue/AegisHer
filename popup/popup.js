// AegisHer Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const shieldToggle = document.getElementById('shield-toggle');
  const statusTitle = document.getElementById('shield-status-title');
  const statusSub = document.getElementById('shield-status-sub');
  const statVaulted = document.getElementById('stat-vaulted');
  const openVaultBtn = document.getElementById('open-vault-btn');
  const openDashboardBtn = document.getElementById('open-dashboard-btn');

  // Load active shield state & vaulted stats
  chrome.storage.local.get(['aegis_shield_active', 'aegis_evidence_vault'], (res) => {
    const isActive = res.aegis_shield_active !== false; // default true
    shieldToggle.checked = isActive;
    updateStatusText(isActive);

    const vaultList = res.aegis_evidence_vault || [];
    statVaulted.textContent = vaultList.length;
  });

  // Toggle switch handler
  shieldToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.local.set({ aegis_shield_active: isChecked }, () => {
      updateStatusText(isChecked);
    });
  });

  function updateStatusText(active) {
    if (active) {
      statusTitle.textContent = 'Shield Protection: ON';
      statusSub.textContent = 'Real-time threat interception active';
      statusTitle.style.color = '#f8fafc';
    } else {
      statusTitle.textContent = 'Shield Protection: OFF';
      statusSub.textContent = 'Protection paused by user';
      statusTitle.style.color = '#ef4444';
    }
  }

  // Navigation handlers
  openVaultBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('vault/vault.html') });
  });

  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  });
});
