
// popup.js
// Handles saving/loading Gemini API key with modern UI features and encryption

// Encryption utilities using Web Crypto API
const ENCRYPTION_SALT = 'spellAI_salt_v1'; // Salt for key derivation

// Generate encryption key from password using PBKDF2
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt text using AES-GCM
async function encryptText(text, password) {
  try {
    const key = await deriveKey(password, ENCRYPTION_SALT);
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      enc.encode(text)
    );
    
    // Combine IV and encrypted data
    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

// Decrypt text using AES-GCM
async function decryptText(encryptedData, password) {
  try {
    const key = await deriveKey(password, ENCRYPTION_SALT);
    const dec = new TextDecoder();
    
    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    return dec.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('gemini-api-key');
  const saveBtn = document.getElementById('save-gemini-key');
  const status = document.getElementById('save-status');
  const toggleBtn = document.getElementById('toggle-key-visibility');

  // --- Mode toggle and shortcut settings ---
  const modeToggle = document.getElementById('mode-toggle');
  const shortcutSettings = document.getElementById('shortcut-settings');
  const sliderKnob = document.getElementById('slider-knob');
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
      document.getElementById(shortcutIds[action]).textContent = currentShortcuts[action] || defaultShortcuts[action];
    }
  }

  // Helper: update toggle UI
  function updateToggleUI() {
    if (currentMode === 'shortcut') {
      modeToggle.checked = true;
      shortcutSettings.style.display = '';
      sliderKnob.style.left = '18px';
    } else {
      modeToggle.checked = false;
      shortcutSettings.style.display = 'none';
      sliderKnob.style.left = '2px';
    }
  }

  // Load mode and shortcuts from storage
  chrome.storage.sync.get(['spellaiMode', 'spellaiShortcuts'], (result) => {
    currentMode = result.spellaiMode || 'popup';
    currentShortcuts = { ...defaultShortcuts, ...(result.spellaiShortcuts || {}) };
    updateToggleUI();
    updateShortcutTable();
  });

  // Toggle event
  modeToggle.addEventListener('change', () => {
    currentMode = modeToggle.checked ? 'shortcut' : 'popup';
    updateToggleUI();
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
        if (key.length === 1 || (key >= 'A' && key <= 'Z')) {
          combo += key;
        } else if (key.startsWith('ARROW')) {
          combo += key.replace('ARROW', '');
        } else {
          combo += key;
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
  let isVisible = false;
  toggleBtn.addEventListener('click', () => {
    isVisible = !isVisible;
    keyInput.type = isVisible ? 'text' : 'password';
    toggleBtn.textContent = isVisible ? '🙈' : '👁️';
  });

  // Load existing key
  chrome.storage.sync.get(['geminiApiKey'], async (result) => {
    if (result.geminiApiKey) {
      try {
        // Try to decrypt the stored key
        const decryptedKey = await decryptText(result.geminiApiKey, 'spellAI_master_key');
        keyInput.value = decryptedKey;
        status.innerHTML = '<span id="checkmark">✔️</span> API key loaded';
        status.style.display = 'block';
        setTimeout(() => status.style.display = 'none', 1200);
      } catch (error) {
        // If decryption fails, it might be an old unencrypted key
        // Try to use it as-is and then encrypt it on next save
        keyInput.value = result.geminiApiKey;
        status.innerHTML = '<span id="checkmark">✔️</span> API key loaded (will be encrypted on save)';
        status.style.display = 'block';
        setTimeout(() => status.style.display = 'none', 1200);
      }
    }
  });

  saveBtn.addEventListener('click', async () => {
    const key = keyInput.value.trim();
    if (!key) {
      status.innerHTML = '<span style="color:#b00">Please enter your Gemini API key.</span>';
      status.style.display = 'block';
      setTimeout(() => status.style.display = 'none', 1800);
      return;
    }
    
    try {
      // Encrypt the API key before storing
      const encryptedKey = await encryptText(key, 'spellAI_master_key');
      
      chrome.storage.sync.set({ geminiApiKey: encryptedKey }, () => {
        status.innerHTML = '<span id="checkmark">✔️</span> Saved securely!';
        status.style.display = 'block';
        setTimeout(() => {
          status.style.display = 'none';
          window.close();
        }, 1000);
      });
    } catch (error) {
      status.innerHTML = '<span style="color:#b00">Error saving API key: ' + error.message + '</span>';
      status.style.display = 'block';
      setTimeout(() => status.style.display = 'none', 3000);
    }
  });
}); 

