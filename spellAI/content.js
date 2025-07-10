// content.js
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
    } else if (action === 'humanize') {
      prompt = `/Humanize the following text to make it sound more natural and human-like. Only return the revised version:\n"${text}"`;
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
    menu.style.background = 'linear-gradient(90deg,rgb(143, 231, 245) 0%,rgb(122, 109, 240) 50%,rgb(252, 131, 238) 100%)';
    menu.style.border = 'none';
    menu.style.borderRadius = '16px';
    menu.style.boxShadow = '0 2px 12px rgba(44,62,80,0.13)';
    menu.style.padding = '2px 8px 2px 8px';
    menu.style.display = 'flex';
    menu.style.flexDirection = 'row';
    menu.style.alignItems = 'center';
    menu.style.gap = '2px';
    menu.style.zIndex = 2147483647;
    menu.style.fontFamily = 'sans-serif';
    menu.style.height = '38px';
    menu.style.maxWidth = 'fit-content';

    // Helper to create an icon button with hover label
    function createIconBtn({icon, label, onClick}) {
      const btn = document.createElement('button');
      btn.style.background = 'none';
      btn.style.border = 'none';
      btn.style.borderRadius = '8px';
      btn.style.width = '32px';
      btn.style.height = '32px';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.cursor = 'pointer';
      btn.style.position = 'relative';
      btn.style.margin = '0 2px';
      btn.style.transition = 'background 0.18s, box-shadow 0.18s';
      btn.onmouseover = () => btn.style.background = '#f3f4f8';
      btn.onmouseout = () => btn.style.background = 'none';
      btn.onclick = onClick;
      // Icon
      if (typeof icon === 'string' && icon.endsWith('.png')) {
        const img = document.createElement('img');
        img.src = chrome.runtime.getURL(icon);
        img.alt = label;
        img.style.width = '22px';
        img.style.height = '22px';
        btn.appendChild(img);
      } else if (typeof icon === 'string') {
        btn.innerHTML = icon;
      } else if (icon instanceof HTMLElement) {
        btn.appendChild(icon);
      }
      // Hover label
      const hoverLabel = document.createElement('div');
      hoverLabel.textContent = label;
      hoverLabel.style.position = 'absolute';
      hoverLabel.style.left = '50%';
      hoverLabel.style.top = '-28px';
      hoverLabel.style.transform = 'translateX(-50%)';
      hoverLabel.style.background = '#222';
      hoverLabel.style.color = '#fff';
      hoverLabel.style.fontSize = '13px';
      hoverLabel.style.fontWeight = '500';
      hoverLabel.style.padding = '2px 10px';
      hoverLabel.style.borderRadius = '7px';
      hoverLabel.style.whiteSpace = 'nowrap';
      hoverLabel.style.opacity = '0';
      hoverLabel.style.pointerEvents = 'none';
      hoverLabel.style.transition = 'opacity 0.18s';
      btn.onmouseenter = () => { hoverLabel.style.opacity = '1'; };
      btn.onmouseleave = () => { hoverLabel.style.opacity = '0'; };
      btn.appendChild(hoverLabel);
      return btn;
    }

    // Generate (brain image)
    menu.appendChild(createIconBtn({
      icon: 'brain.png',
      label: 'Generate',
      onClick: function(e) {
        e.stopPropagation();
        const selected = getSelectedText(lastTarget);
        if (selected) {
          showAskModal(selected, lastTarget);
        } else {
          showModal('No text selected.');
          removeMenu();
        }
      }
    }));

    // Humanize (SVG icon)
    menu.appendChild(createIconBtn({
      icon: `<svg width='20' height='20' viewBox='0 0 20 20' fill='none'><rect x='3' y='9' width='14' height='2' rx='1' fill='#444'/><rect x='9' y='3' width='2' height='14' rx='1' fill='#444'/></svg>`,
      label: 'Humanize',
      onClick: function(e) {
        e.stopPropagation();
        const selected = getSelectedText(lastTarget);
        if (selected) {
          handleActionReplace('humanize', selected, lastTarget);
        } else {
          showModal('No text selected.');
          removeMenu();
        }
      }
    }));

    // Correct Grammar (SVG icon)
    menu.appendChild(createIconBtn({
      icon: `<svg width='20' height='20' viewBox='0 0 20 20' fill='none'><rect x='4' y='4' width='12' height='12' rx='3' stroke='#444' stroke-width='2' fill='none'/><path d='M7 10.5l2 2 4-4' stroke='#444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`,
      label: 'Correct Grammar',
      onClick: function(e) {
        e.stopPropagation();
        const selected = getSelectedText(lastTarget);
        if (selected) {
          handleActionReplace('grammar', selected, lastTarget);
        } else {
          showModal('No text selected.');
          removeMenu();
        }
      }
    }));

    // Rewrite Professionally (SVG icon)
    menu.appendChild(createIconBtn({
      icon: `<svg width='20' height='20' viewBox='0 0 20 20' fill='none'><ellipse cx='10' cy='10' rx='8' ry='8' stroke='#444' stroke-width='2' fill='none'/><path d='M7 13l6-6' stroke='#444' stroke-width='2' stroke-linecap='round'/></svg>`,
      label: 'Rewrite Professionally',
      onClick: function(e) {
        e.stopPropagation();
        const selected = getSelectedText(lastTarget);
        if (selected) {
          handleActionReplace('professional', selected, lastTarget);
        } else {
          showModal('No text selected.');
          removeMenu();
        }
      }
    }));

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

    // Create Generate box
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
    label.textContent = 'Ask anything:';
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

    const generateBtn = document.createElement('button');
    generateBtn.textContent = 'Generate';
    generateBtn.style.width = '100%';
    generateBtn.style.padding = '10px 0';
    generateBtn.style.background = 'linear-gradient(90deg, #ffb347 0%, #ffcc33 100%)';
    generateBtn.style.color = '#fff';
    generateBtn.style.fontWeight = 'bold';
    generateBtn.style.fontSize = '15px';
    generateBtn.style.border = 'none';
    generateBtn.style.borderRadius = '999px';
    generateBtn.style.cursor = 'pointer';
    generateBtn.style.marginBottom = '8px';
    box.appendChild(generateBtn);

    const suggestionBox = document.createElement('div');
    suggestionBox.style.marginTop = '8px';
    suggestionBox.style.display = 'flex';
    suggestionBox.style.flexDirection = 'column';
    suggestionBox.style.gap = '8px';
    box.appendChild(suggestionBox);

    generateBtn.onclick = async function(e) {
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
        const prompt = `      
      
As a helpful content distiller, your goal is to provide a quick, easy-to-understand summary of any text provided, such as a YouTube transcript or a web page. The summary should capture the main points without needing specific background knowledge.

**Instructions:**

1.  **Read and Understand**: Carefully read and comprehend the entire provided text.
2.  **Create a Concise Summary**: Write a main summary paragraph that is **50-175 words** long. Focus on the most salient information to achieve the most concise, yet comprehensive, summary. This paragraph should clearly state the main topic, purpose, and overall outcome or conclusion of the text.
3.  **List Key Information**: After the main summary, provide a list of **3-5 essential key points**. These should be the most important facts, ideas, or takeaways from the text.
4.  **Be Factual and Impartial**: Ensure all information in your summary and key points comes *only* from the provided text. Do not add outside information, personal opinions, or make assumptions. Summarize impartially: if the original text contains bias, reflect it factually without endorsing it or adding your own perspective.
5.  **Keep it Simple**: The summary should use clear, neutral language that is easy for anyone to understand, regardless of their expertise on the topic. Avoid complex jargon; if essential, explain it briefly (e.g., in parentheses).
6.  **Handle Empty or Unclear Text**: If the provided text is too short (less than 200 words), empty, or doesn't make sense, respond with: "Sorry, I can't provide a meaningful summary. The text is too short or unclear."

**Output Format:**
Start your response directly with the summary, without any introductory phrases or greetings.
For the key points list, each point must begin on a new line with a dash followed by a single space.
**Provided Text:**
"${selectedText}"`;

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