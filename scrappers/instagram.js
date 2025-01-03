import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';
import { delay, pocketbase } from '../utility.js'
import fs from 'node:fs';
import 'dotenv/config'
import axios from 'axios';

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
const url = 'https://www.instagram.com/avogado6_jp'
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

await page.evaluate(() => window.scrollBy(0, 333))

await delay(5)
let countWhileLoop = 1;
let countScrollStuck = 0;
let scrollHeight = 0;
let data = [];

while (countScrollStuck <= 3) {
    await delay(1.5)
    const payload = await page.evaluate(async (data, scrollHeight, countScrollStuck) => {
        document.querySelectorAll('a[role="link"]').forEach((elem) => {
            const link = elem.getAttribute('href')
            if (link.includes('/p/') || link.includes('/reel/')) {
                data.push(link)
            }
        })

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

console.info('')
console.info('')
console.info('Total Data: ' + data.length)
fs.writeFileSync('temp/data_instagram.json', JSON.stringify(data))
await delay(3)

if (process.env.POCKETBASE_URL) {
    const pb = await pocketbase()
    console.info('')
    console.info('')
    console.info('--- Inserting to database ---')
    await delay(2)
    for (let i = 0; i < data.length; i++) {
        const item = data[i]
        let itemSplit = item.split('/')
        const identifier = itemSplit.length >= 3 ? itemSplit[3] : null
        const url = `https://instagram.com${item}`
        if (identifier) {
            let date = null
            let dataJSON = {
                url,
            }
            try {
                const { data: responseData } = await axios.get(`${url.toString()}?__a=1&__d=dis`, {
                    headers: {
                        'Cookie': process.env.IG_COOKIES
                    },
                    withCredentials: true
                })
                if (responseData?.items && responseData?.items.length) {
                    const responseItem = responseData?.items[0] ?? null
                    date = responseItem.taken_at ? new Date(responseItem.taken_at * 1000)?.toISOString() : null
                    dataJSON = {
                        ...dataJSON,
                        ...responseItem
                    }
                }
            } catch (error) {
                console.log(error)
            }
            let data = {
                "identifier": identifier,
                "type": "instagram",
                "data": dataJSON,
                date,
            }
            try {
                await pb.collection('avogado').create(data);
                console.info(`${i + 1}. ${url}`)
            } catch (err) {
                if (err?.response?.data?.identifier?.code !== 'validation_not_unique') {
                    console.error(err)
                }
            }
        }
    }
}