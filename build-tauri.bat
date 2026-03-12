@echo off
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat" x64
set ANDROID_HOME=C:\Users\chint\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\chint\AppData\Local\Android\Sdk
set ANDROID_NDK_HOME=C:\Users\chint\AppData\Local\Android\Sdk\ndk\28.2.13676358
cd /d C:\Users\chint\StudioProjects\letsstream2
npx tauri build --target aarch64-linux-android
