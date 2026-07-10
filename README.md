# Turkish ↔ English Spoken Interpreter

This project is a browser-based spoken interpreter app that translates live speech between Turkish and English. It uses Azure Speech Services for speech recognition and translation, and it is designed to be simple enough to run locally or publish as a static website on Azure.

## What this app does
- Captures microphone audio in the browser
- Recognizes spoken Turkish or English
- Translates the speech in real time
- Displays the spoken text and the translated text side by side
- Can play the translated text aloud in the browser
- Works as a lightweight Azure-hosted web app

## Architecture at a glance
The app uses a very simple architecture:
- Frontend: static HTML, CSS, and JavaScript in the public folder
- Backend: a small Node.js Express server that issues temporary Azure Speech access tokens
- Azure services used:
  - Azure Speech resource for speech recognition and translation
  - Azure Storage static website hosting for the frontend

## Project structure
- public/index.html — main UI
- public/app.js — speech recognition, translation, playback logic
- public/styles.css — styling
- public/config.js — runtime Azure Speech configuration
- server.js — Express server that provides Azure Speech tokens
- deploy.ps1 — Azure deployment script
- package.json — Node.js app metadata and dependencies

## Prerequisites
Before you run or deploy this project, make sure you have:
- Node.js 18+ installed
- Azure CLI installed and logged in
- An Azure subscription
- An Azure Speech resource created in Azure

## Quick start locally
Follow these steps exactly in order.

### 1. Clone the repository
```bash
git clone https://github.com/engraved85/turkishtoeenglishinterpreter.git
cd turkishtoeenglishinterpreter
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create an Azure Speech resource
If you do not already have one:
1. Open the Azure portal
2. Create a resource of type Azure AI Services / Speech
3. Note the resource name and region
4. Copy one of the keys from the resource

### 4. Configure environment variables
The backend expects these values:
- SPEECH_KEY
- SPEECH_REGION

Example on Windows PowerShell:
```powershell
$env:SPEECH_KEY = "<your-speech-key>"
$env:SPEECH_REGION = "<your-speech-region>"
```

Example on bash:
```bash
export SPEECH_KEY="<your-speech-key>"
export SPEECH_REGION="<your-speech-region>"
```

### 5. Start the app locally
```bash
npm start
```

Then open:
```text
http://localhost:3000
```

### 6. Use the app locally
1. Open the page in a browser
2. Allow microphone access
3. Choose a translation direction
4. Press Start Translation
5. Speak into the microphone
6. Read the translation and optionally press the speaker button to hear it aloud

## How the app works
The browser captures microphone audio and sends it to Azure Speech translation services. The backend provides a temporary token so the browser does not need to expose the Azure key directly.

### Supported directions
- Turkish → English
- English → Turkish

### Playback behavior
- The app can display the source and translated text live
- It can also read the translated text aloud using the browser’s speech synthesis

## Deployment to Azure
This project can be deployed to Azure using the included PowerShell script.

### What gets deployed
The deployment script creates and configures:
- A resource group
- An Azure Speech resource
- A Storage Account with static website hosting enabled
- The frontend files uploaded to the storage account website container

### Deploy from PowerShell
Run:
```powershell
./deploy.ps1 -SubscriptionId <your-subscription-id> -Location <your-location>
```

Example:
```powershell
./deploy.ps1 -SubscriptionId 84b46d67-e6a9-4742-93e2-eb234853b4db -Location eastus
```

### Important notes about deployment
- You must be signed in to Azure CLI with access to the target subscription
- The script creates the Azure resources automatically
- The frontend is published as a static website through Azure Storage
- The browser still uses Azure Speech directly, so the Speech resource key and region are needed

## Files you should know about
- server.js: small token endpoint for Azure Speech authentication
- public/app.js: main app logic
- public/index.html: UI structure
- public/styles.css: UI styling
- public/config.js: runtime configuration values for Speech key and region
- deploy.ps1: full Azure deployment script

## Troubleshooting
### Microphone not working
- Make sure your browser has permission to use the microphone
- Use a browser such as Chrome or Edge
- Try refreshing the page and re-allowing permissions

### No translation appearing
- Confirm the Azure Speech resource exists and is healthy
- Confirm the Speech key and region are correctly set
- Check the browser console for errors

### No sound playback
- Make sure the browser allows speech output and system audio is enabled
- Try a different browser
- Confirm the page can speak text through the browser’s built-in speech synthesis

## Cleanup and resource management
If you want to avoid leftover Azure resources, review the resource group created by the deployment script:
- tr-en-interpreter-rg

The main resources created are:
- Azure Speech resource
- Azure Storage account for static website hosting

You can delete them from the Azure portal when you no longer need the app.

## Summary
This repository contains a simple Azure-powered bilingual speech interpreter that can:
- translate spoken Turkish and English in real time
- run locally for development
- be published to Azure as a static website

If you want to keep improving it later, the next natural upgrades would be:
- sentence boundary detection for smoother playback
- better translation quality tuning
- multi-language support
- a backend translation pipeline for more advanced scenarios
