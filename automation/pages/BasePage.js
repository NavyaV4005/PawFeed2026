const { until } = require('selenium-webdriver');

class BasePage {
    constructor(driver) {
        this.driver = driver;
    }

    async open(url) {
        await this.driver.get(url);
    }

    async find(locator, timeout = 10000) {
        return await this.driver.wait(until.elementLocated(locator), timeout);
    }

    async click(locator, timeout = 10000) {
        const element = await this.find(locator, timeout);
        await this.driver.wait(until.elementIsVisible(element), timeout);
        await element.click();
    }

    async type(locator, text, timeout = 10000) {
        const element = await this.find(locator, timeout);
        await this.driver.wait(until.elementIsVisible(element), timeout);
        await element.clear();
        await element.sendKeys(text);
    }

    async getText(locator, timeout = 10000) {
        const element = await this.find(locator, timeout);
        await this.driver.wait(until.elementIsVisible(element), timeout);
        return await element.getText();
    }

    async isDisplayed(locator, timeout = 10000) {
        try {
            const element = await this.find(locator, timeout);
            return await element.isDisplayed();
        } catch (err) {
            return false;
        }
    }
}

module.exports = BasePage;
