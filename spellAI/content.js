// content.js
(function() {
  let menu = null;
  let lastTarget = null;

  // Add CSS styles for the Ask Modal
  const askModalStyles = `
  /* === BAUHAUS STYLE REDESIGN for Ask AI Modal === */

  /* Define color variables for use within this scope */
  :root {
      --green: #70c055;
      --yellow: #f7cf29;
      --red: #f6543c;
      --dark: #1A1A1A;
      --white: #FFFFFF;
  }

  /* --- Overlay --- */
  #spellai-ask-overlay {
      background: rgba(0, 0, 0, 0.5); /* Stronger, more intentional overlay */
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
  }

  /* --- Main Modal Box --- */
  .ask-modal-box {
      background: var(--white);
      border: 3px solid var(--dark); /* Thick black border */
      border-radius: 0; /* Sharp corners */
      padding: 30px;
      box-shadow: none; /* No soft shadow */
      min-width: 420px;
      max-width: 520px;
      width: 90%;
      display: flex;
      flex-direction: column;
      gap: 15px;
      font-family: 'Poppins', sans-serif;
      animation: modalFadeIn 0.3s ease-out forwards;
  }

  @keyframes modalFadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
  }

  /* --- Header Label --- */
  .ask-modal-label {
      font-family: 'Montserrat', sans-serif; /* Header font */
      font-weight: 900;
      font-size: 22px;
      color: var(--dark);
      margin-bottom: 5px;
      text-align: left;
  }

  /* --- Selected Text Preview --- */
  .selected-text-preview {
      background: #F5F5F5; /* Light, functional background */
      color: var(--dark);
      font-size: 14px;
      padding: 10px 15px;
      border: 2px solid #e0e0e0; /* Simple border */
      border-radius: 0;
      max-height: 80px;
      overflow-y: auto;
      white-space: pre-wrap;
      box-shadow: none; /* No shadow */
      text-align: left;
  }

  /* --- Textarea Input --- */
  .ask-modal-textarea {
      width: 100%;
      box-sizing: border-box;
      min-height: 80px;
      padding: 12px 18px;
      font-size: 16px;
      border: 2px solid var(--dark); /* Black border */
      border-radius: 0;
      background: var(--white);
      color: var(--dark);
      outline: none;
      resize: vertical;
      box-shadow: none;
      transition: border-color 0.2s ease;
  }

  .ask-modal-textarea::placeholder {
      color: #999;
      opacity: 1;
  }

  .ask-modal-textarea:focus {
      border-color: var(--green); /* Green focus color */
  }

  /* --- Generate Button (Primary CTA) --- */
  .ask-modal-button {
      width: 100%;
      padding: 14px 20px;
      background: var(--yellow);
      color: var(--dark);
      font-weight: 700;
      font-size: 16px;
      border: 2px solid var(--dark);
      border-radius: 0;
      cursor: pointer;
      box-shadow: 4px 4px 0px var(--dark); /* Solid block shadow */
      transition: background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
  }

  .ask-modal-button:hover {
      background: var(--red); /* Red hover */
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0px var(--dark);
  }

  .ask-modal-button:active {
      transform: translate(2px, 2px);
      box-shadow: 0px 0px 0px var(--dark);
  }

  /* --- Suggestion Box --- */
  .suggestion-box {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
  }

  /* --- Loading Spinner --- */
  .loading-spinner svg {
      animation: spin 1.2s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-spinner circle {
      stroke: var(--green); /* Use green from palette */
  }

  /* --- Result & Error Messages --- */
  .result-message, .error-message {
      padding: 12px 18px;
      border-radius: 0;
      font-size: 15px;
      text-align: left;
      line-height: 1.5;
      white-space: pre-wrap;
      box-shadow: none; /* No shadow */
  }
  .result-message {
      background: #f7f9f7; /* Very light, almost white */
      color: var(--dark);
      border: 2px solid var(--green); /* Strong green border */
  }
  .error-message {
      background: #fdf2f0; /* Very light red */
      color: #c53030; /* Stronger red text for contrast */
      border: 2px solid var(--red); /* Strong red border */
      font-weight: 500;
  }

  /* --- Apply Button (Secondary Action) --- */
  .apply-button {
      display: block;
      width: 100%;
      padding: 12px 20px;
      background: var(--white); /* White background (ghost button style) */
      color: var(--dark); /* Dark text */
      font-weight: 700;
      font-size: 16px;
      border: 2px solid var(--green); /* Green border */
      border-radius: 0;
      cursor: pointer;
      margin-top: 10px;
      box-shadow: none;
      transition: background 0.2s ease, color 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
  }

  .apply-button:hover {
      background: var(--green); /* Fill with green on hover */
      color: var(--white); /* Text becomes white */
  }
`;

// [MODIFIED] The CSS causing the duplicate tooltip has been removed from this section.
const rewriteMenuStyles = `
    /* === BAUHAUS STYLE for Horizontal Rewrite Menu (Instant Action) === */

    .spellai-rewrite-menu {
        position: absolute;
        top: 100%;
        left: 32px;
        margin-top: 0px; /* Space between the main bar and this menu */
        
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px; /* Space between icon buttons */
        
        background: var(--white, #FFF);
        border: 0.5px solid var(--dark, #1A1A1A);

        border-radius: 14%;
        padding: 3px;
        z-index: 2147483648;
    }

    /* --- Individual Tone Icon Buttons --- */
    .spellai-tone-btn {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        
        background: var(--white, #FFF);
        border: 1px solid var(--dark, #1A1A1A);
        border-radius: 25%;
        color: var(--dark, #1A1A1A);
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
    }

    .spellai-tone-btn svg {
        width: 15px;
        height: 15px;
    }

    /* --- UPDATED HOVER EFFECT --- */
    .spellai-tone-btn:hover {
        background: var(--yellow, #f7cf29); /* Change background to yellow on hover */
    }

    /* --- Selected State for Tone Icon --- */
    .spellai-tone-btn.selected {
        background: var(--yellow, #f7cf29);
        border-color: var(--dark, #1A1A1A);
    }
`;

  // Inject the styles into the document
  if (!document.getElementById('spellai-ask-modal-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'spellai-ask-modal-styles';
    styleElement.textContent = askModalStyles;
    document.head.appendChild(styleElement);
  }

  if (!document.getElementById('spellai-rewrite-menu-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'spellai-rewrite-menu-styles';
    styleSheet.textContent = rewriteMenuStyles;
    document.head.appendChild(styleSheet);
  }

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

  // Helper to remove the menu
  function removeMenu() {
    console.log('steps [removeMenu] removing popup menu');
    if (menu) {
      menu.remove();
      menu = null;
    }
  }

  // Helper to get the position of the current selection (caret)
  function getSelectionCoords() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    const range = sel.getRangeAt(0).cloneRange();
    const rects = range.getClientRects();
    // Try to use the last non-zero rect
    for (let i = rects.length - 1; i >= 0; i--) {
      if (rects[i].width > 0 && rects[i].height > 0) {
        return rects[i];
      }
    }
    // Fallback: create a temporary span at the end of the range
    const span = document.createElement('span');
    span.appendChild(document.createTextNode('\u200b'));
    range.collapse(false); // Collapse to end
    range.insertNode(span);
    const rect = span.getBoundingClientRect();
    span.parentNode.removeChild(span);
    // Restore selection
    sel.removeAllRanges();
    sel.addRange(range);
    return rect;
  }

  // Helper to get selected text from input, textarea, or contenteditable
  function getSelectedText(target) {
    // Shadow DOM/iframe awareness log
    if (target) {
      let node = target;
      let shadow = false;
      while (node) {
        if (node.toString && node.toString().includes('ShadowRoot')) {
          shadow = true;
          break;
        }
        node = node.parentNode;
      }
      if (shadow) {
        console.log('steps [context] Selection is inside a Shadow DOM');
      }
      if (window.frameElement) {
        console.log('steps [context] Selection is inside an iframe');
      }
    }
    if ((target.tagName === 'INPUT' && target.type === 'text') || target.tagName === 'TEXTAREA') {
      return target.value.substring(target.selectionStart, target.selectionEnd);
    } else if (target.isContentEditable) {
      const sel = window.getSelection();
      return sel ? sel.toString() : '';
    }
    return '';
  }

  // Helper to show a loading spinner in the menu
  function showMenuLoading() {
    if (!menu) return;
    menu.innerHTML = '';
    const spinner = document.createElement('div');
    spinner.style.display = 'flex';
    spinner.style.justifyContent = 'center';
    spinner.style.alignItems = 'center';
    spinner.style.height = '48px';
    spinner.innerHTML = `<svg width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#0074D9" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg>`;
    menu.appendChild(spinner);
  }

  // Helper to replace selected text in input/textarea/contenteditable
  function replaceSelectedText(target, newText) {
    if ((target.tagName === 'INPUT' && target.type === 'text') || target.tagName === 'TEXTAREA') {
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      target.value = value.slice(0, start) + newText + value.slice(end);
      // Move caret to end of inserted text
      target.selectionStart = target.selectionEnd = start + newText.length;
    } else if (target.isContentEditable) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(newText));
        // Move caret to end of inserted text
        sel.collapseToEnd();
      }
    }
  }

  // Helper to show a modal with the result
  function showModal(message) {
    // Remove any existing modal
    const oldModal = document.getElementById('spellai-modal');
    if (oldModal) oldModal.remove();
    const modal = document.createElement('div');
    modal.id = 'spellai-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.35)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = 2147483647;

    const box = document.createElement('div');
    box.style.background = '#fff';
    box.style.padding = '28px 32px';
    box.style.borderRadius = '10px';
    box.style.boxShadow = '0 4px 32px rgba(0,0,0,0.18)';
    box.style.maxWidth = '90vw';
    box.style.maxHeight = '80vh';
    box.style.overflowY = 'auto';
    box.style.fontSize = '18px';
    box.style.color = '#222';
    box.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.marginTop = '18px';
    closeBtn.style.padding = '8px 20px';
    closeBtn.style.fontSize = '16px';
    closeBtn.style.background = '#0074D9';
    closeBtn.style.color = '#fff';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '6px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = function() { modal.remove(); };
    box.appendChild(document.createElement('br'));
    box.appendChild(closeBtn);

    modal.appendChild(box);
    document.body.appendChild(modal);
  }

  // Helper to get Gemini API key from chrome.storage.sync (returns a Promise)
  async function getGeminiApiKey() {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['geminiApiKey'], async (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            const storedKey = result.geminiApiKey || null;
            if (!storedKey) {
              resolve(null);
              return;
            }
            
            try {
              // Try to decrypt the stored key
              const decryptedKey = await decryptText(storedKey, 'spellAI_master_key');
              resolve(decryptedKey);
            } catch (error) {
              // If decryption fails, it might be an old unencrypted key
              // Return it as-is for backward compatibility
              console.warn('Failed to decrypt API key, using as-is:', error);
              resolve(storedKey);
            }
          }
        });
      } else {
        reject(new Error('chrome.storage.sync not available'));
      }
    });
  }

  // Helper to call Gemini API directly from the browser
  async function callGemini(prompt, apiKey) {
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  // === Spinner at Cursor Position ===
  let spellaiSpinner = null;
  window.spellaiIsProcessing = false;
  function showCursorSpinner(target) {
    removeCursorSpinner();
    let coords = null;
    // Input/Textarea
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      // Create a hidden mirror div to calculate caret position
      const rect = target.getBoundingClientRect();
      const style = window.getComputedStyle(target);
      const mirror = document.createElement('div');
      mirror.style.position = 'absolute';
      mirror.style.visibility = 'hidden';
      mirror.style.whiteSpace = 'pre-wrap';
      mirror.style.wordWrap = 'break-word';
      mirror.style.font = style.font;
      mirror.style.fontSize = style.fontSize;
      mirror.style.fontFamily = style.fontFamily;
      mirror.style.fontWeight = style.fontWeight;
      mirror.style.letterSpacing = style.letterSpacing;
      mirror.style.padding = style.padding;
      mirror.style.border = style.border;
      mirror.style.boxSizing = style.boxSizing;
      mirror.style.width = style.width;
      mirror.style.height = style.height;
      mirror.style.lineHeight = style.lineHeight;
      mirror.style.background = 'transparent';
      mirror.style.left = '-9999px';
      mirror.style.top = '0';
      // Set mirror text up to caret
      const value = target.value;
      const start = target.selectionStart;
      const before = value.substring(0, start);
      const after = value.substring(start);
      // Replace spaces and newlines for accurate rendering
      mirror.textContent = before;
      document.body.appendChild(mirror);
      // Create a span for caret
      const caretSpan = document.createElement('span');
      caretSpan.textContent = after.length === 0 ? '\u200b' : after[0];
      mirror.appendChild(caretSpan);
      const caretRect = caretSpan.getBoundingClientRect();
      const mirrorRect = mirror.getBoundingClientRect();
      coords = {
        x: rect.left + (caretRect.left - mirrorRect.left),
        y: rect.top + (caretRect.top - mirrorRect.top) + parseInt(style.fontSize || '16'),
      };
      document.body.removeChild(mirror);
    } else {
      // Contenteditable or general selection
      const selRect = getSelectionCoords();
      if (selRect) {
        coords = { x: selRect.left, y: selRect.bottom };
      }
    }
    if (!coords) return;
    spellaiSpinner = document.createElement('div');
    spellaiSpinner.id = 'spellai-cursor-spinner';
    spellaiSpinner.style.position = 'fixed';
    spellaiSpinner.style.left = `${coords.x - 16}px`;
    spellaiSpinner.style.top = `${coords.y + 2}px`;
    spellaiSpinner.style.zIndex = '2147483647';
    spellaiSpinner.style.pointerEvents = 'none';
    spellaiSpinner.innerHTML = `<svg width="32" height="32" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#0074D9" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg>`;
    document.body.appendChild(spellaiSpinner);
  }
  function removeCursorSpinner() {
    if (spellaiSpinner) {
      spellaiSpinner.remove();
      spellaiSpinner = null;
    }
  }

  // Helper to call Gemini and replace text for each action
  async function handleActionReplace(action, text, target) {
    console.log('[spellai] handleActionReplace called:', {action, text, target}); // Debug log
    let prompt = '';
    if (action === 'grammar') {
      prompt = `Correct the grammar of this sentence. Only return the corrected version:\n"${text}"`;
    } else if (action === 'humanize') {
      prompt = `You are an expert human copywriter specializing in natural language transformation and authentic communication. Your primary goal is to rewrite the provided text to sound as if it was originally written by a thoughtful, articulate, and truly human individual.\n\n[INTERNAL MONOLOGUE:\n1.  **Analyze & Identify:** Carefully read the original text. Pinpoint specific "AI patterns," robotic phrasing, overly formal tones, generic language, or awkward structures that signal it wasn't written by a human. For each, ask: "Why does this sound artificial or impersonal?"\n2.  **Strategize Transformation:** Brainstorm how a human would naturally express the same idea. Consider:\n    *   Varying sentence structure and length for rhythm.\n    *   Using more evocative, precise, or common vocabulary.\n    *   Injecting appropriate emotional nuance, tone, or personality.\n    *   Improving conversational flow, readability, and engagement.\n    *   Ensuring conciseness where possible without sacrificing clarity or impact.\n3.  **Self-Assess (Post-Rewrite):** Review your rewritten text. Does it genuinely sound like a human wrote it? Are all traces of AI-generated style eliminated? Is the original meaning perfectly preserved?\n]\n\n**Instructions for Rewriting:**\n\n*   **Persona:** Adopt the voice of a skilled, empathetic, and natural human writer.\n*   **Core Goal:** Transform the text to be natural, fluid, and authentically human.\n*   **Avoid at all costs:**\n    *   Robotic phrasing, stiff language, or overly academic jargon.\n    *   Generic AI-style patterns, predictable structures, or buzzwords used for their own sake.\n    *   Repetitive sentence openings or predictable vocabulary.\n    *   Any meta-commentary, introductory phrases (e.g., "Here's the rewritten text," "Okay, here's that information"), or concluding remarks. Provide *only* the transformed text.\n    *   **Absolutely NO Markdown formatting or special characters whatsoever.** This means no asterisks, hyphens, numbers with periods for lists, emojis, bolding, italics, code blocks, tables, or any character used to create a visual structure or emphasis beyond standard punctuation (e.g., periods, commas, question marks). All "headings" and "bullet points" from the original text must be integrated into natural, flowing, plain text paragraphs. The output *must be* pure, unformatted text.\n*   **Preserve Absolutely:**\n    *   The *entire original meaning* and all factual accuracy. Do not invent new facts, add external information, or alter core messages.\n    *   The clarity and precision of the original content.\n*   **Enhance Continuously:**\n    *   Emotional nuance and an appropriate, consistent tone.\n    *   Conversational flow, readability, and natural rhythm.\n    *   Engagement and a sense of genuine human voice.\n    *   Conciseness, but only if it improves clarity or impact without removing essential information.\n    *   **Logical paragraphing:** Ensure distinct, well-separated paragraphs for each new major idea or sub-section. The paragraph breaks should clearly delineate different topics, serving the function of visual separation that would otherwise be provided by headings or lists, but entirely in plain text.\n*   **Handle Edge Cases:**\n    *   **Already Human-like:** If the original text is already highly human-like, make only minimal, subtle adjustments to refine flow or clarity, rather than drastic, unnecessary changes.\n    *   **Technical/Data-driven Content:** If the content is inherently technical, scientific, or data-driven, focus on making the *surrounding language* as natural and accessible as possible, without compromising technical accuracy.\n\n**Examples of Desired Transformation:**\n\n*   **Example 1:**\n    *   **Original (Generic AI/Robotic):** "The platform facilitates user engagement by providing a comprehensive suite of tools for content creation and dissemination."\n    *   **Rewritten (Human):** "This platform really helps people connect and share their ideas by giving them all the tools they need to create and spread content easily."\n\n*   **Example 2:**\n    *   **Original (Overly Formal/Stiff):** "It is imperative that all participants adhere to the established guidelines to ensure optimal operational efficiency."\n    *   **Rewritten (Human):** "Everyone needs to stick to the rules so things run smoothly and efficiently."\n\nPlease provide only the humanized version of the following text, based on the principles above: "${text}"`;
    }
    

    else if (action === 'professional') {
      prompt = `Rewrite the following text in a professional tone. Only return the revised version:\n"${text}"`;
    }
    window.spellaiIsProcessing = true;
    removeMenu(); // Hide menu immediately
    showMenuLoading();
    showCursorSpinner(target);
    try {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        console.error('[spellai] Gemini API key missing!'); // Debug log
        showModal('Gemini API key not set. Please set it in the extension popup.');
        removeMenu();
        removeCursorSpinner();
        window.spellaiIsProcessing = false;
        return;
      }
      console.log('[spellai] About to call Gemini API for action:', action);
      const result = await callGemini(prompt, apiKey);
      console.log('[spellai] Gemini API response:', result);
      if (result) {
        replaceSelectedText(target, result);
        removeMenu();
      } else {
        showModal('Error: No result from Gemini API.');
        removeMenu();
      }
    } catch (err) {
      console.error('[spellai] Gemini API/network error:', err); // Debug log
      showModal('Network or extension error: ' + (err && err.message ? err.message : err));
      removeMenu();
    }
    removeCursorSpinner();
    window.spellaiIsProcessing = false;
  }

  // Helper to manage outside click handler
  let outsideHandler = null;
  function attachOutsideHandler() {
    removeOutsideHandler();
    setTimeout(() => {
      outsideHandler = function(e) {
        if (menu && menu.contains(e.target)) return;
        removeMenu();
        removeOutsideHandler();
      };
      document.addEventListener('pointerdown', outsideHandler, true);
    }, 0);
  }
  function removeOutsideHandler() {
    if (outsideHandler) {
      document.removeEventListener('pointerdown', outsideHandler, true);
      outsideHandler = null;
    }
  }

  // Helper to create the floating menu
  function injectStyles() {
    const styleId = 'spellai-bauhaus-neumorph-styles';
    if (document.getElementById(styleId)) return;
  
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      /* [MODIFIED] Using a softer, darker, single-source shadow for a cleaner look */
      :root {
        --shadow-color: rgba(50, 50, 93, 0.1);
        --shadow-color-hover: rgba(50, 50, 93, 0.15);
        --shadow-color-inset: rgba(50, 50, 93, 0.2);
      }
  
      /* Main button hover/active states */
      #spellai-menu > .spellai-icon-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 12px var(--shadow-color-hover);
      }
      #spellai-menu > .spellai-icon-btn:active, #spellai-menu > .spellai-icon-btn.active {
        transform: translateY(0px);
        box-shadow: inset 0 2px 4px var(--shadow-color-inset);
      }
      #spellai-menu > .spellai-icon-btn:hover .spellai-icon-svg path,
      #spellai-menu > .spellai-icon-btn:hover .spellai-icon-svg circle,
      #spellai-menu > .spellai-icon-btn:hover .spellai-icon-svg rect,
      #spellai-menu > .spellai-icon-btn:hover {
          color: #FFC700;
      }
  
      /* Dropdown menu styling */
      .spellai-rewrite-menu {
          position: absolute;
          background: #ECF0F3;
          border-radius: 10px;
          box-shadow: 0 5px 15px var(--shadow-color-hover);
          padding: 4px;
          display: flex;
          gap: 4px;
          z-index: 1; 
      }
      
      /* Dropdown button styling */
      .spellai-tone-btn {
          background: #ECF0F3;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px var(--shadow-color);
          transition: all 0.2s ease-in-out;
      }
      .spellai-tone-btn .spellai-icon-svg {
          width: 18px;
          height: 18px;
      }
      .spellai-tone-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px var(--shadow-color-hover);
      }
      .spellai-tone-btn:hover .spellai-icon-svg path,
      .spellai-tone-btn:hover {
          color: #FFC700;
      }
      .spellai-tone-btn.selected, .spellai-tone-btn:active {
          box-shadow: inset 0 2px 4px var(--shadow-color-inset);
          transform: translateY(0px);
      }
      .spellai-tone-btn.selected .spellai-icon-svg path,
      .spellai-tone-btn.selected {
          color: #FFC700;
      }
    `;
    document.head.appendChild(style);
  }
  
  function createMenu(x, y) {
      console.log('steps [createMenu] creating popup menu at', { x, y });
      removeMenu();
      injectStyles();
  
      menu = document.createElement('div');
      menu.id = 'spellai-menu';
      menu.style.position = 'fixed';
      menu.style.top = `${y + 5}px`;
      menu.style.left = `${x + 5}px`;
      
      menu.style.background = '#ECF0F3';
      menu.style.border = 'none';
      menu.style.borderRadius = '12px';
      // [MODIFIED] Using the new CSS variable for a clean shadow.
      menu.style.boxShadow = '0 5px 15px var(--shadow-color-hover)';
      
      menu.style.padding = '4px';
      menu.style.display = 'flex';
      menu.style.flexDirection = 'row';
      menu.style.alignItems = 'center';
      menu.style.gap = '4px';
      menu.style.zIndex = 2147483647;
      menu.style.fontFamily = 'sans-serif';
      menu.style.height = '36px';
      menu.style.maxWidth = 'fit-content';
      menu.style.transition = 'opacity 0.2s ease-in-out';
  
      function createIconBtn({icon, label, onClick}) {
        const btn = document.createElement('button');
        btn.className = 'spellai-icon-btn';
        
        btn.style.background = '#ECF0F3';
        btn.style.border = 'none';
        btn.style.borderRadius = '8px';
        btn.style.width = '30px';
        btn.style.height = '30px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.cursor = 'pointer';
        btn.style.position = 'relative';
        btn.style.margin = '0';
        btn.style.padding = '0';
        // [MODIFIED] Using the new CSS variable for a clean shadow.
        btn.style.boxShadow = '0 2px 4px var(--shadow-color)';
        btn.style.transition = 'all 0.2s ease-in-out';
        
        btn.addEventListener('mousedown', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[spellai] IconBtn clicked:', label);
          onClick(e);
        });
  
        if (icon.startsWith('<svg')) {
            const iconWrapper = document.createElement('div');
            iconWrapper.innerHTML = icon;
            const svg = iconWrapper.firstChild;
            svg.classList.add('spellai-icon-svg');
            svg.style.width = '18px';
            svg.style.height = '18px';
            svg.style.transition = 'stroke 0.2s ease-in-out';
            btn.appendChild(svg);
        } else {
            const textIcon = document.createElement('span');
            textIcon.textContent = icon;
            textIcon.style.fontSize = '16px';
            textIcon.style.lineHeight = '1';
            btn.appendChild(textIcon);
        }
        
        const hoverLabel = document.createElement('div');
        hoverLabel.textContent = label;
        hoverLabel.style.position = 'absolute';
        hoverLabel.style.left = '50%';
        hoverLabel.style.bottom = '125%';
        hoverLabel.style.transform = 'translateX(-50%)';
        hoverLabel.style.background = '#3D4852';
        hoverLabel.style.color = '#fff';
        hoverLabel.style.fontSize = '11px';
        hoverLabel.style.fontWeight = '600';
        hoverLabel.style.padding = '2px 8px';
        hoverLabel.style.borderRadius = '6px';
        hoverLabel.style.whiteSpace = 'nowrap';
        hoverLabel.style.opacity = '0';
        hoverLabel.style.pointerEvents = 'none';
        hoverLabel.style.transition = 'opacity 0.18s 0.3s';
        btn.onmouseenter = () => { hoverLabel.style.opacity = '1'; };
        btn.onmouseleave = () => { hoverLabel.style.opacity = '0'; };
        btn.appendChild(hoverLabel);
        return btn;
      }
      
      const generateIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="#3D4852" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const rewriteIcon = '✏️';
  
      menu.appendChild(createIconBtn({
        icon: generateIcon,
        label: 'Generate',
        onClick: function(e) {
          /* ... existing logic ... */
          const selected = getSelectedText(lastTarget);
          if (selected) showAskModal(selected, lastTarget);
          else { showModal('No text selected.'); removeMenu(); }
        }
      }));
  
      const separator = document.createElement('div');
      separator.style.width = '2px';
      separator.style.height = '20px';
      separator.style.background = '#d1d9e6';
      separator.style.margin = '0 4px';
      separator.style.borderRadius = '1px';
      menu.appendChild(separator);
  
      let rewriteDropdown = null;
      let selectedTone = null;
  
      const tones = [
        { key: 'grammar', label: 'Grammar', icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12L10 17L20 7" stroke="#3D4852" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
        { key: 'professional', label: 'Professional', icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M7 21L12 3L17 21M7 13H17" stroke="#3D4852" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
        { key: 'humanize', label: 'Humanize', icon: '👤' },
      ];
  
      function showDropdown(e) {
        e.stopPropagation();
        const rewriteBtn = e.currentTarget;
        rewriteBtn.classList.add('active');
  
        if (rewriteDropdown && rewriteDropdown.parentNode) return;
  
        rewriteDropdown = document.createElement('div');
        rewriteDropdown.className = 'spellai-rewrite-menu';
  
        tones.forEach(tone => {
          const toneBtn = document.createElement('button');
          toneBtn.type = 'button';
          toneBtn.className = 'spellai-tone-btn';
          toneBtn.dataset.label = tone.label;
          toneBtn.style.position = 'relative'; // Required for label positioning
  
          if (tone.icon.startsWith('<svg')) {
            toneBtn.innerHTML = tone.icon;
          } else {
            toneBtn.textContent = tone.icon;
            toneBtn.style.fontSize = '16px';
          }
  
          // [MODIFIED] Added hover label logic directly to the dropdown buttons
          const hoverLabel = document.createElement('div');
          hoverLabel.textContent = tone.label;
          hoverLabel.style.position = 'absolute';
          hoverLabel.style.left = '50%';
          hoverLabel.style.bottom = '125%'; // Position above the button
          hoverLabel.style.transform = 'translateX(-50%)';
          hoverLabel.style.background = '#3D4852';
          hoverLabel.style.color = '#fff';
          hoverLabel.style.fontSize = '11px';
          hoverLabel.style.fontWeight = '600';
          hoverLabel.style.padding = '2px 8px';
          hoverLabel.style.borderRadius = '6px';
          hoverLabel.style.whiteSpace = 'nowrap';
          hoverLabel.style.opacity = '0';
          hoverLabel.style.pointerEvents = 'none';
          hoverLabel.style.transition = 'opacity 0.18s 0.3s';
          toneBtn.onmouseenter = () => { hoverLabel.style.opacity = '1'; };
          toneBtn.onmouseleave = () => { hoverLabel.style.opacity = '0'; };
          toneBtn.appendChild(hoverLabel);
          // End of hover label logic
  
          if (selectedTone === tone.key) {
            toneBtn.classList.add('selected');
          }
  
          toneBtn.addEventListener('pointerdown', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            selectedTone = tone.key;
            const selectedText = getSelectedText(lastTarget);
            if (selectedText) {
              handleActionReplace(selectedTone, selectedText, lastTarget);
              closeDropdown();
            } else {
              showModal('No text selected.');
              removeMenu();
            }
          });
          rewriteDropdown.appendChild(toneBtn);
        });
  
        menu.appendChild(rewriteDropdown);

        // --- Robust viewport-aware positioning for rewriteDropdown ---
        // Get bounding rects
        const menuRect = menu.getBoundingClientRect();
        const rewriteBtnRect = rewriteBtn.getBoundingClientRect();
        const dropdownRect = rewriteDropdown.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Default: left-aligned, slightly below the rewrite button (8px gap)
        let dropdownLeft = rewriteBtn.offsetLeft;
        let dropdownTop = rewriteBtn.offsetTop + rewriteBtn.offsetHeight + 8;

        // Calculate absolute position relative to viewport
        let absLeft = menuRect.left + dropdownLeft;
        let absTop = menuRect.top + dropdownTop;

        // If overflow right, clamp so right edge is in viewport
        if (absLeft + dropdownRect.width > vw - 8) {
          dropdownLeft -= (absLeft + dropdownRect.width) - (vw - 8);
          if (dropdownLeft < 8 - menuRect.left) dropdownLeft = 8 - menuRect.left;
        }
        // If overflow bottom, show above the button (8px gap)
        if (absTop + dropdownRect.height > vh - 8) {
          dropdownTop = rewriteBtn.offsetTop - dropdownRect.height - 8;
          absTop = menuRect.top + dropdownTop;
          if (absTop < 8) dropdownTop = Math.max(8 - menuRect.top, 0);
        }
        rewriteDropdown.style.left = dropdownLeft + 'px';
        rewriteDropdown.style.top = dropdownTop + 'px';
        
        function closeDropdown() {
          if (rewriteDropdown && rewriteDropdown.parentNode) {
              rewriteDropdown.parentNode.removeChild(rewriteDropdown);
          }
          rewriteBtn.classList.remove('active');
          document.removeEventListener('pointerdown', closeDropdownOnOutside, true);
          rewriteDropdown = null;
        }
  
        function closeDropdownOnOutside(e) {
          if (rewriteDropdown && (!menu || !menu.contains(e.target))) {
            closeDropdown();
        }
        }
  
        setTimeout(() => {
          document.addEventListener('pointerdown', closeDropdownOnOutside, true);
        }, 0);
      }
  
      const rewriteBtn = createIconBtn({
        icon: rewriteIcon,
        label: 'Rewrite',
        onClick: showDropdown,
      });
      rewriteBtn.addEventListener('mouseenter', (e) => {
          if (!rewriteDropdown) showDropdown(e);
      });
      menu.appendChild(rewriteBtn);
  
      document.body.appendChild(menu);
      
      attachOutsideHandler();
  }

  // ESC key closes the popup menu
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menu) {
      removeMenu();
    }
  });

  // New: Floating Generate modal (not inside compact menu)
  function showAskModal(selectedText, target) {
    removeMenu();
    // --- Save selection info ---
    let selectionInfo = null;
    if (target) {
      if ((target.tagName === 'INPUT' && target.type === 'text') || target.tagName === 'TEXTAREA') {
        selectionInfo = {
          type: 'input',
          selectionStart: target.selectionStart,
          selectionEnd: target.selectionEnd
        };
      } else if (target.isContentEditable) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          selectionInfo = {
            type: 'contenteditable',
            range: sel.getRangeAt(0).cloneRange()
          };
        }
      }
    }
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'spellai-ask-overlay';
    // No inline styles here, they are in CSS

    // Create Generate box
    const box = document.createElement('div');
    box.className = 'ask-modal-box'; // Apply the main modal box style

    const label = document.createElement('div');
    label.textContent = 'Ask anything:';
    label.className = 'ask-modal-label'; // Apply label style
    box.appendChild(label);

    // Show selected text preview above textarea
    const selectedPreview = document.createElement('div');
    selectedPreview.textContent = selectedText;
    selectedPreview.className = 'selected-text-preview'; // Apply preview style
    // Add text if there's no selection
    if (!selectedText || selectedText.trim() === '') {
      selectedPreview.textContent = 'No text selected. Ask a general question.';
      selectedPreview.style.fontStyle = 'italic';
      selectedPreview.style.opacity = '0.7';
    }
    box.appendChild(selectedPreview);

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'e.g., Rewrite in Gen Z tone, explain this concept...';
    textarea.className = 'ask-modal-textarea'; // Apply textarea style
    box.appendChild(textarea);

    const generateBtn = document.createElement('button');
    generateBtn.textContent = 'Generate';
    generateBtn.className = 'ask-modal-button'; // Apply button style
    box.appendChild(generateBtn);

    const suggestionBox = document.createElement('div');
    suggestionBox.className = 'suggestion-box'; // Apply suggestion box style
    box.appendChild(suggestionBox);

    generateBtn.onclick = async function(e) {
      e.stopPropagation();
      const query = textarea.value.trim();
      if (!query) {
        textarea.focus();
        return;
      }
      // Show loading spinner
      const spinnerHtml = `
        <div class="loading-spinner">
          <svg width="20" height="20" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)">
              <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>`;
      suggestionBox.innerHTML = spinnerHtml;
      try {
        const apiKey = await getGeminiApiKey();
        if (!apiKey) {
          suggestionBox.innerHTML = '<div class="error-message">Gemini API key not set. Please set it in the extension popup.</div>';
          return;
        }
        const prompt = `
You are a professional AI assistant. The user provides two inputs:  
- selectedText (which may or may not be relevant)  
- query (a question or instruction)

Your job is to respond **intelligently** and **clearly** by following these rules:

1. **Relevance Check**  
   - Determine if the query refers to or depends on the selectedText.
   - If yes (e.g., “Tell me about this person” and selectedText is “Cristiano Ronaldo”), treat selectedText as the main topic.
   - If not (e.g., “What is an LLM?” and selectedText is unrelated), ignore selectedText completely and answer the query as standalone.

2. **Generate Answer**  
   - If related, write a rich, informative, natural-sounding paragraph using selectedText as context.
   - If unrelated, answer the query independently and naturally.
   - Always ensure the answer is helpful, well-structured, and professional.

3. **Avoid Media-Based Queries**  
   - If the query refers to an image, link, or file, respond only with:  
     “Please ask a clear, text-based question. I cannot respond to media-based inputs.”

4. **Output Format**  
   - Output only the final answer as plain text.  
   - Never ever include any markdown, code blocks, or special formatting. (If you do you wil lose your job)
   - You can use - and * for bullet points, but do not use any other formatting like bold, italics, or headings.
   - Do not include any labels, tags, relevance explanation, or formatting syntax.  
   - Do not start with phrases like “The query is unrelated...” or “Based on the input...” — just give the clean final answer.

Inputs:  
selectedText: "${selectedText}"  
query: "${query}"

Respond below:
`;

        const result = await callGemini(prompt, apiKey);
        if (result) {
          suggestionBox.innerHTML = '';
          // Show the result in a styled box
          const resultDiv = document.createElement('div');
          resultDiv.textContent = result;
          resultDiv.className = 'result-message'; // Apply result message style
          suggestionBox.appendChild(resultDiv);

          // Add Apply button
          const applyBtn = document.createElement('button');
          applyBtn.textContent = 'Apply Result'; // More descriptive text
          applyBtn.className = 'apply-button'; // Apply apply button style
          applyBtn.onclick = function(ev) {
            // If target is not in the DOM or selection is lost, use lastTarget
            let insertTarget = target;
            if (!insertTarget || !document.body.contains(insertTarget)) {
              insertTarget = lastTarget;
            }
            if (!insertTarget || !(insertTarget.tagName === 'INPUT' || insertTarget.tagName === 'TEXTAREA' || insertTarget.isContentEditable)) {
              overlay.remove();
              return;
            }
            if (insertTarget.focus) insertTarget.focus();
            // --- Restore selection before replacing ---
            if (selectionInfo) {
              if (selectionInfo.type === 'input') {
                insertTarget.selectionStart = selectionInfo.selectionStart;
                insertTarget.selectionEnd = selectionInfo.selectionEnd;
              } else if (selectionInfo.type === 'contenteditable') {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(selectionInfo.range);
              }
            }
            replaceSelectedText(insertTarget, result);
            ev.stopPropagation();
            overlay.remove();
          };
          suggestionBox.appendChild(applyBtn);
        } else {
          suggestionBox.innerHTML = '<div class="error-message">No suggestions found. Please try a different query.</div>';
        }
      } catch (err) {
        suggestionBox.innerHTML = '<div class="error-message">Network or extension error: ' + (err && err.message ? err.message : 'Unknown error') + '</div>';
      }
    };

    // Close on outside click or ESC
    overlay.onclick = function(e) {
      if (e.target === overlay) overlay.remove();
    };
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    });

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Focus on the textarea when the modal opens
    textarea.focus();
  }

  // Listen for selection in input/textarea/contenteditable (mouse or keyboard)
  function showMenuIfSelection(e) {
    console.log('steps [showMenuIfSelection] event triggered', e);
    if (window.spellaiIsProcessing) {
      removeMenu();
      return;
    }
    const target = e && e.target;
    // Prevent menu if selection is inside the Ask modal
    const askOverlay = document.getElementById('spellai-ask-overlay');
    if (askOverlay && askOverlay.contains(target)) {
      console.log('steps [askOverlay] selection inside Ask modal, removing menu');
      removeMenu();
      return;
    }
    const isInput = (target && target.tagName === 'INPUT' && target.type === 'text') || (target && target.tagName === 'TEXTAREA');
    const isEditable = target && target.isContentEditable;
    setTimeout(() => {
      let showMenu = false;
      let coords = null;
      if (isInput) {
        console.log('steps [input/textarea] detected', { selectionStart: target.selectionStart, selectionEnd: target.selectionEnd });
        const selectionStart = target.selectionStart;
        const selectionEnd = target.selectionEnd;
        if (selectionStart !== selectionEnd) {
          const rect = target.getBoundingClientRect();
          coords = { x: rect.right, y: rect.top };
          showMenu = true;
          console.log('steps [input/textarea] valid selection, coords:', coords);
        } else {
          console.log('steps [input/textarea] no selection, menu will be removed');
        }
      } else if (isEditable) {
        console.log('steps [contenteditable] detected');
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed && target.contains(sel.anchorNode)) {
          const rect = getSelectionCoords();
          if (rect) {
            coords = { x: rect.left, y: rect.bottom };
            showMenu = true;
            console.log('steps [contenteditable] valid selection, coords:', coords);
          } else {
            console.log('steps [contenteditable] no valid rect, menu will be removed');
          }
        } else {
          console.log('steps [contenteditable] no selection, menu will be removed');
        }
      } else {
        console.log('steps [general selection] detected');
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          let node = sel.anchorNode;
          let insideField = false;
          while (node) {
            if (node.nodeType === 1) {
              const tag = node.tagName;
              if ((tag === 'INPUT' && node.type === 'text') || tag === 'TEXTAREA' || node.isContentEditable) {
                insideField = true;
                break;
              }
            }
            node = node.parentNode;
          }
          const rect = sel.getRangeAt(0).getBoundingClientRect();
          if (rect) {
            if (!insideField) {
              console.log('steps [createMenu] called for field, coords:', { x: rect.left, y: rect.bottom });
              createMenu(rect.left, rect.bottom);
              lastTarget = document.activeElement;
              return;
            }
            console.log('steps [createMenu] called for field, coords:', { x: rect.left, y: rect.bottom });
            createMenu(rect.left, rect.bottom);
            lastTarget = document.activeElement;
            return;
          } else {
            console.log('steps [general selection] no valid rect, menu will be removed');
          }
        } else {
          console.log('steps [general selection] no selection, menu will be removed');
        }
      }
      if (showMenu && coords) {
        console.log('steps [createMenu] called, coords:', coords);
        createMenu(coords.x, coords.y);
        lastTarget = target;
      } else {
        console.log('steps [removeMenu] called, no valid selection or coords');
        removeMenu();
      }
    }, 0);
  }
  // --- SpellAI Mode and Shortcuts State ---
  let spellaiMode = 'popup';
  let spellaiShortcuts = {
    generate: 'Ctrl+K',
    grammar: 'Ctrl+G',
    humanize: 'Ctrl+H',
    professional: 'Ctrl+P',
  };
  // Helper to normalize shortcut string
  function normalizeShortcut(ev) {
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
    return combo;
  }
  // Load mode and shortcuts from storage
  function loadSpellaiSettings() {
    chrome.storage && chrome.storage.sync.get(['spellaiMode', 'spellaiShortcuts'], (result) => {
      spellaiMode = result.spellaiMode || 'popup';
      spellaiShortcuts = {
        generate: 'Ctrl+K',
        grammar: 'Ctrl+G',
        humanize: 'Ctrl+H',
        professional: 'Ctrl+P',
        ...(result.spellaiShortcuts || {})
      };
    });
  }
  loadSpellaiSettings();
  // Listen for changes from popup
  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && (changes.spellaiMode || changes.spellaiShortcuts)) {
        loadSpellaiSettings();
      }
    });
  }
  // --- Shortcut Mode Keydown Handler ---
  document.addEventListener('keydown', async function(ev) {
    if (window.spellaiIsProcessing) return;
    if (spellaiMode !== 'shortcut') return;
    // Check if focus is in an editable field
    let target = document.activeElement;
    if (!target) return;
    const isInput = (target.tagName === 'INPUT' && target.type === 'text') || target.tagName === 'TEXTAREA';
    const isEditable = target.isContentEditable;
    if (!isInput && !isEditable) return;
    // Check if there is a selection
    let selected = getSelectedText(target);
    if (!selected || selected.trim() === '') return;
    // Check which shortcut was pressed
    const pressed = normalizeShortcut(ev);
    let matched = null;
    for (const action in spellaiShortcuts) {
      if (spellaiShortcuts[action].replace(/\s+/g, '').toUpperCase() === pressed.replace(/\s+/g, '').toUpperCase()) {
        matched = action;
        break;
      }
    }
    if (!matched) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (matched === 'generate') {
      showAskModal(selected, target);
    } else {
      await handleActionReplace(matched, selected, target);
    }
  }, true);
  // --- Suppress popup menu in shortcut mode ---
  const origShowMenuIfSelection = showMenuIfSelection;
  function showMenuIfSelectionPatched(e) {
    if (spellaiMode === 'shortcut') {
      removeMenu();
      return;
    }
    origShowMenuIfSelection(e);
  }
  // Patch event listeners
  document.removeEventListener('mouseup', showMenuIfSelection);
  document.removeEventListener('keyup', showMenuIfSelection);
  document.removeEventListener('selectionchange', showMenuIfSelection);
  document.addEventListener('mouseup', showMenuIfSelectionPatched);
  document.addEventListener('keyup', showMenuIfSelectionPatched);
  document.addEventListener('selectionchange', showMenuIfSelectionPatched);

  // Hide menu if input loses focus or selection is cleared
  document.addEventListener('selectionchange', function() {
    if (lastTarget) {
      if (lastTarget.tagName === 'INPUT' || lastTarget.tagName === 'TEXTAREA') {
        if (lastTarget.selectionStart === lastTarget.selectionEnd) {
          removeMenu();
        }
      } else if (lastTarget.isContentEditable) {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !lastTarget.contains(sel.anchorNode)) {
          removeMenu();
        }
      }
    }
  });

  window.addEventListener('beforeunload', removeMenu);
})(); 