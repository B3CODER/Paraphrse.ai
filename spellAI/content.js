// content.js
// This script injects a floating menu when text is selected in input or textarea fields.
// The menu provides 'Improve' (with 'Simply' and 'Correct grammar') and 'Ask' options.
// AI logic is not implemented yet; placeholders are provided.

(function() {
  let menu = null;
  let lastTarget = null;

  // Helper to remove the menu
  function removeMenu() {
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
    let rect;
    if (range.getClientRects().length > 0) {
      rect = range.getClientRects()[0];
    } else {
      // Create a temporary span if selection is collapsed
      const span = document.createElement('span');
      // Zero-width non-breaking space
      span.appendChild(document.createTextNode('\u200b'));
      range.insertNode(span);
      rect = span.getBoundingClientRect();
      span.parentNode.removeChild(span);
      // Restore selection
      sel.removeAllRanges();
      sel.addRange(range);
    }
    return rect;
  }

  // Helper to get selected text from input, textarea, or contenteditable
  function getSelectedText(target) {
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
    spinner.innerHTML = `<svg width="32" height="32" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#0074D9" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg>`;
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
  function getGeminiApiKey() {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result.geminiApiKey || null);
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

  // Helper to call Gemini and replace text for each action
  async function handleActionReplace(action, text, target) {
    let prompt = '';
    if (action === 'grammar') {
      prompt = `Correct the grammar of this sentence. Only return the corrected version:\n"${text}"`;
    } else if (action === 'simplify') {
      prompt = `Simplify the following text so it's easier to understand:\n"${text}"`;
    } else if (action === 'ask') {
      prompt = text;
    } else if (action === 'professional') {
      prompt = `Rewrite the following text in a professional tone. Only return the revised version:\n"${text}"`;
    }
    showMenuLoading();
    try {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        showModal('Gemini API key not set. Please set it in the extension popup.');
        removeMenu();
        return;
      }
      const result = await callGemini(prompt, apiKey);
      if (result) {
        replaceSelectedText(target, result);
        removeMenu();
      } else {
        showModal('Error: No result from Gemini API.');
        removeMenu();
      }
    } catch (err) {
      showModal('Network or extension error: ' + (err && err.message ? err.message : err));
      removeMenu();
    }
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
  function createMenu(x, y) {
    removeMenu();
    menu = document.createElement('div');
    menu.id = 'spellai-menu';
    menu.style.position = 'fixed';
    menu.style.top = `${y + 5}px`;
    menu.style.left = `${x + 5}px`;
    menu.style.background = 'rgba(243, 192, 125, 0.85)'; // Light, subtle background
    menu.style.border = 'none';
    menu.style.borderRadius = '16px';
    menu.style.boxShadow = '0 2px 12px rgba(44,62,80,0.10)';
    menu.style.padding = '10px 0 6px 0';
    menu.style.minWidth = '50px';
    menu.style.display = 'flex';
    menu.style.flexDirection = 'column';
    menu.style.gap = '8px';
    menu.style.zIndex = 2147483647;
    menu.style.fontFamily = 'sans-serif';

    // Helper to style buttons with gradient, emoji, and label
    function styleBtn(btn, gradient, emoji, label) {
      btn.innerHTML = `<span style=\"font-size:18px;vertical-align:middle;margin-right:8px;\">${emoji}</span>
        <span style=\"font-size:14px;font-weight:600;vertical-align:middle;\">${label}</span>`;
      btn.style.background = gradient;
      btn.style.color = '#fff';
      btn.style.fontWeight = 'bold';
      btn.style.fontSize = '6px';
      btn.style.border = 'none';
      btn.style.borderRadius = '999px';
      btn.style.padding = '3px 5px';
      btn.style.margin = '0 10px';
      btn.style.cursor = 'pointer';
      btn.style.boxShadow = '0 1px 4px rgba(44,62,80,0.10)';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.gap = '8px';
      btn.style.transition = 'background 0.18s, box-shadow 0.18s';
      btn.onmouseover = () => btn.style.boxShadow = '0 2px 8px rgba(44,62,80,0.18)';
      btn.onmouseout = () => btn.style.boxShadow = '0 1px 4px rgba(44,62,80,0.10)';
    }

    // Correct grammar (blue gradient)
    const correctBtn = document.createElement('button');
    styleBtn(correctBtn, 'linear-gradient(90deg, #36d1c4 0%, #5b6bfa 100%)', '📝', 'Correct grammar');
    correctBtn.onclick = function(e) {
      e.stopPropagation();
      const selected = getSelectedText(lastTarget);
      if (selected) {
        handleActionReplace('grammar', selected, lastTarget);
      } else {
        showModal('No text selected.');
        removeMenu();
      }
    };
    menu.appendChild(correctBtn);

    // Simplify (green gradient)
    const simplifyBtn = document.createElement('button');
    styleBtn(simplifyBtn, 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)', '✂️', 'Simplify');
    simplifyBtn.onclick = function(e) {
      e.stopPropagation();
      const selected = getSelectedText(lastTarget);
      if (selected) {
        handleActionReplace('simplify', selected, lastTarget);
      } else {
        showModal('No text selected.');
        removeMenu();
      }
    };
    menu.appendChild(simplifyBtn);

    // Rewrite in professional manner (purple-pink gradient)
    const professionalBtn = document.createElement('button');
    styleBtn(professionalBtn, 'linear-gradient(90deg, #a259ff 0%, #ff6a88 100%)', '🧑‍💼', 'Rewrite in professional manner');
    professionalBtn.onclick = function(e) {
      e.stopPropagation();
      const selected = getSelectedText(lastTarget);
      if (selected) {
        handleActionReplace('professional', selected, lastTarget);
      } else {
        showModal('No text selected.');
        removeMenu();
      }
    };
    menu.appendChild(professionalBtn);

    // Ask (orange-yellow gradient)
    const askBtn = document.createElement('button');
    styleBtn(askBtn, 'linear-gradient(90deg, #ffb347 0%, #ffcc33 100%)', '💡', 'Ask');
    askBtn.onclick = function(e) {
      e.stopPropagation();
      const selected = getSelectedText(lastTarget);
      if (selected) {
        showAskModal(selected, lastTarget);
      } else {
        showModal('No text selected.');
        removeMenu();
      }
    };
    menu.appendChild(askBtn);

    document.body.appendChild(menu);
    attachOutsideHandler();
  }

  // ESC key closes the popup menu
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menu) {
      removeMenu();
    }
  });

  // New: Floating Ask modal (not inside compact menu)
  function showAskModal(selectedText, target) {
    removeMenu();
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'spellai-ask-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.18)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 2147483647;

    // Create Ask box
    const box = document.createElement('div');
    box.style.background = '#fff';
    box.style.padding = '22px 20px 18px 20px';
    box.style.borderRadius = '14px';
    box.style.boxShadow = '0 4px 24px rgba(44,62,80,0.13)';
    box.style.minWidth = '320px';
    box.style.maxWidth = '90vw';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.gap = '12px';

    const label = document.createElement('div');
    label.textContent = 'Ask anything about the selected text:';
    label.style.fontWeight = 'bold';
    label.style.fontSize = '15px';
    label.style.marginBottom = '2px';
    box.appendChild(label);

    // Show selected text preview above textarea
    const selectedPreview = document.createElement('div');
    selectedPreview.textContent = selectedText;
    selectedPreview.style.background = '#f6f8fa';
    selectedPreview.style.color = '#222';
    selectedPreview.style.fontSize = '13px';
    selectedPreview.style.padding = '7px 10px';
    selectedPreview.style.border = '1px solid #e0e6ef';
    selectedPreview.style.borderRadius = '6px';
    selectedPreview.style.marginBottom = '7px';
    selectedPreview.style.maxHeight = '60px';
    selectedPreview.style.overflowY = 'auto';
    selectedPreview.style.whiteSpace = 'pre-wrap';
    box.appendChild(selectedPreview);

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'e.g., Rewrite in Gen Z tone...';
    textarea.style.width = '100%';
    textarea.style.minHeight = '44px';
    textarea.style.padding = '8px 12px';
    textarea.style.fontSize = '14px';
    textarea.style.border = '1.5px solid #2074d4';
    textarea.style.borderRadius = '7px';
    textarea.style.marginBottom = '6px';
    textarea.style.background = '#fff';
    textarea.style.color = '#222';
    textarea.style.outline = 'none';
    textarea.style.resize = 'vertical';
    box.appendChild(textarea);

    const askBtn = document.createElement('button');
    askBtn.textContent = 'Generate';
    askBtn.style.width = '100%';
    askBtn.style.padding = '10px 0';
    askBtn.style.background = 'linear-gradient(90deg, #ffb347 0%, #ffcc33 100%)';
    askBtn.style.color = '#fff';
    askBtn.style.fontWeight = 'bold';
    askBtn.style.fontSize = '15px';
    askBtn.style.border = 'none';
    askBtn.style.borderRadius = '999px';
    askBtn.style.cursor = 'pointer';
    askBtn.style.marginBottom = '8px';
    box.appendChild(askBtn);

    const suggestionBox = document.createElement('div');
    suggestionBox.style.marginTop = '8px';
    suggestionBox.style.display = 'flex';
    suggestionBox.style.flexDirection = 'column';
    suggestionBox.style.gap = '8px';
    box.appendChild(suggestionBox);

    askBtn.onclick = async function(e) {
      e.stopPropagation();
      const query = textarea.value.trim();
      if (!query) {
        textarea.focus();
        return;
      }
      // Show loading spinner
      suggestionBox.innerHTML = '<div style="text-align:center;padding:12px"><svg width="32" height="32" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#0074D9" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg></div>';
      try {
        const apiKey = await getGeminiApiKey();
        if (!apiKey) {
          suggestionBox.innerHTML = '<div style="color:#b00;text-align:center">Gemini API key not set. Please set it in the extension popup.</div>';
          return;
        }
        const prompt = `${query}\n\nText: ${selectedText}`;
        const result = await callGemini(prompt, apiKey);
        if (result) {
          suggestionBox.innerHTML = '';
          // Show the result in a styled box
          const resultDiv = document.createElement('div');
          resultDiv.textContent = result;
          resultDiv.style.background = 'linear-gradient(90deg, #f8ffae 0%, #43c6ac 100%)';
          resultDiv.style.color = '#222';
          resultDiv.style.borderRadius = '999px';
          resultDiv.style.padding = '12px 18px';
          resultDiv.style.margin = '0 0 10px 0';
          resultDiv.style.fontSize = '15px';
          resultDiv.style.boxShadow = '0 1px 4px rgba(44,62,80,0.10)';
          resultDiv.style.wordBreak = 'break-word';
          suggestionBox.appendChild(resultDiv);
          // Add Apply button
          const applyBtn = document.createElement('button');
          applyBtn.textContent = 'Apply';
          applyBtn.style.display = 'block';
          applyBtn.style.width = '100%';
          applyBtn.style.padding = '10px 0';
          applyBtn.style.background = 'linear-gradient(90deg, #36d1c4 0%, #5b6bfa 100%)';
          applyBtn.style.color = '#fff';
          applyBtn.style.fontWeight = 'bold';
          applyBtn.style.fontSize = '15px';
          applyBtn.style.border = 'none';
          applyBtn.style.borderRadius = '999px';
          applyBtn.style.cursor = 'pointer';
          applyBtn.style.marginTop = '6px';
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
            replaceSelectedText(insertTarget, result);
            ev.stopPropagation();
            overlay.remove();
          };
          suggestionBox.appendChild(applyBtn);
        } else {
          suggestionBox.innerHTML = '<div style="color:#b00;text-align:center">No suggestions found.</div>';
        }
      } catch (err) {
        suggestionBox.innerHTML = '<div style="color:#b00;text-align:center">Network or extension error: ' + (err && err.message ? err.message : err) + '</div>';
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
  }

  // Helper to show summary menu for general page selection
  function showSummaryMenu(x, y, selectedText) {
    removeMenu();
    menu = document.createElement('div');
    menu.id = 'spellai-menu';
    menu.style.position = 'fixed';
    menu.style.top = `${y + 5}px`;
    menu.style.left = `${x + 5}px`;
    menu.style.background = 'none'; // No background
    menu.style.border = 'none';
    menu.style.padding = '0';
    menu.style.margin = '0';
    menu.style.boxShadow = 'none';
    menu.style.borderRadius = '0';
    menu.style.minWidth = 'unset';
    menu.style.display = 'block';
    menu.style.zIndex = 2147483647;
    menu.style.fontFamily = 'sans-serif';

    const summaryBtn = document.createElement('button');
    summaryBtn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <span style="font-size:18px;">✨🧙‍♂️</span>
        <span style="font-size:16px;font-weight:500;">Summary</span>
      </span>
    `;
    summaryBtn.style.padding = '7px 18px';
    summaryBtn.style.background = 'linear-gradient(90deg, #36d1c4 0%, #5b6bfa 100%)';
    summaryBtn.style.color = '#fff';
    summaryBtn.style.fontWeight = 'bold';
    summaryBtn.style.fontSize = '16px';
    summaryBtn.style.border = 'none';
    summaryBtn.style.borderRadius = '999px';
    summaryBtn.style.cursor = 'pointer';
    summaryBtn.style.boxShadow = '0 2px 8px rgba(44, 62, 80, 0.10)';
    summaryBtn.style.transition = 'background 0.2s, box-shadow 0.2s';
    summaryBtn.onmouseover = () => summaryBtn.style.boxShadow = '0 4px 16px rgba(44, 62, 80, 0.18)';
    summaryBtn.onmouseout = () => summaryBtn.style.boxShadow = '0 2px 8px rgba(44, 62, 80, 0.10)';
    summaryBtn.onclick = async function(e) {
      e.stopPropagation();
      showMenuLoading();
      try {
        const apiKey = await getGeminiApiKey();
        if (!apiKey) {
          showModal('Gemini API key not set. Please set it in the extension popup.');
          removeMenu();
          return;
        }
        const prompt = `Summarize the whole text in proper manner and a key points should not be missed out and the summary should be in a paragraph:\n"${selectedText}"`;
        const result = await callGemini(prompt, apiKey);
        if (result) {
          showModal(result);
        } else {
          showModal('Error: No result from Gemini API.');
        }
      } catch (err) {
        showModal('Network or extension error: ' + (err && err.message ? err.message : err));
      }
      removeMenu();
    };
    menu.appendChild(summaryBtn);
    document.body.appendChild(menu);
    attachOutsideHandler();
  }

  // Remove menu if clicking outside
  function onDocClick(e) {
    if (menu && !menu.contains(e.target)) {
      removeMenu();
    }
  }

  // Listen for selection in input/textarea/contenteditable (mouse or keyboard)
  function showMenuIfSelection(e) {
    const target = e.target;
    // Prevent menu if selection is inside the Ask modal
    const askOverlay = document.getElementById('spellai-ask-overlay');
    if (askOverlay && askOverlay.contains(target)) {
      removeMenu();
      return;
    }
    const isInput = (target.tagName === 'INPUT' && target.type === 'text') || target.tagName === 'TEXTAREA';
    const isEditable = target.isContentEditable;
    setTimeout(() => {
      let showMenu = false;
      let coords = null;
      if (isInput) {
        const selectionStart = target.selectionStart;
        const selectionEnd = target.selectionEnd;
        if (selectionStart !== selectionEnd) {
          const rect = target.getBoundingClientRect();
          coords = { x: rect.right, y: rect.top };
          showMenu = true;
        }
      } else if (isEditable) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed && target.contains(sel.anchorNode)) {
          const rect = getSelectionCoords();
          if (rect) {
            coords = { x: rect.left, y: rect.bottom };
            showMenu = true;
          }
        }
      } else {
        // Not input/textarea/contenteditable: check for general selection
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          const selectedText = sel.toString();
          if (selectedText.trim().length > 0) {
            // Check if selection is inside an input/textarea/contenteditable
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
            if (!insideField) {
              const rect = sel.getRangeAt(0).getBoundingClientRect();
              if (rect && rect.width > 0 && rect.height > 0) {
                showSummaryMenu(rect.left, rect.bottom, selectedText);
                return;
              }
            }
          }
        }
      }
      if (showMenu && coords) {
        createMenu(coords.x, coords.y);
        lastTarget = target;
      } else {
        removeMenu();
      }
    }, 0);
  }
  document.addEventListener('mouseup', showMenuIfSelection);
  document.addEventListener('keyup', showMenuIfSelection);

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