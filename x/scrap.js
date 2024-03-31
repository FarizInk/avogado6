import puppeteer from 'puppeteer'
import 'dotenv/config'

(async () => {
    if (!process.env.TWITTER_USERNAME && !process.env.TWITTER_PASSWORD) {
        console.log('fill TWITTER_USERNAME & TWITTER_PASSWORD, skip')
        return null;
    }

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
    await page.goto(`https://x.com/avogado6/media`, { waitUntil: ['load', 'networkidle0'] });

    await page.evaluate(() => window.scrollBy(0, 570))

    const payload = await page.evaluate(async () => {
        let countSameItteration = 0
        let bodyScrollHeight = 0;
        let data = [];
        const loop = async () => {
            await new Promise(resolve => setTimeout(async () => {
                let clickEvent = new MouseEvent("click", {
                    "view": window,
                    "bubbles": true,
                    "cancelable": false
                });
                document.querySelector('div[aria-label^="Timeline"] > div').querySelectorAll('span').forEach((e) => {
                    if (e.textContent === 'Show') {
                        e.dispatchEvent(clickEvent);
                    }
                })

                const getType = (elem) => {
                    if (elem.children.length >= 2) {
                        if (elem.children[1].textContent === 'GIF') {
                            return 'gif'
                        } else {
                            return 'video'
                        }
                    }

                    return 'image';
                }

                document.querySelector('div[aria-label^="Timeline"] > div')
                    .querySelectorAll('a')
                    .forEach((elem) => {
                        const url = elem.getAttribute('href')
                        if (!data.find((item) => item.url === url)) {
                            const isGroup = elem.querySelector('svg') !== null
                            data.push({
                                is_group: isGroup,
                                url,
                                img: elem.querySelector('img')?.getAttribute('src'),
                                type: isGroup ? null : getType(elem),
                                downloaded: null,
                                group: []
                            });
                        }
                    })

                window.scrollBy(0, 1000)

                if (bodyScrollHeight === document.body.scrollHeight) {
                    countSameItteration++
                } else {
                    bodyScrollHeight = document.body.scrollHeight
                }

                if (countSameItteration <= 3) {
                    await loop()
                }

                resolve()
            }, 3000))
        }

        await loop()

        return data
    })

    Bun.write('./x/data.json', JSON.stringify(payload));

    await browser.close();
})().catch((e) => {
    console.log(e);
    process.exitCode = 1;
});
