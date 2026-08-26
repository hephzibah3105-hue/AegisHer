(function() {
  let decoyVal = { apiKey: 'decoy_fake_key_983102', apiSecret: 'fake_secret_89102' };
  Object.defineProperty(window, '_aegisDecoyCredentials', {
    get: function() {
      window.postMessage({ source: 'aegis-honeypot', type: 'API_HOOK_TRIGGER', detail: 'Decoy API key property read' }, '*');
      return decoyVal;
    },
    set: function(val) {
      decoyVal = val;
      window.postMessage({ source: 'aegis-honeypot', type: 'API_HOOK_TRIGGER', detail: 'Decoy API key property modified' }, '*');
    }
  });
})();
