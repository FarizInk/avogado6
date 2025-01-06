import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';
import { delay } from '../utility.js'
import fs from 'node:fs';
import 'dotenv/config'

export const scrapperTwitter = async () => {
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

    let countWhileLoop = 1;
    let countScrollStuck = 0;
    let scrollHeight = 0;
    let data = [];

    while (countScrollStuck <= 3) {
        await delay(1.5)
        const payload = await page.evaluate(async (data, scrollHeight, countScrollStuck) => {
            const elems = document.querySelector('div[aria-label^="Timeline"] > div')
                .querySelectorAll('a')
            for (let i = 0; i < elems.length; i++) {
                const elem = elems[i];
                const url = elem.getAttribute('href')
                data.push(url)
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

        scrollHeight = payload.scrollHeight
        countScrollStuck = payload.countScrollStuck
        let filterData = []
        payload.data.forEach((dataUrl) => {
            if (!data.find((url) => url === dataUrl)) {
                filterData.push(dataUrl)
            }
        })
        data = data.concat(filterData)
        await page.evaluate(() => window.scrollBy(0, 1000))
        console.info(`${countWhileLoop}. Found: ${filterData.length}`);
        countWhileLoop++
    }

    await browser.close();

    data = [...new Set(data)]

    console.info('Total Data: ' + data.length)
    fs.writeFileSync('temp/data_twitter.json', JSON.stringify(data))
}

export default scrapperTwitter