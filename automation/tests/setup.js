const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const env = require('../config/env');
const excelReporter = require('../utils/excel-reporter');

let driver;

before(async function() {
    const options = new chrome.Options();
    if (env.HEADLESS) {
        options.addArguments('--headless');
    }
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');

    driver = await new webdriver.Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    
    global.driver = driver;
});

afterEach(async function() {
    const result = {
        id: this.currentTest.title.split(']')[0].replace('[', ''),
        module: this.currentTest.parent.title,
        name: this.currentTest.title,
        status: this.currentTest.state,
        duration: this.currentTest.duration,
        priority: 'High', // Can be parameterized later
        error: this.currentTest.err ? this.currentTest.err.message : ''
    };
    
    excelReporter.addResult(result);
});

after(async function() {
    await excelReporter.generateReport();
    if (driver) {
        await driver.quit();
    }
});
