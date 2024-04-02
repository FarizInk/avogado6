import puppeteer from 'puppeteer'
import 'dotenv/config'
import { authenticator } from 'otplib';

(async () => {
    if (!process.env.TWITTER_USERNAME && !process.env.TWITTER_PASSWORD) {
        console.log('fill TWITTER_USERNAME & TWITTER_PASSWORD, skip')
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
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36')
    page.setDefaultNavigationTimeout(60 * 1000);

    await page.goto(`https://twitter.com/i/flow/login`, { waitUntil: ['load', 'networkidle0'] });

    console.log(`Logging in to ${process.env.TWITTER_USERNAME}`);
    await page.waitForSelector('input[autocomplete=username]');
    await page.type('input[autocomplete=username]', process.env.TWITTER_USERNAME);
    await page.click('#layers [aria-modal=true][role=dialog]  [role=group] > :nth-child(2) > :nth-child(1) > :nth-child(1) > :nth-child(1) > [role=button]:nth-child(6)');
    await page.waitForSelector('input[name=text], input[name=password]');
    let mail_address_input = await page.$('input[name=text]');
    if (mail_address_input != null) {
        console.log('twitter is suspecting me!');
        await page.type('input[name=text]', process.env.TWITTER_EMAIL);
        await page.click('#layers [aria-modal=true][role=dialog] > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(2) > :nth-child(2) [role=button]')
    }
    await page.waitForSelector('input[name=password]');
    await page.type('input[name=password]', process.env.TWITTER_PASSWORD);
    await page.click('#layers [aria-modal=true][role=dialog] > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(2) > :nth-child(2) [role=button]')
    if (process.env.TOTP_SECRET) {
        console.log('2FA challenge');
        const totpToken = authenticator.generate(process.env.TWITTER_TOTP_SECRET);
        await page.waitForSelector('input[name=text]');
        await page.type('input[name=text]', totpToken);
        await page.click('[data-testid=ocfEnterTextNextButton]');
    }
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

    const file = Bun.file('./x/data.json');
    const contents = await file.exists() ? await file.json() : [];

    payload.forEach((item) => {
        const content = contents.find((c) => c.url.includes(item.url));
        if (!content) {
            contents.push(item)
        }
    })


    Bun.write('./x/data.json', JSON.stringify(contents));

    await browser.close();
})().catch((e) => {
    console.log(e);
    process.exitCode = 1;
});
