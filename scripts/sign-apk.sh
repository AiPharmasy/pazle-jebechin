#!/bin/bash
# Sign the release APK with the test keystore
set -e

JAVA_HOME=/home/z/jdk
ANDROID_HOME=/home/z/android-sdk
APKSIGNER="$ANDROID_HOME/build-tools/34.0.0/apksigner"
ZIPALIGN="$ANDROID_HOME/build-tools/34.0.0/zipalign"

KEYSTORE=/home/z/my-project/download/test-keystore.jks
ALIAS=pazle-jebechin
PASS=123456

INPUT=/home/z/my-project/android/app/build/outputs/apk/release/app-release-unsigned.apk
ALIGNED=/tmp/app-release-aligned.apk
OUTPUT=/home/z/my-project/download/pazle-jebechin-v1.0-release.apk

echo "Aligning APK..."
"$ZIPALIGN" -f -v 4 "$INPUT" "$ALIGNED" > /dev/null

echo "Signing APK..."
"$APKSIGNER" sign --ks "$KEYSTORE" --ks-key-alias "$ALIAS" --ks-pass "pass:$PASS" --key-pass "pass:$PASS" --out "$OUTPUT" "$ALIGNED"

echo "Verifying..."
"$APKSIGNER" verify --print-certs "$OUTPUT" 2>&1 | head -5

echo "---"
ls -lh "$OUTPUT"
echo "Done."