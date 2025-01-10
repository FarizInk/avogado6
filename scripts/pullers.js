import fs from 'node:fs';
import { pocketbase } from './utility.js';

export const pull = async (type) => {
    let path = `temp/data_${type}.json`
    const pb = await pocketbase()
    let data = []
    let totalPages = 1;
    for (let i = 1; i <= totalPages; i++) {
        const payload = await pb.collection('avogado').getList(i, 200, { filter: `type = '${type}'` });
        if (i === 1) {
            console.info(`pulling ${payload.totalItems} items from type ${type}`)
        }
        console.info(`Pulling page ${i}: ${payload.items.length} items`)
        totalPages = payload.totalPages
        payload.items?.forEach((item) => {
            if (type === 'web') {
                data.push({
                    ...item.data ?? {},
                    id: item.id,
                })
            } else if (type === 'twitter' || type === 'instagram') {
                const url = item.data?.url ?? null
                if (url) {
                    data.push({
                        url,
                        id: item.id,
                    })
                }
            }
        })
    }

    fs.writeFileSync(path, JSON.stringify(data))
}

export default pull