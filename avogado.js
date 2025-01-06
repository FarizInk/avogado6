import { Command } from "commander";
import scrapperWeb from "./scrappers/web.js";
import scrapperIG from "./scrappers/instagram.js";
import scrapperTwitter from "./scrappers/twitter.js";
import { delay } from "./utility.js";

const cmd = new Command();

cmd
    .name('avogado')
    .description('Node.js Artisan-like CLI')
    .version('1.0.0');

cmd
    .command('scrap')
    .description('Script to call scrapper')
    .option('-t, --type <type>', 'if null it scrap all type, type: web, twitter & ig', null)
    .action(async (options) => {
        if (options.type === 'web') {
            await scrapperWeb()
        } else if (options.type === 'twitter') {
            await scrapperTwitter()
        } else if (options.type === 'ig') {
            await scrapperIG()
        } else {
            await scrapperWeb()
            await delay(10)
            await scrapperTwitter()
            await delay(10)
            await scrapperIG()
        }
    })


cmd.parse(process.argv);