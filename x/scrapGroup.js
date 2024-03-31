import puppeteer from 'puppeteer'
import { setTimeout } from "node:timers/promises";
import 'dotenv/config'

(async () => {
    if (!process.env.TWITTER_USERNAME && !process.env.TWITTER_PASSWORD) {
        console.log('fill TWITTER_USERNAME & TWITTER_PASSWORD, skip')
        return null;
    }

    const file = Bun.file('./x/data.json');
    const contents = await file.json();

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--window-size=500,1080'
        ],
        defaultViewport: null
    });

    let pages = await browser.pages();
    await pages[0].close();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60 * 1000);

    await page.goto(`https://x.com/login`, { waitUntil: ['load', 'networkidle0'] });
    await page.type('input', process.env.TWITTER_USERNAME);
    await page.keyboard.press('Enter');
    await page.waitForFunction('document.querySelector("input[name=password]") !== null');
    await page.type('input[name=password]', process.env.TWITTER_PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForNetworkIdle()

    for (let index = 0; index < contents.length; index++) {
        const content = contents[index]
        if (content.is_group && content.url && content.group.length === 0) {
            const spltUrl = content.url.split('/')
            const url = `/${spltUrl[1]}/${spltUrl[2]}/${spltUrl[3]}`
            const id = spltUrl[3]
            await page.goto(`https://x.com${url}`)
            await setTimeout(3000);
            const payload = await page.evaluate((url, id) => {
                let elem = null
                document.querySelectorAll('article').forEach(e => {
                    if (e.textContent.includes('avogado6') && e.nextSibling?.textContent?.includes('Post your reply')) {
                        elem = e
                    }
                })

                let data = [];
                elem?.querySelectorAll('img')?.forEach((e, i) => {
                    const parentUrl = e.closest('a')?.getAttribute('href')
                    if (parentUrl?.includes(id)) {
                        data.push({
                            is_group: false,
                            url: `${url}/photo/${i + 1}`,
                            img: e?.getAttribute('src'),
                            type: 'image',
                            downloaded: null,
                            group: []
                        });
                    }
                })

                elem?.querySelectorAll('video')?.forEach((e, i) => {
                    const parentUrl = e.closest('a')?.getAttribute('href')
                    if (parentUrl?.includes(id)) {
                        data.push({
                            is_group: false,
                            url: `${url}/video/${i + 1}`,
                            img: null,
                            type: 'video',
                            downloaded: null,
                            group: []
                        });
                    }
                })

                return data;
            }, url, id)

            console.log(payload.length, url);

            if (payload.length >= 1) {
                contents[index] = {
                    ...content,
                    group: payload,
                }
                Bun.write('./x/data.json', JSON.stringify(contents));
            }
        }
    }

    await browser.close();
})().catch((e) => {
    console.log(e);
    process.exitCode = 1;
});
