import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';
import { delay } from '../utility.js'
import fs from 'node:fs';
import 'dotenv/config'

const cookiesPath = 'temp/cookie_instagram.json'
const fileCookie = fs.existsSync(cookiesPath) ? fs.readFileSync(cookiesPath) : null
let cookies = fileCookie ? JSON.parse(fileCookie) : null

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({
    headless: 'shell',
    defaultViewport: null,
    args: [
        '--no-sandbox',
        '--window-size=500,1080' // comment this even not in headless
    ],
});

if (cookies) {
    await browser.setCookie(...cookies);
}

const page = await browser.newPage();
const url = 'https://www.instagram.com'
await page.goto(url);

await delay(3)

const isLogined = await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((elem) => elem.textContent === 'Log in') === undefined)
if (!isLogined) {
    await page.type('input[name=username]', process.env.IG_USERNAME);
    await page.waitForSelector('input[name=password]');
    await page.type('input[name=password]', process.env.IG_PASSWORD);
    await page.keyboard.press('Enter');
    await delay(10)
    await page.goto(url)
}

cookies = await browser.cookies();
fs.writeFileSync(cookiesPath, JSON.stringify(cookies));

await browser.close();


const needs = ['mid', 'ig_did', 'csrftoken', 'ds_user_id', 'sessionid']
let result = ""
needs.forEach((key, i) => {
    const value = cookies.find((item) => item.name === key)?.value ?? null
    result = result + `${key}=${value}` + (i + 1 === needs.length ? '' : '; ')
})

// "mid=; ig_did=; csrftoken=; ds_user_id=; sessionid="


console.log(result)