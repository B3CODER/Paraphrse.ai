// popup.js
// Handles saving/loading Gemini API key with modern UI features and encryption

// --- Encryption functions (unchanged) ---
const ENCRYPTION_SALT = 'spellAI_salt_v1';
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
async function encryptText(text, password) {
  try {
    const key = await deriveKey(password, ENCRYPTION_SALT);
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(text));
    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch (error) { console.error('Encryption failed:', error); throw error; }
}
async function decryptText(encryptedData, password) {
  try {
    const key = await deriveKey(password, ENCRYPTION_SALT);
    const dec = new TextDecoder();
    const combined = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encrypted);
    return dec.decode(decrypted);
  } catch (error) { console.error('Decryption failed:', error); throw error; }
}
// --- End of encryption functions ---


// This listener is crucial. It ensures the code runs only after the HTML is ready.
document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('gemini-api-key');
  const saveBtn = document.getElementById('save-gemini-key');
  const status = document.getElementById('save-status');
  const toggleBtn = document.getElementById('toggle-key-visibility');
  const keyHint = document.getElementById('gemini-key-hint');

  // --- Mode toggle and shortcut settings ---
  const modeToggle = document.getElementById('mode-toggle');
  const shortcutSettings = document.getElementById('shortcut-settings');
  // REMOVED: const sliderKnob = document.getElementById('slider-knob'); // This element no longer exists

  const shortcutIds = {
    generate: 'shortcut-generate',
    grammar: 'shortcut-grammar',
    humanize: 'shortcut-humanize',
    professional: 'shortcut-professional',
  };
  const defaultShortcuts = {
    generate: 'Ctrl+K',
    grammar: 'Ctrl+G',
    humanize: 'Ctrl+H',
    professional: 'Ctrl+P',
  };
  let currentShortcuts = { ...defaultShortcuts };
  let currentMode = 'popup'; // or 'shortcut'

  // Helper: update shortcut table UI
  function updateShortcutTable() {
    for (const action in shortcutIds) {
        const el = document.getElementById(shortcutIds[action]);
        if(el) { // Check if element exists before using it
            el.textContent = currentShortcuts[action] || defaultShortcuts[action];
        }
    }
  }

  // Helper: update the entire UI based on the current mode
  function updateMainView() {
    if (currentMode === 'shortcut') {
      modeToggle.checked = true;
      shortcutSettings.style.display = 'block'; // Use 'block' to show
      // ADDED: Update the hint text when switching modes
      if (keyHint) keyHint.textContent = 'Shortcuts are active. You can close this window.';
    } else {
      modeToggle.checked = false;
      shortcutSettings.style.display = 'none'; // Use 'none' to hide
      // ADDED: Update the hint text when switching modes
      if (keyHint) keyHint.textContent = 'Enter your Gemini API key to activate the service.';
    }
  }

  // Load mode and shortcuts from storage
  chrome.storage.sync.get(['spellaiMode', 'spellaiShortcuts'], (result) => {
    currentMode = result.spellaiMode || 'popup';
    currentShortcuts = { ...defaultShortcuts, ...(result.spellaiShortcuts || {}) };
    updateMainView(); // This function now handles all UI updates for the mode
    updateShortcutTable();
  });

  // Toggle event
  modeToggle.addEventListener('change', () => {
    currentMode = modeToggle.checked ? 'shortcut' : 'popup';
    updateMainView();
    chrome.storage.sync.set({ spellaiMode: currentMode });
  });

  // Shortcut edit logic
  document.querySelectorAll('.edit-shortcut').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.getAttribute('data-action');
      btn.textContent = 'Press keys...';
      btn.disabled = true;
      const onKeyDown = (ev) => {
        ev.preventDefault();
        let combo = '';
        if (ev.ctrlKey) combo += 'Ctrl+';
        if (ev.altKey) combo += 'Alt+';
        if (ev.shiftKey) combo += 'Shift+';
        if (ev.metaKey) combo += 'Meta+';
        let key = ev.key.toUpperCase();
        if (key.length === 1 && (key >= 'A' && key <= 'Z')) { // Be more specific about valid keys
          combo += key;
        } else if (['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12', 'ENTER', 'SPACE', 'DELETE'].includes(key)) {
          combo += key;
        } else if (key.startsWith('ARROW')) {
          combo += key.replace('ARROW', '');
        } else {
          // If not a standard modifier key, ignore it
          return; 
        }
        currentShortcuts[action] = combo;
        updateShortcutTable();
        chrome.storage.sync.set({ spellaiShortcuts: currentShortcuts });
        btn.textContent = 'Edit';
        btn.disabled = false;
        window.removeEventListener('keydown', onKeyDown, true);
      };
      window.addEventListener('keydown', onKeyDown, true);
    });
  });

  // Show/hide password toggle
  toggleBtn.addEventListener('click', () => {
    // This is a simpler way to toggle
    const type = keyInput.getAttribute('type') === 'password' ? 'text' : 'password';
    keyInput.setAttribute('type', type);
  });

  // Load existing key
  chrome.storage.sync.get(['geminiApiKey'], async (result) => {
    if (result.geminiApiKey) {
      try {
        const decryptedKey = await decryptText(result.geminiApiKey, 'spellAI_master_key');
        keyInput.value = decryptedKey;
        status.innerHTML = '<span id="checkmark">✔️</span> API key loaded';
      } catch (error) {
        keyInput.value = result.geminiApiKey; // Old unencrypted key
        status.innerHTML = '<span id="checkmark">✔️</span> API key loaded (will be secured on save)';
      }
      status.style.display = 'block';
      setTimeout(() => { status.style.display = 'none'; }, 2000);
      if (keyHint) keyHint.style.display = 'none';
    } else {
      if (keyHint) keyHint.style.display = 'block';
    }
  });

  // Save button event
  saveBtn.addEventListener('click', async () => {
    const key = keyInput.value.trim();
    if (!key) {
      status.innerHTML = '<span style="color:#f6543c">Please enter an API key.</span>';
      status.style.display = 'block';
      setTimeout(() => { status.style.display = 'none'; }, 2000);
      return;
    }
    
    try {
      const encryptedKey = await encryptText(key, 'spellAI_master_key');
      chrome.storage.sync.set({ geminiApiKey: encryptedKey }, () => {
        status.innerHTML = '<span id="checkmark">✔️</span> Saved securely!';
        status.style.display = 'block';
        setTimeout(() => window.close(), 1000);
      });
    } catch (error) {
      status.innerHTML = `<span style="color:#f6543c">Error: ${error.message}</span>`;
      status.style.display = 'block';
    }
  });
});