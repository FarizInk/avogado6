import axios from 'axios';
import { delay, pocketbase } from '../utility.js'
import fs from 'node:fs';

export const web = async () => {
    if (process.env.POCKETBASE_URL) {
        const pb = await pocketbase()
        console.info('')
        console.info('')
        console.info('--- Inserting to database ---')
        await delay(2)
        for (let i = 0; i < data.length; i++) {
            const item = data[i]
            if (item.identifier) {
                let data = {
                    "identifier": item.identifier,
                    "type": "web",
                    "data": item,
                    "date": item.date ? new Date(item.date).toISOString() : null,
                }
                try {
                    await pb.collection('avogado').create(data);
                    console.info(`${i + 1}. ${item.identifier}`)
                } catch (err) {
                    if (err?.response?.data?.identifier?.code !== 'validation_not_unique') {
                        console.error(err)
                    }
                }
            }
        }
    }
}

export const twitter = async () => {
    if (process.env.POCKETBASE_URL) {
        const pb = await pocketbase()
        console.info('')
        console.info('')
        console.info('--- Inserting to database ---')
        await delay(2)
        for (let i = 0; i < data.length; i++) {
            const item = data[i]
            let itemSplit = item.split('/')
            const identifier = itemSplit.length >= 3 ? itemSplit[3] : null
            const url = `https://x.com/${itemSplit[1]}/${itemSplit[2]}/${itemSplit[3]}`
            if (identifier) {
                let date = null
                let dataJSON = {
                    url,
                }
                try {
                    const { data: responseData } = await axios.get(url.replace('/x.com', '/api.vxtwitter.com'))
                    date = new Date(responseData.date)?.toISOString() ?? null
                    dataJSON = {
                        ...dataJSON,
                        ...responseData
                    }
                } catch (error) {
                }
                let data = {
                    "identifier": identifier,
                    "type": "twitter",
                    "data": dataJSON,
                    date,
                }
                try {
                    await pb.collection('avogado').create(data);
                    console.info(`${i + 1}. ${url}`)
                } catch (err) {
                    if (err?.response?.data?.identifier?.code !== 'validation_not_unique') {
                        console.error(err)
                    }
                }
            }
        }
    }
}

export const instagram = async () => {
    if (process.env.POCKETBASE_URL) {
        const pb = await pocketbase()
        console.info('')
        console.info('')
        console.info('--- Inserting to database ---')
        await delay(2)
        for (let i = 0; i < data.length; i++) {
            const item = data[i]
            let itemSplit = item.split('/')
            const identifier = itemSplit.length >= 3 ? itemSplit[3] : null
            const url = `https://instagram.com${item}`
            if (identifier) {
                let date = null
                let dataJSON = {
                    url,
                }
                try {
                    const { data: responseData } = await axios.get(`${url.toString()}?__a=1&__d=dis`, {
                        headers: {
                            'Cookie': process.env.IG_COOKIES
                        },
                        withCredentials: true
                    })
                    if (responseData?.items && responseData?.items.length) {
                        const responseItem = responseData?.items[0] ?? null
                        date = responseItem.taken_at ? new Date(responseItem.taken_at * 1000)?.toISOString() : null
                        dataJSON = {
                            ...dataJSON,
                            ...responseItem
                        }
                    }
                } catch (error) {
                    console.log(error)
                }
                let data = {
                    "identifier": identifier,
                    "type": "instagram",
                    "data": dataJSON,
                    date,
                }
                try {
                    await pb.collection('avogado').create(data);
                    console.info(`${i + 1}. ${url}`)
                } catch (err) {
                    if (err?.response?.data?.identifier?.code !== 'validation_not_unique') {
                        console.error(err)
                    }
                }
            }
        }
    }
}