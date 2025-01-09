import PocketBase from 'pocketbase';
import 'dotenv/config'

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