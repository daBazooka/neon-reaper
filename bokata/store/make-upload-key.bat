@echo off
REM Creates your Google Play upload key and the base64 text for the
REM ANDROID_KEYSTORE_BASE64 GitHub secret. Needs Java (keytool) installed.
REM KEEP bokata-upload.jks AND ITS PASSWORD SAFE AND BACKED UP. Never commit it.
keytool -genkeypair -v -keystore bokata-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
certutil -encodehex -f bokata-upload.jks bokata-upload.jks.base64.txt 0x40000001
echo.
echo Done. Paste the contents of bokata-upload.jks.base64.txt into the ANDROID_KEYSTORE_BASE64 secret.
