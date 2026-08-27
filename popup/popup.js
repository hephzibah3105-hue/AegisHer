// AegisHer Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const shieldToggle = document.getElementById('shield-toggle');
  const statScanned = document.getElementById('stat-scanned') || document.getElementById('links-scanned');
  const statVaulted = document.getElementById('stat-vaulted');
  const openVaultBtn = document.getElementById('open-vault-btn');
  const openDashboardBtn = document.getElementById('open-dashboard-btn');
  const manualCaptureBtn = document.getElementById('manual-capture-btn');

  // 1. Load toggle state and total vaulted evidence count
  chrome.storage.local.get({ aegis_shield_active: true, aegis_vault: [], aegis_evidence_vault: [] }, (res) => {
    const isActive = res.aegis_shield_active !== false;
    if (shieldToggle) shieldToggle.checked = isActive;
    updateStatusText(isActive);

    const vaultList = res.aegis_vault || res.aegis_evidence_vault || [];
    if (statVaulted) statVaulted.textContent = vaultList.length;
  });

  // Manual Capture Button Handler
  if (manualCaptureBtn) {
    manualCaptureBtn.addEventListener('click', async () => {
      const originalText = manualCaptureBtn.innerHTML;
      manualCaptureBtn.disabled = true;
      manualCaptureBtn.innerHTML = '<span>⏳ Capturing...</span>';

      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.id) {
          // Trigger Honeypot Beta Banner on current tab page
          chrome.tabs.sendMessage(activeTab.id, { action: 'SHOW_HONEYPOT_BETA_BANNER' }, () => {
            if (chrome.runtime.lastError) { /* ignore tab errors */ }
          });

          // Request Manual Evidence Capture in Background
          chrome.runtime.sendMessage({
            action: 'MANUAL_VAULT_CAPTURE',
            url: activeTab.url || '',
            title: activeTab.title || 'Manual Evidence Capture'
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('[AegisHer Popup] Manual capture error:', chrome.runtime.lastError);
              manualCaptureBtn.innerHTML = '<span>⚠️ Capture Error</span>';
              setTimeout(() => {
                manualCaptureBtn.innerHTML = originalText;
                manualCaptureBtn.disabled = false;
              }, 2500);
              return;
            }

            if (response && response.success) {
              manualCaptureBtn.innerHTML = '<span>✅ Evidence Vaulted!</span>';
              chrome.storage.local.get({ aegis_vault: [] }, (r) => {
                if (statVaulted) statVaulted.textContent = (r.aegis_vault || []).length;
              });
            } else {
              manualCaptureBtn.innerHTML = '<span>⚠️ Capture Error</span>';
            }

            setTimeout(() => {
              manualCaptureBtn.innerHTML = originalText;
              manualCaptureBtn.disabled = false;
            }, 2500); // Revert after 2.5s
          });
        } else {
          manualCaptureBtn.innerHTML = originalText;
          manualCaptureBtn.disabled = false;
        }
      } catch (err) {
        console.error('Manual evidence capture failed:', err);
        manualCaptureBtn.innerHTML = originalText;
        manualCaptureBtn.disabled = false;
      }
    });
  }

  // 1b. Listen for local storage modifications to dynamically update popup views in real-time
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.aegis_vault !== undefined) {
        if (statVaulted) statVaulted.textContent = (changes.aegis_vault.newValue || []).length;
      } else if (changes.aegis_evidence_vault !== undefined) {
        if (statVaulted) statVaulted.textContent = (changes.aegis_evidence_vault.newValue || []).length;
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
          return;
        }
        if (statScanned) statScanned.textContent = response.linksScanned !== undefined ? response.linksScanned : 0;
      });
    }
  } catch (err) {
    console.error('Error loading tab metrics:', err);
  }

  // Toggle switch handler (Global Broadcast across all tabs)
  if (shieldToggle) {
    shieldToggle.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      chrome.storage.local.set({ aegis_shield_active: isChecked }, () => {
        if (typeof updateStatusText === 'function') updateStatusText(isChecked);

        // Notify every open tab in real time
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'TOGGLE_GLOBAL_SHIELD',
                shieldActive: isChecked
              }, (response) => {
                if (chrome.runtime.lastError) {
                  return;
                }
              });
            }
          });
        });
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
      chrome.storage.local.get(['aegis_vault', 'aegis_evidence_vault'], (res) => {
        const vaultList = res.aegis_vault || res.aegis_evidence_vault || [];
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