// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(bodyParser.json());

// const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
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

// // === Endpoints ===

// app.post('/grammar', async (req, res) => {
//   const prompt = `Correct the grammar of this sentence. Only return the corrected version:\n"${req.body.text}"`;
//   try {
//     const result = await callGemini(prompt);
//     res.json({ result });
//   } catch (err) {
//     res.status(500).json({ error: 'Grammar correction failed.' });
//   }
// });

// app.post('/professional', async (req, res) => {
//   const prompt = `Rewrite the following text in a professional tone. Only return the revised version:\n"${req.body.text}"`;
//   try {
//     const result = await callGemini(prompt);
//     res.json({ result });
//   } catch (err) {
//     res.status(500).json({ error: 'Professional rewrite failed.' });
//   }
// });

// app.post('/simplify', async (req, res) => {
//   const prompt = `Simplify the following text so it's easier to understand:\n"${req.body.text}"`;
//   try {
//     const result = await callGemini(prompt);
//     res.json({ result });
//   } catch (err) {
//     res.status(500).json({ error: 'Simplification failed.' });
//   }
// });

// app.post('/ask', async (req, res) => {
//   const prompt = req.body.prompt;
//   try {
//     const result = await callGemini(prompt);
//     res.json({ result });
//   } catch (err) {
//     res.status(500).json({ error: 'Ask failed.' });
//   }
// });


// app.listen(PORT, () => {
//   console.log(`✅ Server running at http://localhost:${PORT}`);
// });






const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const headers = {
  'Content-Type': 'application/json',
  'X-goog-api-key': GEMINI_API_KEY,
};

async function callGemini(prompt) {
  const response = await axios.post(GEMINI_URL, {
    contents: [{ parts: [{ text: prompt }] }]
  }, { headers });

  return response.data.candidates[0].content.parts[0].text.trim();
}

app.post('/grammar', async (req, res) => {
  try {
    const prompt = `Fix the grammar: "${req.body.text}"`;
    const result = await callGemini(prompt);
    res.json({ result });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Grammar correction failed.' });
  }
});

app.post('/professional', async (req, res) => {
  try {
    const prompt = `Rewrite this professionally: "${req.body.text}"`;
    const result = await callGemini(prompt);
    res.json({ result });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Professional rewrite failed.' });
  }
});

app.post('/simplify', async (req, res) => {
  try {
    const prompt = `Simplify this text: "${req.body.text}"`;
    const result = await callGemini(prompt);
    res.json({ result });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Simplification failed.' });
  }
});

app.post('/ask', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const result = await callGemini(prompt);
    res.json({ result });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ask failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
