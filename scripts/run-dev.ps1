# run-dev.ps1 — Launch dev build on the Medium_Phone emulator (AVD port 5554)
# Usage: .\scripts\run-dev.ps1
# Always use this script when testing — never target a physical device or other emulator.

$ANDROID_SDK = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$EMULATOR    = "$ANDROID_SDK\emulator\emulator.exe"
$ADB         = "$ANDROID_SDK\platform-tools\adb.exe"

# Boot the emulator if it isn't already running on 5554
$running = & $ADB devices | Select-String "emulator-5554"
if (-not $running) {
    Write-Host "[run-dev] Starting Medium_Phone emulator..."
    Start-Process $EMULATOR -ArgumentList "-avd Medium_Phone" -WindowStyle Hidden
    Write-Host "[run-dev] Waiting for emulator to boot..."
    & $ADB -s emulator-5554 wait-for-device
    # Extra wait for full boot
    do {
        Start-Sleep -Seconds 3
        $booted = & $ADB -s emulator-5554 shell getprop sys.boot_completed 2>$null
    } while ($booted.Trim() -ne "1")
    Write-Host "[run-dev] Emulator ready."
}

# Reverse Metro port so the emulator can reach the dev server
& $ADB -s emulator-5554 reverse tcp:8081 tcp:8081

# Build APK directly with Gradle targeting x86_64 (emulator architecture).
# Do NOT use `expo run:android` — it detects the physical device and builds
# arm64 only, which crashes on the x86_64 emulator.
Set-Location (Split-Path $PSScriptRoot -Parent)
Push-Location android
.\gradlew assembleDebug -PreactNativeArchitectures=x86_64 --build-cache -x lint -x test
Pop-Location

# Install directly on the emulator and launch
& $ADB -s emulator-5554 install -r -d "android\app\build\outputs\apk\debug\app-debug.apk"
& $ADB -s emulator-5554 shell am start -n com.tappedin.app/.MainActivity
