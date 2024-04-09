import axios from 'axios'
import * as fs from 'fs';
import { mkdir } from "node:fs/promises";
import * as stream from 'stream';
import { promisify } from 'util';
import { unlinkSync } from "node:fs";
import 'dotenv/config'

(async () => {
    const cobaltDownload = async (fileName, filePath, pathUrl) => {
        const url = `https://x.com${pathUrl}`
        const r = await fetch(`${process.env.COBALT_API_URL}/api/json`, {
            method: 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url
            })
        })

        const data = await r.json()
        if (data.status !== 'error') {
            const writer = fs.createWriteStream(filePath)
            const response = await axios.get(data.url, {
                responseType: "stream",
            });

            response.data.pipe(writer)
            await finishedDownload(writer);
            return fileName
        } else {
            return `COBALT: ${data.text} ${url}`
        }
    }

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

            let fileName = null
            let filePath = null
            if (content.type === 'image' && content.mediaUrl) {
                let extension = null
                const split = content.mediaUrl.split('?')
                const params = new URLSearchParams(split[1]);
                if (params.get('format')) {
                    extension = params.get('format')
                } else {
                    const splitByDot = content.mediaUrl.split('.')
                    extension = splitByDot[splitByDot.length - 1] ?? null
                }
                fileName = `${title}${repeat}.${extension}`
                filePath = path + '/' + fileName

                const file = Bun.file('./' + filePath);
                if (!await file.exists()) {
                    let imgUrl = content.mediaUrl
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
            } else if (content.type === 'gif') {
                const spltUrl = content.url.split('/')
                fileName = `${title}${repeat}.mp4`
                filePath = path + '/' + fileName
                const gifName = `${fileName.replace('.mp4', '')}.gif`

                const file = Bun.file(`./${path}/${gifName}`);
                if (!await file.exists()) {
                    const res = await cobaltDownload(fileName, filePath, `/${spltUrl[1]}/${spltUrl[2]}/${spltUrl[3]}`)
                    if (res.includes('COBALT')) {
                        console.log(res)
                    } else {
                        const command = `ffmpeg -i ${path}/${fileName} -qscale 0 ${path}/${gifName}`
                        Bun.spawnSync(command.split(' '));
                        console.log(gifName)
                        unlinkSync(`${path}/${fileName}`);
                    }

                    await Bun.sleep(3000);
                }
            } else if (content.type === 'video' && content.url?.includes('video')) {
                fileName = `${title}${repeat}.mp4`
                filePath = path + '/' + fileName
                const file = Bun.file('./' + filePath);
                if (!await file.exists()) {
                    const res = await cobaltDownload(fileName, filePath, content.url)
                    console.log(res)
                    await Bun.sleep(3000);
                }
            }

            return filePath
        }
    }

    // MAIN
    const path = 'x/files'
    await mkdir(path, { recursive: true });
    const finishedDownload = promisify(stream.finished);

    const file = Bun.file('./x/data.json');
    const contents = await file.json();

    let repeatData = {};
    for (let index = 0; index < contents.length; index++) {
        const content = contents[index]
        const filePath = await saveMedia(content)

        let group = [];
        for (let i = 0; i < content.group.length; i++) {
            const c = content.group[i]
            group.push({
                ...c,
                download: await saveMedia(c)
            })
        }

        contents[index] = {
            ...content,
            download: filePath,
            group
        }
    }

    Bun.write('./x/data.json', JSON.stringify(contents));
    console.log(`Failed: ${contents.filter((f) => f.download === false).length}`)
})()