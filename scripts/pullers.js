import fs from 'node:fs';
import { cliLoading, pocketbase } from './utility.js';

export const pull = async (type) => {
	let path = `temp/data_${type}.json`;
	const pb = await pocketbase();
	let data = [];
	const bar = cliLoading(`Pulling ${type}`);
	let countPull = 1;
	let totalPages = 1;
	let conf = { filter: `type = '${type}'`}
	if (type === 'web') {
		conf.expand = 'info'
	}
	for (let i = 1; i <= totalPages; i++) {
		const payload = await pb
			.collection('avogado')
			.getList(i, 200, conf);
		if (i === 1) {
			bar.start(payload.totalItems, 0);
		}
		totalPages = payload.totalPages;
		payload.items?.forEach((item) => {
			if (type === 'web') {
				data.push({
					...(item.expand?.info?.data ?? {}),
					id: item.id
				});
			} else if (type === 'twitter' || type === 'instagram') {
				const url = item.url ?? null;
				if (url) {
					data.push({
						url,
						id: item.id
					});
				}
			}
			bar.update(countPull);
			countPull++;
		});
	}

	bar.stop();

	fs.writeFileSync(path, JSON.stringify(data));
};

export default pull;
