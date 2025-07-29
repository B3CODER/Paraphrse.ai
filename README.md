# Paraphrase AI Chrome Extension

Paraphrase AI is a lightweight and powerful Chrome extension that enhances your writing with AI. Select any text inside a text area (like input boxes or editable fields) and instantly improve it using grammar correction, professional rewriting, or a more humanized tone. You can also ask questions directly related to the selected text — or anything else — using Google Gemini AI.

---

## Features

- **Text Area Support**: Works only when text is selected inside a text area or editable field.
- **Rewrite Options**:
  - **Humanize Text**
  - **Grammar Correction**
  - **Rewrite Professionally**
- **Generate (Ask Anything)**: Ask any question about the selected text or anything else. The AI will generate a relevant response.
- **Secure API Key Storage**: Gemini API key is encrypted and stored in local storage.
- **Shortcut Support**: Use custom or default keyboard shortcuts for quick access.
- **Minimal UI for Maximum Focus**

---

## How It Works

1. **Select Text** inside a **text area** or **editable field** (e.g., form inputs, comment boxes, editors).
2. A **Popup Appears** with two options:
   - **Generate**: Ask anything related to the selected text.
   - **Rewrite**: Choose from Humanize, Grammar Correction, or Professional Rewrite.
3. The tool sends your request to **Gemini AI API** and displays the result instantly.

> ❗ This extension does **not** work on static webpage text — it only triggers inside editable input fields.

---

## Setup Instructions

### Step 1: Get Your Gemini API Key
1. Follow this guide to create your Gemini API key:  
   [How to Create a Google Gemini API Key – Step-by-Step (Medium)](https://medium.com/@bdfine9/how-to-create-a-google-gemini-api-key-a-step-by-step-guide-a78bf5d32b98)
2. Copy the key for the next step.

### Step 2: Load Extension in Chrome
1. Download or clone this repository.
2. Open `chrome://extensions/` in your Chrome browser.
3. Enable **Developer Mode** (top right).
4. Click **Load Unpacked** and select the extension folder.

### Step 3: Add Your API Key
1. Open the extension popup.
2. Paste your Gemini API key.
3. Your key is **securely encrypted** and stored in **local storage**.

---

## Keyboard Shortcuts

You can use the extension via:
- **Popup UI** (Click the extension icon)
- **Keyboard Shortcut**

### Default Shortcut Flow:
1. Press **Ctrl + A** to select text inside a text area.
2. Use the configured shortcut (or default) to trigger the extension.

---

## Tips for Best Use

- Works **only inside text areas**, not on static or read-only webpage text.
- Use **Generate** to ask clarifying questions or get suggestions.
- Use **Rewrite** for grammar fixes, tone improvements, and more natural phrasing.

---

## Security Note

- Your Gemini API key is **never sent or stored externally**.
- It is **encrypted and stored locally** in your browser.

---

## Support

For issues, feature requests, or feedback, feel free to open an issue on the repository or contact us directly.

---

## License

This project is open-source and available under the [MIT License](LICENSE).
