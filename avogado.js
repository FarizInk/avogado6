import { Command } from 'commander';
import scrapperWeb from './scrappers/web.js';
import scrapperIG from './scrappers/instagram.js';
import scrapperTwitter from './scrappers/twitter.js';
import { delay } from './scripts/utility.js';
import pull from './scripts/pullers.js';
import { push } from './scripts/pushers.js';
import flush from './scripts/flushers.js';
import download from './scripts/downloaders.js';
import check from './scripts/checkers.js';

const cmd = new Command();

cmd
	.name('avogado')
	.description('Node.js Artisan-like CLI')
	.version('1.0.0')
	.action(async () => {
		const types = ['web', 'twitter', 'instagram'];

		for (let i = 0; i < types.length; i++) {
			await pull(types[i]);
			await delay(1.5);
		}
		console.info();

		await scrapperWeb();
		await delay(3);
		console.info('-------------------');
		await scrapperTwitter();
		await delay(3);
		console.info('-------------------');
		await scrapperIG();

		console.info();
		for (let i = 0; i < types.length; i++) {
			await delay(3);
			await push(types[i]);
		}

		console.info();
		for (let i = 0; i < types.length; i++) {
			await delay(3);
			await download(types[i]);
		}
	});

cmd
	.command('scrap')
	.description('Script to call scrapper')
	.option('-t, --type <type>', 'if null it scrap all type, type: web, twitter & instagram', null)
	.option(
		'-m, --mode <mode>',
		'default is "new", only have 2 mode scrap: all or new, available in instagram and twitter type',
		null
	)
	.action(async (options) => {
		const scrapNew = options.mode !== null ? options.mode === 'new' : true;
		if (options.type === 'web') {
			await scrapperWeb();
		} else if (options.type === 'twitter') {
			await scrapperTwitter(scrapNew);
		} else if (options.type === 'instagram') {
			await scrapperIG(scrapNew);
		} else {
			await scrapperWeb();
			await delay(3);
			console.info('-------------------');
			await scrapperTwitter(scrapNew);
			await delay(3);
			console.info('-------------------');
			await scrapperIG(scrapNew);
		}
	});

cmd
	.command('pull')
	.description('Script to pull data from pocketbase')
	.option('-t, --type <type>', 'if null it scrap all type, type: web, twitter & instagram', null)
	.action(async (options) => {
		if (options.type === null) {
			await pull('web');
			await delay(1.5);
			console.info();
			await pull('twitter');
			await delay(1.5);
			console.info();
			await pull('instagram');
		} else {
			await pull(options.type);
		}
	});

cmd
	.command('push')
	.description('Script to push data to pocketbase')
	.option(
		'-t, --type <type>',
		'if null it will push all type, type: web, twitter & instagram',
		null
	)
	.action(async (options) => {
		if (options.type === null) {
			await push('web');
			await delay(1.5);
			console.info();
			await push('twitter');
			await delay(1.5);
			console.info();
			await push('instagram');
		} else {
			await push(options.type);
		}
	});

cmd
	.command('flush')
	.description('Script to flush data in Pocketbase')
	.option('-t, --type <type>', 'type: web, twitter & instagram', null)
	.action(async (options) => await flush(options.type));

cmd
	.command('download')
	.description('Script to download data in Pocketbase')
	.option('-t, --type <type>', 'type: web, twitter & instagram', null)
	.action(async (options) => {
		if (options.type === null) {
			await download('web');
			await delay(1.5);
			console.info();
			await download('twitter');
			await delay(1.5);
			console.info();
			await download('instagram');
		} else {
			await download(options.type);
		}
	});

cmd
	.command('check')
	.description('Script to check scrapper data from Pocketbase')
	.action(async () => await check());

cmd.parse(process.argv);
