import fs from 'node:fs';
import { pocketbase } from "./utility.js"

export const flush = async (type) => {
    if (type === null) return 
    if (type === 'ig') type = 'instagram'
    const pb = await pocketbase()

    const a = await pb.collection('avogado').getList(1, 200, { filter: `type = '${type}'` });
    for (let i = a.totalPages; i >= 1; i--) {
        const payload = await pb.collection('avogado').getList(i, 200, { filter: `type = '${type}'` });
        if (i === 1) {
            console.info(`flushing ${payload.totalItems} items from type ${type}`)
        }
        for (let j = 0; j < payload.items.length; j++) {
            const item = payload.items[j];
            await pb.collection('avogado').delete(item.id)
            console.info(`Delete ${item.id}`)
        }
    }

    fs.writeFileSync(`temp/data_${type}.json`, JSON.stringify([]))
}

export default flush;