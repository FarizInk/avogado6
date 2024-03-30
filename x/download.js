import axios from 'axios'
import * as fs from 'fs';
import { mkdir } from "node:fs/promises";
import * as stream from 'stream';
import { promisify } from 'util';

(async () => {
    const path = 'x/files'
    await mkdir(path, { recursive: true });
    const finishedDownload = promisify(stream.finished);

    const file = Bun.file('./x/data.json');
    const contents = await file.json();

    const saveMedia = async (content) => {
        if (content.url) {
            const spltUrl = content.url.split('/')
            const title = spltUrl[3] ?? 'unknown-title'
            let repeat = ''
            if (contents.filter((c) => c.url.includes(spltUrl[3])).length) {
                repeatData = {
                    ...repeatData,
                    [title]: repeatData[title] ? repeatData[title] + 1 : 1,
                }
                repeat = `(${repeatData[title]})`
            }

            let filePath = null;
            if (content.type !== 'image' && content.img) {
                let extension = null
                const split = content.img.split('?')
                const params = new URLSearchParams(split[1]);
                if (params.get('format')) {
                    extension = params.get('format')
                } else {
                    const splitByDot = content.img.split('.')
                    extension = splitByDot[splitByDot.length - 1] ?? null
                }
                const fileName = `${title}${repeat}.${extension}`
                filePath = path + '/' + fileName

                const file = Bun.file('./' + filePath);
                if (!await file.exists()) {
                    let imgUrl = content.img
                    if (params.get('name')) {
                        imgUrl = imgUrl.replace(`name=${params.get('name')}`, 'name=4096x4096')
                    }
                    const writer = fs.createWriteStream(filePath)
                    const response = await axios.get(imgUrl, {
                        responseType: "stream",
                    });

                    response.data.pipe(writer)
                    await finishedDownload(writer);
                    console.log(fileName)
                }
            } else if (content.type !== 'gif') {
                console.log('skip video...')
            } else if (content.type !== 'gif') {
                console.log('skip video...')
            }

            return filePath
        }
    }

    let repeatData = {};
    for (let index = 0; index < contents.length; index++) {
        const content = contents[index]
        const filePath = await saveMedia(content)

        let group = [];
        content.group.forEach(async (c) => {
            group.push({
                ...c,
                downloaded: await saveMedia(c)
            })
        })

        contents[index] = {
            ...content,
            downloaded: filePath,
            group
        }
    }

    Bun.write('./x/data.json', JSON.stringify(contents));
    console.log(`Failed: ${contents.filter((f) => f.downloaded === false).length}`)
})()