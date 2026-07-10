const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const speakButton = document.getElementById('speakButton');
const directionSelect = document.getElementById('directionSelect');
const speakToggle = document.getElementById('speakToggle');
const statusEl = document.getElementById('status');
const sourceOutput = document.getElementById('sourceOutput');
const translationOutput = document.getElementById('translationOutput');
const sourceHeading = document.getElementById('sourceHeading');
const translationHeading = document.getElementById('translationHeading');

let recognizer = null;
let synthesizer = null;
let lastTranslatedText = '';
let lastTranslatedLanguage = 'en';
let pendingSourceText = '';
let pendingTranslationText = '';
let currentPlaybackLanguage = 'en';
let recognitionBuffer = [];

function updateStatus(message) {
  statusEl.textContent = message;
}

function appendLine(element, message) {
  element.textContent = `${element.textContent}${message}\n`;
  element.scrollTop = element.scrollHeight;
}

function clearTranscript() {
  sourceOutput.textContent = '';
  translationOutput.textContent = '';
  lastTranslatedText = '';
  lastTranslatedLanguage = 'en';
  pendingSourceText = '';
  pendingTranslationText = '';
  currentPlaybackLanguage = 'en';
  recognitionBuffer = [];
  speakButton.disabled = true;
}

function stopSpeechPlayback() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function playTranslatedText(text, language) {
  if (!text) {
    return;
  }

  stopSpeechPlayback();

  if (!('speechSynthesis' in window)) {
    updateStatus('Text-to-speech is not supported in this browser.');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'tr' ? 'tr-TR' : 'en-US';
  currentPlaybackLanguage = language;
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.onend = () => {
    updateStatus('Playback finished.');
  };

  window.speechSynthesis.speak(utterance);
  updateStatus(`Playing ${language === 'tr' ? 'Turkish' : 'English'} translation.`);
}

function getDirectionConfig() {
  if (directionSelect.value === 'en-tr') {
    return {
      sourceLanguage: 'en-US',
      targetLanguage: 'tr',
      sourceLabel: 'English',
      translationLabel: 'Turkish',
      prompt: 'Speak English now.',
    };
  }

  return {
    sourceLanguage: 'tr-TR',
    targetLanguage: 'en',
    sourceLabel: 'Turkish',
    translationLabel: 'English',
    prompt: 'Speak Turkish now.',
  };
}

function updateDirectionLabels() {
  const direction = getDirectionConfig();
  sourceHeading.textContent = direction.sourceLabel;
  translationHeading.textContent = direction.translationLabel;
}

async function requestToken() {
  const config = window.__SPEECH_CONFIG__ || {};

  if (config.key && config.region) {
    return { key: config.key, region: config.region };
  }

  const response = await fetch('/token');

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token request failed: ${body}`);
  }

  return response.json();
}

async function startRecognition() {
  if (recognizer) {
    return;
  }

  const direction = getDirectionConfig();
  updateDirectionLabels();
  clearTranscript();
  speakButton.disabled = true;

  updateStatus('Requesting Azure Speech token...');
  const auth = await requestToken();

  const speechConfig = auth.key
    ? SpeechSDK.SpeechTranslationConfig.fromSubscription(auth.key, auth.region)
    : SpeechSDK.SpeechTranslationConfig.fromAuthorizationToken(auth.token, auth.region);
  speechConfig.speechRecognitionLanguage = direction.sourceLanguage;
  speechConfig.addTargetLanguage(direction.targetLanguage);

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  recognizer = new SpeechSDK.TranslationRecognizer(speechConfig, audioConfig);

  recognizer.recognizing = (s, e) => {
    if (e.result.text) {
      updateStatus('Listening...');
    }
  };

  recognizer.recognized = (s, e) => {
    if (!e.result) {
      return;
    }

    const sourceText = e.result.text;
    const translatedText = e.result.translations.get(direction.targetLanguage);

    if (sourceText) {
      pendingSourceText = sourceText;
      appendLine(sourceOutput, sourceText);
    }

    if (translatedText) {
      recognitionBuffer.push(translatedText);
      const combinedTranslation = recognitionBuffer.join(' ').trim();
      pendingTranslationText = combinedTranslation;
      sourceOutput.textContent = '';
      translationOutput.textContent = '';
      appendLine(sourceOutput, pendingSourceText);
      appendLine(translationOutput, pendingTranslationText);
      lastTranslatedText = pendingTranslationText;
      lastTranslatedLanguage = direction.targetLanguage;
      speakButton.disabled = false;

      if (speakToggle.checked) {
        playTranslatedText(lastTranslatedText, direction.targetLanguage);
      }
    }
  };

  recognizer.canceled = (s, e) => {
    updateStatus(`Canceled: ${e.errorDetails || e.reason}`);
    stopRecognition();
  };

  recognizer.sessionStopped = () => {
    updateStatus('Session stopped');
    stopRecognition();
  };

  recognizer.startContinuousRecognitionAsync(
    () => {
      updateStatus(`Translation started. ${direction.prompt}`);
      startButton.disabled = true;
      stopButton.disabled = false;
    },
    (error) => {
      updateStatus(`Error starting recognition: ${error}`);
      recognizer = null;
    }
  );
}

function stopRecognition() {
  const currentRecognizer = recognizer;
  if (!currentRecognizer) {
    return;
  }

  recognizer = null;
  stopSpeechPlayback();

  currentRecognizer.stopContinuousRecognitionAsync(
    () => {
      updateStatus('Translation stopped.');
      try {
        currentRecognizer.close();
      } catch (error) {
        console.warn(error);
      }
      startButton.disabled = false;
      stopButton.disabled = true;
      speakButton.disabled = !lastTranslatedText;
    },
    (error) => {
      updateStatus(`Error stopping recognition: ${error}`);
      try {
        currentRecognizer.close();
      } catch (closeError) {
        console.warn(closeError);
      }
      startButton.disabled = false;
      stopButton.disabled = true;
      speakButton.disabled = !lastTranslatedText;
    }
  );
}

startButton.addEventListener('click', () => {
  startRecognition().catch((error) => {
    updateStatus(`Error: ${error.message}`);
  });
});

stopButton.addEventListener('click', stopRecognition);
speakButton.addEventListener('click', () => {
  if (!lastTranslatedText) {
    updateStatus('No translated text to play yet.');
    return;
  }

  playTranslatedText(lastTranslatedText, lastTranslatedLanguage);
  updateStatus(`Playing ${lastTranslatedLanguage === 'tr' ? 'Turkish' : 'English'} translation.`);
});
directionSelect.addEventListener('change', () => {
  updateDirectionLabels();
  clearTranscript();
  if (recognizer) {
    stopRecognition();
  }
});

updateDirectionLabels();
