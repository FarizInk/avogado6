import puppeteer from 'puppeteer'
import 'dotenv/config'
import { authenticator } from 'otplib';

(async () => {
    if (!process.env.TWITTER_USERNAME && !process.env.TWITTER_PASSWORD) {
        console.log('fill TWITTER_USERNAME & TWITTER_PASSWORD, skip')
        return null;
    }

    const headless = 'new';
    const browser = await puppeteer.launch({
        headless,
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

    const fileCookie = Bun.file('./x/cookies.json');
    let cookies = await fileCookie.exists() ? await fileCookie.json() : null;

    if (cookies) {
        console.log('use cookies...')
        await page.setCookie(...cookies);
    } else {
        if (headless) {
            await page.goto(`https://x.com/i/flow/login`, { waitUntil: ['load', 'networkidle0'] });
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
        } else {
            await page.goto(`https://x.com/login`, { waitUntil: ['load', 'networkidle0'] });
            await page.type('input', process.env.TWITTER_USERNAME);
            await page.keyboard.press('Enter');
            await page.waitForFunction('document.querySelector("input[name=password]") !== null');
            await page.type('input[name=password]', process.env.TWITTER_PASSWORD);
            await page.keyboard.press('Enter');
        }
        await page.waitForNetworkIdle()
    }

    await page.goto(`https://x.com/avogado6/media`, { waitUntil: ['load', 'networkidle0'] });

    if (!cookies) {
        cookies = await page.cookies();
        await Bun.write('./x/cookies.json', JSON.stringify(cookies, null, 2));
    }


    await page.evaluate(() => window.scrollBy(0, 570))

    let countWhileLoop = 1;
    let countScrollStuck = 0;
    let scrollHeight = 0;
    const file = Bun.file('./x/data.json');
    let data = await file.exists() ? await file.json() : [];
    while (countScrollStuck <= 3) {
        await Bun.sleep(1500);
        const payload = await page.evaluate(async (data, scrollHeight, countScrollStuck) => {
            const clickEvent = new MouseEvent("click", {
                "view": window,
                "bubbles": true,
                "cancelable": false
            });

            document.querySelector('div[aria-label^="Timeline"] > div').querySelectorAll('span').forEach((e) => {
                if (e.textContent === 'Show') {
                    e.dispatchEvent(clickEvent);
                }
            })

            const getMediaType = (elem) => {
                if (elem.children.length >= 2) {
                    if (elem.querySelector('svg') !== null) {
                        return 'group'
                    } else if (elem.children[1]?.textContent === 'GIF') {
                        return 'gif'
                    } else {
                        return 'video'
                    }
                }

                return 'image'
            }

            const elems = document.querySelector('div[aria-label^="Timeline"] > div')
                .querySelectorAll('a')
            for (let i = 0; i < elems.length; i++) {
                const elem = elems[i];
                const url = elem.getAttribute('href')
                if (!data.find((item) => item.url === url)) {
                    const mediaUrl = elem.querySelector('img')?.getAttribute('src') ?? null
                    const typeMedia = getMediaType(elem)
                    let groupUrls = []
                    if (typeMedia === 'group') {
                        elem.click()
                        await new Promise((resolve) => setTimeout(async () => {
                            let swipeRight = true
                            let countLoop = 1
                            while (swipeRight) {
                                await new Promise((resolve) => setTimeout(resolve, 500))
                                const elemList = document.querySelector(`ul > li:nth-child(${countLoop})`)
                                const subMediaUrl = elemList?.querySelector('img')?.getAttribute('src') ?? null
                                groupUrls.push({
                                    url: window.location.href.replace(window.location.protocol + "//" + window.location.host, ''),
                                    mediaUrl: subMediaUrl,
                                    type: subMediaUrl ? 'image' : (elemList.querySelector('div[data-testid="previewInterstitial"]')?.textContent === 'GIF' ? 'gif' : 'video'),
                                    download: null,
                                })
                                countLoop++

                                const arrowRight = document.querySelector('div[data-testId="Carousel-NavRight"]')
                                if (arrowRight) {
                                    arrowRight.click()
                                } else {
                                    swipeRight = false
                                    history.back();
                                }

                                await new Promise((resolve) => setTimeout(resolve, 500))
                            }

                            resolve()
                        }, 1500))
                    }

                    data.push({
                        url,
                        mediaUrl,
                        type: typeMedia,
                        download: null,
                        group: groupUrls.length === 0 ? [] : groupUrls,
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

        scrollHeight = payload.scrollHeight
        countScrollStuck = payload.countScrollStuck
        let filterData = []
        payload.data.forEach((d) => {
            if (!data.find((x) => x.url === d.url)) {
                filterData.push(d)
            }
        })
        data = data.concat(filterData)
        await page.evaluate(() => window.scrollBy(0, 1000))
        console.log(`${countWhileLoop}. Found: ${filterData.length}`);
        countWhileLoop++
    }

    Bun.write('./x/data.json', JSON.stringify(data));

    await browser.close();
})().catch((e) => {
    console.log(e);
    process.exitCode = 1;
});
