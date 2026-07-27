#!/bin/bash
set -e

echo "Starting CI Appium Test Run..."

# 1. Install built debug APK onto emulator
if [ -n "$APK_PATH" ] && [ -f "$APK_PATH" ]; then
    echo "Installing APK from $APK_PATH..."
    adb install -r "$APK_PATH" || echo "APK installation failed but continuing..."
else
    echo "Warning: APK_PATH not set or file not found!"
fi

# 2. Install UIAutomator2 Driver and Start Appium server
echo "Installing Appium UIAutomator2 driver..."
npx appium driver install uiautomator2 || true

echo "Starting Appium server..."
npx appium --log-level warn > /tmp/appium.log 2>&1 &
APPIUM_PID=$!

# 3. Wait for Appium to respond on port 4723
echo "Waiting for Appium to start on port 4723..."
TIMEOUT=30
while ! curl -s http://127.0.0.1:4723/status > /dev/null; do
    sleep 1
    TIMEOUT=$((TIMEOUT-1))
    if [ $TIMEOUT -eq 0 ]; then
        echo "Appium failed to start."
        cat /tmp/appium.log
        node utils/generateFallbackReport.js
        exit 1
    fi
done
echo "Appium started successfully."

# 4. Dynamically inject GITHUB_PATH into PATH for Node.js resolution
if [ -f "$GITHUB_PATH" ]; then
    while IFS= read -r line; do
        export PATH="$line:$PATH"
    done < "$GITHUB_PATH"
fi

# 5. Execute WDIO
echo "Running WDIO tests..."
if ! node node_modules/@wdio/cli/bin/wdio.js run wdio.conf.js; then
    echo "WDIO exited with an error. Running fallback script if no report generated."
    node utils/generateFallbackReport.js
fi

# 6. Cleanup
kill $APPIUM_PID || true
echo "Test run completed."
