// popup.js
const API_BASE_URL = 'http://localhost:3000';

const popupBar = document.getElementById('popupBar');
const improveDropdown = document.getElementById('improveDropdown');
const askBox = document.getElementById('askBox');
const askInput = document.getElementById('askInput');
const askResponses = document.getElementById('askResponses');
const content = document.getElementById('content');
let selectedText = '';
let range;

document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  if (!selection.rangeCount) {
    popupBar.style.display = 'none';
    return;
  }

  const candidateRange = selection.getRangeAt(0);
  if (!content.contains(candidateRange.commonAncestorContainer)) {
    popupBar.style.display = 'none';
    return;
  }

  const text = selection.toString().trim();
  if (!text) {
    popupBar.style.display = 'none';
    return;
  }

  const rect = candidateRange.getBoundingClientRect();
  selectedText = text;
  range = candidateRange;

  popupBar.style.top = `${rect.bottom + 8}px`;
  popupBar.style.left = `${rect.left + 5}px`;
  popupBar.style.display = 'flex';

  improveDropdown.style.display = 'none';
  askBox.style.display = 'none';
  askInput.value = '';
  askResponses.innerHTML = '';
});

content.addEventListener('input', () => {
  const textContent = content.innerText.trim();
  if (!textContent) {
    popupBar.style.display = 'none';
    improveDropdown.style.display = 'none';
    askBox.style.display = 'none';
  }
});

document.addEventListener('mousedown', function (e) {
  const isInsidePopup =
    popupBar.contains(e.target) ||
    improveDropdown.contains(e.target) ||
    askBox.contains(e.target);

  if (!isInsidePopup) {
    popupBar.style.display = 'none';
    improveDropdown.style.display = 'none';
    askBox.style.display = 'none';
  }
});

function toggleDropdown(type) {
  const rect = popupBar.getBoundingClientRect();
  const top = `${rect.bottom + 2}px`;
  const left = `${rect.left}px`;

  if (type === 'improve') {
    improveDropdown.style.top = top;
    improveDropdown.style.left = left;
    improveDropdown.style.display = improveDropdown.style.display === 'flex' ? 'none' : 'flex';
    askBox.style.display = 'none';
  } else {
    askBox.style.top = top;
    askBox.style.left = left;
    askBox.style.display = 'flex';
    improveDropdown.style.display = 'none';
  }
}

async function handleAction(action) {
  if (!selectedText) return;

  const response = await fetch(`${API_BASE_URL}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: selectedText })
  });

  const data = await response.json();
  const newText = data.result || '[No output]';
  replaceSelection(newText);
}

async function handleAsk() {
  const prompt = askInput.value.trim();
  if (!prompt || !selectedText) return;
  askResponses.innerHTML = '<em>Loading...</em>';

  const fullPrompt = `${prompt}\n\nText:\n"${selectedText}"\nGive 3 distinct suggestions. Format:\n- Suggestion 1\n- Suggestion 2\n- Suggestion 3`;

  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: fullPrompt })
  });

  const data = await response.json();
  const suggestions = data.result.split(/\n\s*[-*]\s*/).filter(s => s.trim());

  askResponses.innerHTML = suggestions.map(s =>
    `<div class='response-option'>${s}</div>`
  ).join('');

  document.querySelectorAll('.response-option').forEach(el => {
    el.addEventListener('click', () => replaceSelection(el.textContent));
  });
}

function replaceSelection(newText) {
  if (range) {
    range.deleteContents();
    range.insertNode(document.createTextNode(newText));
    popupBar.style.display = 'none';
    improveDropdown.style.display = 'none';
    askBox.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('improveBtn').addEventListener('click', () => toggleDropdown('improve'));
  document.getElementById('askBtn').addEventListener('click', () => toggleDropdown('ask'));
  document.getElementById('fixGrammar').addEventListener('click', () => handleAction('grammar'));
  document.getElementById('rewriteProfessional').addEventListener('click', () => handleAction('professional'));
  document.getElementById('simplifyText').addEventListener('click', () => handleAction('simplify'));
  document.getElementById('askAiBtn').addEventListener('click', handleAsk);
});
