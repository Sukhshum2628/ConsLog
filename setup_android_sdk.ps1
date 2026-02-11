$ErrorActionPreference = "Stop"

$sdkPath = "C:\Android"
$cmdlineToolsPath = "$sdkPath\cmdline-tools"
$zipPath = "$cmdlineToolsPath\commandlinetools-win.zip"
$latestPath = "$cmdlineToolsPath\latest"

Write-Host "Checking for zip file..."
if (-not (Test-Path $zipPath)) {
    Write-Error "Zip file not found at $zipPath"
}

Write-Host "Extracting zip file..."
Expand-Archive -Path $zipPath -DestinationPath $cmdlineToolsPath -Force

Write-Host " restructuring folder hierarchy..."
# The zip extracts a 'cmdline-tools' folder. We need to rename it to 'latest'.
# Wait, typically acceptable structure is cmdline-tools/latest/bin
# If zip extracts to cmdline-tools/cmdline-tools/bin, we move inner cmdline-tools to latest.

$extractedFolder = "$cmdlineToolsPath\cmdline-tools"
if (Test-Path $extractedFolder) {
    if (Test-Path $latestPath) {
        Remove-Item $latestPath -Recurse -Force
    }
    Move-Item $extractedFolder $latestPath
} else {
    Write-Error "Expected extracted folder 'cmdline-tools' not found."
}

Write-Host "Setting environment variables for this session..."
$env:ANDROID_HOME = $sdkPath
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
$env:PATH = "$env:PATH;$env:JAVA_HOME\bin;$latestPath\bin"

Write-Host "Installing SDK components..."
# Accept licenses
# Accept licenses
# Accept licenses
& { for($i=0;$i -lt 10;$i++) { echo y } } | & "$latestPath\bin\sdkmanager.bat" --licenses

# Install platform-tools and platforms
& "$latestPath\bin\sdkmanager.bat" "platform-tools" "platforms;android-34" "build-tools;34.0.0"

Write-Host "Android SDK Setup Complete."
