import PocketBase from 'pocketbase';
import 'dotenv/config'
import cliProgress from 'cli-progress';
import axios from 'axios';

export const delay = (time) => {
    return new Promise(function (resolve) {
        setTimeout(resolve, time * 1000)
    });
}

export const pocketbase = async () => {
    const pb = new PocketBase(process.env.POCKETBASE_URL);
    await pb.collection("_superusers").authWithPassword(process.env.POCKETBASE_USERNAME, process.env.POCKETBASE_PASSWORD);

    return pb
}

export const cliLoading = (title = '') => {
    return new cliProgress.SingleBar({
        format: `${title} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`
    }, cliProgress.Presets.shades_classic)
}

export const getDataIG = async (url) => {
    try {
        const { data: responseData } = await axios.get(`${url.replace('/reel/', '/p/').replace('/reels/', '/p/').toString()}?__a=1&__d=dis`, {
            headers: {
                'Cookie': process.env.IG_COOKIES
            },
            withCredentials: true
        })
        return responseData
    } catch (error) {
        console.error(error)
        return null;
    }
}