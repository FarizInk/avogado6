import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';
import { delay } from '../scripts/utility.js';
import fs from 'node:fs';
import 'dotenv/config';

export const scrapperIG = async (scrapNew = true) => {
	const cookiesPath = 'temp/cookie_instagram.json';
	const fileCookie = fs.existsSync(cookiesPath) ? fs.readFileSync(cookiesPath) : null;
	let cookies = fileCookie ? JSON.parse(fileCookie) : null;

	// Launch the browser and open a new blank page
	const browser = await puppeteer.launch({
		headless: 'shell',
		defaultViewport: null,
		args: [
			'--no-sandbox',
			'--window-size=500,1080' // comment this even not in headless
		]
	});

	if (cookies) {
		await browser.setCookie(...cookies);
	}

	const page = await browser.newPage();
	const url = 'https://www.instagram.com/avogado6_jp';
	await page.goto(url);

	await delay(3);

	const isLogined = await page.evaluate(
		() =>
			Array.from(document.querySelectorAll('button')).find(
				(elem) => elem.textContent === 'Log in'
			) === undefined
	);
	if (!isLogined) {
		await page.type('input[name=username]', process.env.IG_USERNAME);
		await page.waitForSelector('input[name=password]');
		await page.type('input[name=password]', process.env.IG_PASSWORD);
		await page.keyboard.press('Enter');
		await delay(10);
		await page.goto(url);
	}

	cookies = await browser.cookies();
	fs.writeFileSync(cookiesPath, JSON.stringify(cookies));

	await page.evaluate(() => window.scrollBy(0, 333));

	await delay(5);
	let i = 1;
	let countScrollStuck = 0;
	let countNothingNew = 0;
	let scrollHeight = 0;

	const dataPath = 'temp/data_instagram.json';
	const fileData = fs.existsSync(dataPath) ? fs.readFileSync(dataPath) : null;
	let data = fileData ? JSON.parse(fileData) : [];
	const totalCache = data.length;

	while (countScrollStuck <= 3 && countNothingNew <= 3) {
		await delay(2);
		const payload = await page.evaluate(
			async (dataCache, scrollHeight, countScrollStuck) => {
				let data = [];
				document.querySelectorAll('a[role="link"]').forEach((elem) => {
					const link = elem.getAttribute('href');
					const url = link ? `https://instagram.com${link}` : null;
					const isExist = dataCache.find((item) => item.url === url);
					if (url && (link.includes('/p/') || link.includes('/reel/')) && !isExist) {
						data.push({
							url: url,
							id: null
						});
					}
				});

				if (scrollHeight === document.body.scrollHeight) {
					countScrollStuck++;
				} else {
					scrollHeight = document.body.scrollHeight;
					countScrollStuck = 0;
				}

				return {
					data,
					countScrollStuck,
					scrollHeight
				};
			},
			data,
			scrollHeight,
			countScrollStuck
		);

		if (scrapNew && payload.data.length === 0) {
			countNothingNew++;
		} else {
			countNothingNew = 0;
		}

		scrollHeight = payload.scrollHeight;
		countScrollStuck = payload.countScrollStuck;
		await page.evaluate(() => window.scrollBy(0, 1000));
		console.info(`${i}. Found: ${payload.data.length}`);
		data = data.concat(payload.data);
		i++;
	}

	await browser.close();

	data = [...new Set(data)];

	console.info('Total Data: ' + data.length);
	console.info(`${data.length - totalCache} New`);
	fs.writeFileSync('temp/data_instagram.json', JSON.stringify(data));
};

export default scrapperIG;
