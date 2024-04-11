import axios from 'axios'
import * as fs from 'fs';
import { mkdir } from "node:fs/promises";
import * as stream from 'stream';
import { promisify } from 'util';
import { unlinkSync } from "node:fs";
import 'dotenv/config'

(async () => {
    const downloadFile = async (fileName, url) => {
        const extensions = ['.jpg', '.mp4', '.webp']
        let extension = null
        extensions.forEach((e) => {
            if (extension === null && url.includes(e)) {
                extension = e
            }
        })

        if (extension !== null) {
            const filePath = `ig/files/${fileName}${extension}`
            const writer = fs.createWriteStream(filePath)
            const response = await axios.get(url, {
                responseType: "stream",
            });

            response.data.pipe(writer)
            await finishedDownload(writer);

            return filePath
        } else {
            console.log('extension not found: ' + data.url)
        }
    }

    // MAIN
    const path = 'ig/files'
    await mkdir(path, { recursive: true });
    const finishedDownload = promisify(stream.finished);

    const file = Bun.file('./ig/data.json');
    let contents = await file.json();

    for (let index = 0; index < contents.length; index++) {
        const content = contents[index]
        if (content.url && content.download === null) {
            const url = `https://instagram.com${content.url}`
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

            const urlSplit = content.url.split('/').filter(entry => entry.trim() != '')
            let fileName = urlSplit[urlSplit.length - 1]
            if (data.status === 'redirect') {
                const filePath = await downloadFile(fileName, data.url)
                contents[index] = {
                    ...content,
                    cobalt: data,
                    download: filePath
                }
                console.log(filePath)
            } else if (data.status === "picker") {
                const pickers = data.picker
                let filePaths = []
                for (let j = 0; j < pickers.length; j++) {
                    const picker = pickers[j];
                    filePaths.push(await downloadFile(`${fileName}_${j + 1}`, picker.url))
                }
                contents[index] = {
                    ...content,
                    cobalt: data,
                    download: filePaths
                }
                console.log(filePaths)
            } else {
                console.log(data)
            }
            await Bun.sleep(3000);
        }
        Bun.write('./ig/data.json', JSON.stringify(contents));
    }

    console.log(`Failed: ${contents.filter((f) => f.download === false).length}`)
})()