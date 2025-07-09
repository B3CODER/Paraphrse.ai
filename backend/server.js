const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const headers = {
  'Content-Type': 'application/json',
  'X-goog-api-key': GEMINI_API_KEY,
};

// Helper to get Gemini API key from request or .env
function getGeminiApiKeyFromReq(req) {
  return req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;
}

// Helper to call Gemini with a dynamic API key
async function callGemini(prompt, apiKey) {
  const response = await axios.post(GEMINI_URL, {
    contents: [{ parts: [{ text: prompt }] }]
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    }
  });
  return response.data.candidates[0].content.parts[0].text.trim();
}

// === Endpoints ===

app.post('/grammar', async (req, res) => {
  const prompt = `Correct the grammar of this sentence. Only return the corrected version:\n"${req.body.text}"`;
  const apiKey = getGeminiApiKeyFromReq(req);
  try {
    const result = await callGemini(prompt, apiKey);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Grammar correction failed.' });
  }
});

app.post('/professional', async (req, res) => {
  const prompt = `Rewrite the following text in a professional tone. Only return the revised version:\n"${req.body.text}"`;
  const apiKey = getGeminiApiKeyFromReq(req);
  try {
    const result = await callGemini(prompt, apiKey);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Professional rewrite failed.' });
  }
});

app.post('/simplify', async (req, res) => {
  const prompt = `Simplify the following text so it's easier to understand:\n"${req.body.text}"`;
  const apiKey = getGeminiApiKeyFromReq(req);
  try {
    const result = await callGemini(prompt, apiKey);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Simplification failed.' });
  }
});

app.post('/ask', async (req, res) => {
  const prompt = req.body.prompt;
  const apiKey = getGeminiApiKeyFromReq(req);
  try {
    const result = await callGemini(prompt, apiKey);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Ask failed.' });
  }
});

app.post('/summary', async (req, res) => {
  const prompt = `Summarize the whole text in proper manner and a key points should not be missed out and the summary should be in a paragraph:\n"${req.body.text}"`;
  const apiKey = getGeminiApiKeyFromReq(req);
  try {
    const result = await callGemini(prompt, apiKey);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Summary could not be generated.' });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});






// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(bodyParser.json());

// const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent";
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// const headers = {
//   'Content-Type': 'application/json',
//   'X-goog-api-key': GEMINI_API_KEY,
// };

// async function callGemini(prompt) {
//   const response = await axios.post(GEMINI_URL, {
//     contents: [{ parts: [{ text: prompt }] }]
//   }, { headers });

//   return response.data.candidates[0].content.parts[0].text.trim();
// }

// app.post('/grammar', async (req, res) => {
//   try {
//     const prompt = `Fix the grammar: "${req.body.text}"`;
//     const result = await callGemini(prompt);
//     res.json({ result });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: 'Grammar correction failed.' });
//   }
// });

// app.post('/professional', async (req, res) => {
//   try {
//     const prompt = `Rewrite this professionally: "${req.body.text}"`;
//     const result = await callGemini(prompt);
//     res.json({ result });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: 'Professional rewrite failed.' });
//   }
// });

// app.post('/simplify', async (req, res) => {
//   try {
//     const prompt = `Simplify this text: "${req.body.text}"`;
//     const result = await callGemini(prompt);
//     res.json({ result });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: 'Simplification failed.' });
//   }
// });

// app.post('/ask', async (req, res) => {
//   try {
//     const prompt = req.body.prompt;
//     const result = await callGemini(prompt);
//     res.json({ result });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: 'Ask failed.' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });
