import { Command } from "commander";
import scrapperWeb from "./scrappers/web.js";
import scrapperIG from "./scrappers/instagram.js";
import scrapperTwitter from "./scrappers/twitter.js";
import { delay } from "./scripts/utility.js";
import pull from "./scripts/pullers.js";
import { push } from "./scripts/pushers.js";
import flush from "./scripts/flushers.js"

const cmd = new Command();

cmd
    .name('avogado')
    .description('Node.js Artisan-like CLI')
    .version('1.0.0');

cmd
    .command('scrap')
    .description('Script to call scrapper')
    .option('-t, --type <type>', 'if null it scrap all type, type: web, twitter & ig', null)
    .option('-m, --mode <mode>', 'default is "new", only have 2 mode scrap: all or new, available in instagram and twitter type', null)
    .action(async (options) => {
        const scrapNew = options.mode !== null ? (options.mode === 'new') : true
        if (options.type === 'web') {
            await scrapperWeb()
        } else if (options.type === 'twitter') {
            await scrapperTwitter(scrapNew)
        } else if (options.type === 'ig') {
            await scrapperIG(scrapNew)
        } else {
            await scrapperWeb()
            console.info('-------------------')
            await delay(10)
            await scrapperTwitter(scrapNew)
            console.info('-------------------')
            await delay(10)
            await scrapperIG(scrapNew)
        }
    })

cmd
    .command('pull')
    .description('Script to pull data from pocketbase')
    .option('-t, --type <type>', 'if null it scrap all type, type: web, twitter & ig', null)
    .action(async (options) => {
        if (options.type === 'web') {
            await pull(options.type)
        } else if (options.type === 'twitter') {
            await pull(options.type)
        } else if (options.type === 'ig') {
            await pull('instagram')
        } else {
            await pull('web')
            await delay(5)
            await pull('twitter')
            await delay(5)
            await pull('instagram')
        }
    })

cmd
    .command('push')
    .description('Script to push data to pocketbase')
    .option('-t, --type <type>', 'if null it will push all type, type: web, twitter & ig', null)
    .action(async (options) => {
        if (options.type === 'web') {
            await push(options.type)
        } else if (options.type === 'twitter') {
            await push(options.type)
        } else if (options.type === 'ig') {
            await push('instagram')
        } else {
            await push('web')
            await delay(5)
            await push('twitter')
            await delay(5)
            await push('instagram')
        }
    })

cmd
    .command('flush')
    .description('Script to flush data in')
    .option('-t, --type <type>', 'type: web, twitter & ig', null)
    .action(async (options) => await flush(options.type))


cmd.parse(process.argv);