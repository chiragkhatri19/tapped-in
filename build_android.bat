@echo off
set JAVA_HOME=C:\PROGRA~1\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\chira\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%
cd /d C:\Users\chira\OneDrive\Desktop\project 2026\tapped-in\tapped-in
echo JAVA_HOME=%JAVA_HOME%
echo ANDROID_HOME=%ANDROID_HOME%
where java
java -version
npx expo run:android
