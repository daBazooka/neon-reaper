#!/usr/bin/env bash
# Creates your Google Play upload key and prints the base64 text for the
# ANDROID_KEYSTORE_BASE64 GitHub secret. Needs Java (keytool) installed.
# KEEP bokata-upload.jks AND ITS PASSWORD SAFE AND BACKED UP. Never commit it.
set -e
keytool -genkeypair -v -keystore bokata-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
base64 < bokata-upload.jks | tr -d '\n' > bokata-upload.jks.base64.txt
echo
echo "Done. Paste the contents of bokata-upload.jks.base64.txt into the ANDROID_KEYSTORE_BASE64 secret."
