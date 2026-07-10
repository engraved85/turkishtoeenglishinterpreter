const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/token', async (req, res) => {
  const speechKey = process.env.SPEECH_KEY;
  const speechRegion = process.env.SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    return res.status(500).json({
      error: 'Missing SPEECH_KEY or SPEECH_REGION environment variables.',
    });
  }

  try {
    const response = await fetch(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Length': '0',
      },
    });

    if (!response.ok) {
      const body = await response.text();
      return res.status(502).json({
        error: 'Speech token request failed.',
        status: response.status,
        body,
      });
    }

    const token = await response.text();
    res.json({ token, region: speechRegion });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch speech token.',
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Interpreter app listening on http://localhost:${port}`);
});
