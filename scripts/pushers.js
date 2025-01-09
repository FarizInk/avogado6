import axios from 'axios';
import { delay, pocketbase } from './utility.js'
import fs from 'node:fs';

export const push = async (type) => {
    const pb = await pocketbase()
    const dataPath = `temp/data_${type}.json`
    const fileData = fs.existsSync(dataPath) ? fs.readFileSync(dataPath) : null
    let data = fileData ? JSON.parse(fileData) : []

    let countPush = 1
    for (let i = 0; i < data.length; i++) {
        const item = data[i]
        if (item.stored) continue
        delete item.stored
        const urlSplitter = item.url?.split('/') ?? []
        let payload = {
            "identifier": urlSplitter.length > 0 && !urlSplitter[urlSplitter.length - 1] ? urlSplitter[urlSplitter.length - 2] : (urlSplitter[urlSplitter.length - 1] ?? null),
            "type": type,
            "data": null,
            "date": null,
        };

        if (type === 'web') {
            if (!item.identifier) continue
            payload.identifier = item.identifier
            payload.data = item
            payload.date = item.date ? new Date(item.date).toISOString() : null
        } else if (type === 'twitter') {
            if (!item.url) continue
            let dataJSON = {
                url: item.url,
            }
            try {
                const { data: responseData } = await axios.get(item.url.replace('/x.com', '/api.vxtwitter.com'))
                dataJSON = {
                    ...dataJSON,
                    ...responseData
                }
            } catch (error) {
                console.error(error)
                continue;
            }
            payload.data = dataJSON
            payload.date = dataJSON.date ? new Date(dataJSON.date)?.toISOString() : null
        } else if (type === 'instagram') {
            if (!item.url) continue
            let dataJSON = {
                url: item.url,
            }
            try {
                const { data: responseData } = await axios.get(`${item.url.toString()}?__a=1&__d=dis`, {
                    headers: {
                        'Cookie': process.env.IG_COOKIES
                    },
                    withCredentials: true
                })
                if (responseData?.items && responseData?.items.length) {
                    const responseItem = responseData?.items[0] ?? null
                    dataJSON = {
                        ...dataJSON,
                        ...responseItem
                    }
                }
            } catch (error) {
                console.error(error)
                continue;
            }
            payload.data = dataJSON
            payload.date = dataJSON.taken_at ? new Date(dataJSON.taken_at * 1000)?.toISOString() : null
        }

        if (!payload.identifier) continue

        try {
            await pb.collection('avogado').create(payload);
            data[i].stored = true
            fs.writeFileSync(dataPath, JSON.stringify(data))
            console.info(`${countPush}. ${payload.identifier}`)
            countPush++
            if (type === 'instagram' || type === 'twitter') await delay(2)
        } catch (err) {
            if (err?.response?.data?.identifier?.code !== 'validation_not_unique') {
                console.error(err)
            }
        }
    }
}