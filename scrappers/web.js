import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';
import 'dotenv/config'

export const scrapperWeb = async () => {
    // const diaryYears = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', null]; // null for latest year
    let diaryYears = [];
    const currentYear = (new Date()).getFullYear()
    let year = 2017
    while (year <= currentYear) {
        if (year === currentYear) {
            diaryYears.push(null)
        } else {
            diaryYears.push(year)
        }
        year++
    }


    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless: 'shell',
        defaultViewport: null,
    });
    const page = await browser.newPage();

    let data = [];

    for (let i = diaryYears.length - 1; i >= 0; i--) {
        const year = diaryYears[i];
        console.info(`Scrapping ${year ?? 'current year'}`)
        await page.goto(`https://www.avogado6.com/${year ? 'diary' + year : ''}`);

        const payload = await page.evaluate((year) => {
            let months = []
            document.querySelectorAll('div[data-testid="richTextElement"]').forEach((elem) => months.push(elem.textContent?.replace('.', '-')?.replace('～', '')?.replace('​', '')))

            let data = [];
            let itterationSection = 0
            document.querySelectorAll('div.wixui-gallery').forEach((section) => {
                const galeries = section.querySelectorAll('gallery-image-sizer')
                if (galeries.length) {
                    itterationSection++
                }

                const date = months[itterationSection - 1] ?? null
                galeries.forEach((elem) => {
                    const baseUrlMedia = 'https://static.wixstatic.com/media'
                    const uri = JSON.parse(elem.querySelector('wow-image').getAttribute('data-image-info'))?.imageData.uri ?? null
                    const title = elem.textContent
                    let identifier = `${title}_${date}`
                    const sameIdentifier = data.filter(item => item.identifier.includes(identifier));
                    data.push({
                        title,
                        url: uri ? baseUrlMedia + '/' + uri : null,
                        date,
                        identifier: sameIdentifier.length >= 1 ? `${identifier}(${sameIdentifier.length})` : identifier
                    })
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
        Object.keys(report).forEach(key => console.info(`- ${key}: ${report[key]}`))
        console.info(`TOTAL: ${payload.length} data\n`)
    }

    await browser.close();
    console.info('Total Data: ' + data.length)
}

export default scrapperWeb