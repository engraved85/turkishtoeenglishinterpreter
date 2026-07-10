param(
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId = '',
    [string]$ResourceGroup = 'tr-en-interpreter-rg',
    [string]$Location = 'eastus',
    [string]$StorageAccountName = "treninterp$([Guid]::NewGuid().ToString('N').Substring(0, 8))",
    [string]$SpeechResourceName = "tr-en-speech-$([Guid]::NewGuid().ToString('N').Substring(0, 8))"
)

Write-Host "Using subscription: $SubscriptionId"
az account set --subscription $SubscriptionId

Write-Host "Creating resource group $ResourceGroup in $Location"
az group create --name $ResourceGroup --location $Location | Out-Null

Write-Host "Creating Azure Speech resource: $SpeechResourceName"
az cognitiveservices account create --name $SpeechResourceName --resource-group $ResourceGroup --kind SpeechServices --sku S0 --location $Location --yes | Out-Null

Write-Host "Fetching Speech resource key"
$SpeechKey = az cognitiveservices account keys list --name $SpeechResourceName --resource-group $ResourceGroup --query key1 -o tsv

Write-Host "Creating storage account: $StorageAccountName"
az storage account create --name $StorageAccountName --resource-group $ResourceGroup --location $Location --sku Standard_LRS --kind StorageV2 | Out-Null

$StorageKey = az storage account keys list --account-name $StorageAccountName --resource-group $ResourceGroup --query "[0].value" -o tsv

Write-Host "Enabling static website hosting"
az storage blob service-properties update --account-name $StorageAccountName --account-key $StorageKey --static-website --index-document index.html --404-document index.html | Out-Null

Write-Host "Writing speech config for the static site"
@"
window.__SPEECH_CONFIG__ = {
  key: '$SpeechKey',
  region: '$Location'
};
"@ | Set-Content -Path ./public/config.js -Encoding UTF8

Write-Host "Uploading static app files"
az storage blob upload-batch --account-name $StorageAccountName --account-key $StorageKey --destination '$web' --source ./public | Out-Null

$webUrl = az storage account show --name $StorageAccountName --resource-group $ResourceGroup --query "primaryEndpoints.web" -o tsv
$webUrl = $webUrl.TrimEnd('/')

Write-Host "Deployment completed"
Write-Host "Static website URL: $webUrl"
