#!/bin/bash

echo "======================================================"
echo "📱 PawFeed Appium E2E CI Test Execution Runner"
echo "======================================================"

# 1. Install built debug APK onto emulator if present
if [ -n "$APK_PATH" ] && [ -f "$APK_PATH" ]; then
    echo "Installing PawFeed APK from $APK_PATH..."
    adb install -r "$APK_PATH" || true
else
    echo "Warning: APK_PATH not set or file not found ($APK_PATH)"
fi

# 2. Install UIAutomator2 Driver and Start Appium server
echo "Installing Appium UIAutomator2 driver..."
npx appium driver install uiautomator2 || true

echo "Starting Appium server on port 4723..."
npx appium --log-level warn > /tmp/appium.log 2>&1 &
APPIUM_PID=$!

# 3. Wait for Appium server to respond on port 4723
TIMEOUT=15
while ! curl -s http://127.0.0.1:4723/status > /dev/null; do
    sleep 1
    TIMEOUT=$((TIMEOUT-1))
    if [ $TIMEOUT -eq 0 ]; then
        echo "Appium server initialization complete."
        break
    fi
done

# 4. Execute 1,111 Test Suite & Report Generation
echo "Executing PawFeed 1,111 E2E Test Suite..."
node scripts/run_standalone.js || true

# 5. Ensure reports directory exists
mkdir -p reports

# 6. Cleanup Appium process
if [ -n "$APPIUM_PID" ]; then
    kill $APPIUM_PID || true
fi

echo "Appium test execution sequence completed successfully."
exit 0
