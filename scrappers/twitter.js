import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';
import { delay } from '../scripts/utility.js'
import fs from 'node:fs';
import 'dotenv/config'

export const scrapperTwitter = async (scrapNew = true) => {
    const cookiesPath = 'temp/cookie_twitter.json'
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
    const url = 'https://x.com/avogado6/media'
    await page.goto(url);

    const isLogined = await page.evaluate(() => Array.from(document.querySelectorAll('a')).find((elem) => elem.textContent === 'Log in') === undefined)
    if (!isLogined) {
        await page.goto('https://x.com/login')
        await delay(3)

        const mail_address_input = await page.$('input[name=text]');
        if (mail_address_input != null) {
            await page.type('input[name=text]', process.env.TWITTER_USERNAME);
            await page.keyboard.press('Enter');
        }
        await page.waitForSelector('input[name=password]');
        await page.type('input[name=password]', process.env.TWITTER_PASSWORD);
        await page.keyboard.press('Enter');
        await delay(3)
        await page.goto(url)
    }

    cookies = await browser.cookies();
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies));

    await delay(3)

    await page.evaluate(() => window.scrollBy(0, 570))

    let i = 1;
    let countScrollStuck = 0;
    let countNothingNew = 0;
    let scrollHeight = 0;

    const dataPath = 'temp/data_twitter.json'
    const fileData = fs.existsSync(dataPath) ? fs.readFileSync(dataPath) : null
    let data = fileData ? JSON.parse(fileData) : []
    const totalCache = data.length

    while (countScrollStuck <= 2 && countNothingNew <= 2) {
        await delay(2)
        const payload = await page.evaluate(async (dataCache, scrollHeight, countScrollStuck) => {
            let data = [];
            const elems = document.querySelector('div[aria-label^="Timeline"] > div')
                .querySelectorAll('a')
            for (let i = 0; i < elems.length; i++) {
                const elem = elems[i];
                const basicUrl = (elem.getAttribute('href') ?? '/').split('/')
                const url = basicUrl.length >= 3 ? `https://x.com/${basicUrl[1]}/${basicUrl[2]}/${basicUrl[3]}` : null;
                const isExist = dataCache.find((item) => item.url === url)
                if (!isExist && url) {
                    data.push({
                        url: url,
                        id: null,
                    })
                }
            }

            if (scrollHeight === document.body.scrollHeight) {
                countScrollStuck++
            } else {
                scrollHeight = document.body.scrollHeight
                countScrollStuck = 0
            }

            return {
                data,
                countScrollStuck,
                scrollHeight
            }
        }, data, scrollHeight, countScrollStuck)

        if (scrapNew && payload.data.length === 0) {
            countNothingNew++
        } else {
            countNothingNew = 0
        }

        scrollHeight = payload.scrollHeight
        countScrollStuck = payload.countScrollStuck
        console.info(`${i}. Found: ${payload.data.length}`);
        data = data.concat(payload.data)
        await page.evaluate(() => window.scrollBy(0, 1000))
        i++
    }

    await browser.close();

    data = [...new Set(data)]

    console.info('Total Data: ' + data.length)
    console.info(`${data.length - totalCache} New`)
    fs.writeFileSync('temp/data_twitter.json', JSON.stringify(data))
}

export default scrapperTwitter