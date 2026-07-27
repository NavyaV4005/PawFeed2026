const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const env = require('../config/env');

class LoginPage extends BasePage {
    constructor(driver) {
        super(driver);
        this.emailInput = By.id('loginEmail');
        this.passwordInput = By.id('loginPassword');
        this.loginButton = By.css('#authStep1 .primary-btn');
        this.forgotPasswordLink = By.css('.forgot-password');
        this.signupLink = By.css('.auth-switch');
    }

    async navigate() {
        await this.open(env.BASE_URL);
    }

    async login(email, password) {
        await this.type(this.emailInput, email);
        await this.type(this.passwordInput, password);
        await this.click(this.loginButton);
    }
}

module.exports = LoginPage;
