import axios from 'axios'
import * as fs from 'fs';
import { mkdir } from "node:fs/promises";
import * as stream from 'stream';
import { promisify } from 'util';

(async () => {
    const path = 'web/files'
    await mkdir(path, { recursive: true });
    const finishedDownload = promisify(stream.finished);

    const file = Bun.file('./web/data.json');
    const contents = await file.json();

    let repeatData = {};
    for (let index = 0; index < contents.length; index++) {
        const content = contents[index];
        if (content.url) {
            const title = content.title?.replace(' ', '_') ?? 'unknown-title'
            let repeat = ''
            if (contents.filter((c) => c.title === content.title && c.id !== content.id).length) {
                repeatData = {
                    ...repeatData,
                    [title]: repeatData[title] ? repeatData[title] + 1 : 1,
                }
                repeat = `(${repeatData[title]})`
            }
            const splitUrl = content.url.split('.')
            const extension = splitUrl[splitUrl.length - 1]
            const date = content.date.split('-')
            const fileName = `${date[0]}-${('0' + date[1]).slice(-2)}-${title}${repeat}.${extension}`
            const filePath = path + '/' + fileName

            const file = Bun.file('./' + filePath);
            if (!await file.exists()) {
                const writer = fs.createWriteStream(filePath)
                const response = await axios.get(content.url, {
                    responseType: "stream",
                });

                response.data.pipe(writer)
                await finishedDownload(writer);
                console.log(fileName)

                contents[index] = {
                    ...content,
                    downloaded: filePath
                }
            } else {
                contents[index] = {
                    ...content,
                    downloaded: filePath
                }
            }
        }
    }

    Bun.write('./web/data.json', JSON.stringify(contents));
    console.log(`Failed: ${contents.filter((f) => f.downloaded === false).length}`)
})()