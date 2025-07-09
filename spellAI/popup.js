// popup.js
// Handles saving/loading Gemini API key with modern UI features

document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('gemini-api-key');
  const saveBtn = document.getElementById('save-gemini-key');
  const status = document.getElementById('save-status');
  const toggleBtn = document.getElementById('toggle-key-visibility');

  // Show/hide password toggle
  let isVisible = false;
  toggleBtn.addEventListener('click', () => {
    isVisible = !isVisible;
    keyInput.type = isVisible ? 'text' : 'password';
    toggleBtn.textContent = isVisible ? '🙈' : '👁️';
  });

  // Load existing key
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      keyInput.value = result.geminiApiKey;
      status.innerHTML = '<span id="checkmark">✔️</span> API key loaded';
      status.style.display = 'block';
      setTimeout(() => status.style.display = 'none', 1200);
    }
  });

  saveBtn.addEventListener('click', () => {
    const key = keyInput.value.trim();
    if (!key) {
      status.innerHTML = '<span style="color:#b00">Please enter your Gemini API key.</span>';
      status.style.display = 'block';
      setTimeout(() => status.style.display = 'none', 1800);
      return;
    }
    chrome.storage.sync.set({ geminiApiKey: key }, () => {
      status.innerHTML = '<span id="checkmark">✔️</span> Saved!';
      status.style.display = 'block';
      setTimeout(() => {
        status.style.display = 'none';
        window.close();
      }, 1000);
    });
  });
}); 