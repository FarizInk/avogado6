import PocketBase from 'pocketbase';
import 'dotenv/config'
import cliProgress from 'cli-progress';

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