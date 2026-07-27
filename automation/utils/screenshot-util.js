const fs = require('fs');
const path = require('path');

async function takeScreenshot(driver, testName) {
    try {
        const screenshotDir = path.join(__dirname, '..', 'reports', 'Screenshots');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeTestName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeTestName}_${timestamp}.png`;
        const filepath = path.join(screenshotDir, filename);

        const image = await driver.takeScreenshot();
        fs.writeFileSync(filepath, image, 'base64');
        console.log(`Screenshot saved: ${filepath}`);
        return filepath;
    } catch (err) {
        console.error('Failed to take screenshot:', err);
        return null;
    }
}

module.exports = { takeScreenshot };
