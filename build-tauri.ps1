$vsPath = "C:\Program Files\Microsoft Visual Studio\18\Community"
$vcVarsAll = Join-Path $vsPath "VC\Auxiliary\Build\vcvarsall.bat"

if (Test-Path $vcVarsAll) {
    Write-Host "Setting up MSVC environment..."
    & $vcVarsAll x64 | Out-Null
} else {
    Write-Host "vcvarsall.bat not found at $vcVarsAll"
    exit 1
}

$env:ANDROID_HOME = "C:\Users\chint\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\chint\AppData\Local\Android\Sdk"
$env:ANDROID_NDK_HOME = "C:\Users\chint\AppData\Local\Android\Sdk\ndk\28.2.13676358"

Set-Location "C:\Users\chint\StudioProjects\letsstream2"
npx tauri android build
powershell -ExecutionPolicy Bypass -File "C:\Users\chint\StudioProjects\letsstream2\build-tauri.ps1" 2>&1