import puppeteer from 'puppeteer'

const diaryYears = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', null]; // null for latest year

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            // '--window-size=1920,1080'
        ],
        // defaultViewport: {
        //     width: 1920,
        //     height: 1080
        // }
    });

    let pages = await browser.pages();
    await pages[0].close();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60 * 1000);

    let data = [];

    for (let i = diaryYears.length - 1; i >= 0; i--) {
        const year = diaryYears[i];
        console.log(`Scrapping ${year ?? 'current year'}`)
        await page.goto(`https://www.avogado6.com/${year ? 'diary' + year : ''}`, { waitUntil: ['load', 'networkidle0'] });

        const payload = await page.evaluate((year) => {
            if (!year) year = new Date().getFullYear()
            let months = []
            document.querySelectorAll('div[data-testid="richTextElement"]').forEach((elem) => {
                const text = elem.textContent
                if (text.includes(year)) months.push(text.replace('.', '-').replace('～', ''))
            })

            document.querySelectorAll('div[data-testid="matrix-gallery-items-container"]').forEach((elem, index) => elem.setAttribute("date", months[index]))

            let data = [];
            let elements = document.querySelectorAll('gallery-image-sizer');
            elements.forEach((elem) => {
                const baseUrlMedia = 'https://static.wixstatic.com/media'
                const uri = JSON.parse(elem.querySelector('wow-image').getAttribute('data-image-info'))?.imageData.uri ?? null
                data.push({
                    title: elem.querySelector('div[data-testid="gallery-item-title"]')?.getInnerHTML(),
                    url: uri ? baseUrlMedia + '/' + uri : null,
                    date: elem.closest('div[data-testid="matrix-gallery-items-container"]').getAttribute('date'),
                    downloaded: null,
                })
            })

            return data
        }, year);

        data = data.concat(payload)
        let report = {}
        payload.forEach((d) => {
            report = {
                ...report,
                [d.date]: report[d.date] ? report[d.date] + 1 : 1,
            }
        })
        Object.keys(report).forEach(key => console.log(`- ${key}: ${report[key]}`))
        console.log(`TOTAL: ${payload.length} data\n`)
    }

    Bun.write('./web/data.json', JSON.stringify(data.map((a, index) => ({
        id: index,
        ...a
    }))));

    await browser.close();
})().catch((e) => {
    console.log(e);
    process.exitCode = 1;
});
