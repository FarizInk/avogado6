import puppeteer from 'puppeteer'
import 'dotenv/config'
import { unlinkSync } from "node:fs";

const login = async (page) => {
    await page.goto(`https://instagram.com`, { waitUntil: ['load', 'networkidle0'] });
    await page.type('input[name="username"]', process.env.IG_USERNAME);
    await page.type('input[name="password"]', process.env.IG_PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForNetworkIdle()
}

(async () => {
    if (!process.env.IG_USERNAME && !process.env.IG_PASSWORD) {
        console.log('fill IG_USERNAME & IG_PASSWORD, skip')
        return null;
    }

    const browser = await puppeteer.launch({
        // headless: false,
        // args: [
        //     '--no-sandbox',
        //     '--window-size=500,1080' // comment this even not in headless
        // ],
        // defaultViewport: null
    });

    let pages = await browser.pages();
    await pages[0].close();
    const page = await browser.newPage();

    const fileCookie = Bun.file('./ig/cookies.json');
    let cookies = await fileCookie.exists() ? await fileCookie.json() : null;

    if (cookies) {
        console.log('use cookies...')
        await page.setCookie(...cookies);
    } else {
        await login(page)
    }

    await page.goto('https://www.instagram.com/avogado6_jp/', { waitUntil: ['load', 'networkidle0'] })

    if (await page.evaluate(() => document.querySelector('body').innerText.split('\n').includes('Log in'))) {
        console.log("logouted 💩")
        unlinkSync('./ig/cookies.json');
        await login(page)
        await page.goto('https://www.instagram.com/avogado6_jp/', { waitUntil: ['load', 'networkidle0'] })
    }

    cookies = await page.cookies();
    await Bun.write('./ig/cookies.json', JSON.stringify(cookies, null, 2));

    let countWhileLoop = 1;
    let countScrollStuck = 0;
    let scrollHeight = 0;
    const file = Bun.file('./ig/data.json');
    let data = await file.exists() ? await file.json() : [];
    while (countScrollStuck <= 3) {
        await Bun.sleep(1500);
        const payload = await page.evaluate(async (scrollHeight, countScrollStuck) => {
            let urls = [];
            document.querySelector('div[role="tablist"]')
                .nextSibling
                .querySelectorAll('a')
                .forEach(a => urls.push(a.getAttribute('href')))

            if (scrollHeight === document.body.scrollHeight) {
                countScrollStuck++
            } else {
                scrollHeight = document.body.scrollHeight
                countScrollStuck = 0
            }

            const payload = {
                urls,
                countScrollStuck,
                scrollHeight
            }
            console.log(payload);
            return payload
        }, scrollHeight, countScrollStuck)

        scrollHeight = payload.scrollHeight
        countScrollStuck = payload.countScrollStuck

        let filterData = []
        payload.urls.forEach((url) => {
            if (!data.find((d) => d.url === url)) {
                filterData.push({
                    url,
                    cobalt: null,
                    download: null,
                })
            }
        })

        data = data.concat(filterData)

        await page.evaluate(() => window.scrollBy(0, 1000))
        console.log(`${countWhileLoop}. Total: ${data.length}, Found: ${payload.urls.length}, scrollSctuckCount: ${countScrollStuck}`)
        countWhileLoop++
    }

    Bun.write('./ig/data.json', JSON.stringify(data));

    await browser.close();
})().catch((e) => {
    console.log(e);
    process.exitCode = 1;
});