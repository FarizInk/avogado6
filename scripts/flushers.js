import fs from 'node:fs';
import { cliLoading, pocketbase } from './utility.js';

export const flush = async (type) => {
	if (type === null) return;
	if (type === 'ig') type = 'instagram';

	const dataPath = `temp/data_${type}.json`;
	const fileData = fs.existsSync(dataPath) ? fs.readFileSync(dataPath) : null;
	let data = fileData ? JSON.parse(fileData) : [];

	const pb = await pocketbase();

	const a = await pb.collection('avogado').getList(1, 200, { filter: `type = '${type}'` });

	const bar = cliLoading(`Flushing ${type}`);
	bar.start(a.totalItems, 0);

	let countDelete = 1;
	for (let i = a.totalPages; i >= 1; i--) {
		const payload = await pb.collection('avogado').getList(i, 200, { filter: `type = '${type}'` });
		for (let j = 0; j < payload.items.length; j++) {
			const item = payload.items[j];
			await pb.collection('avogado').delete(item.id);
			bar.update(countDelete);
			countDelete++;
		}
	}

	bar.stop();

	data.forEach((item, key) => {
		if (data[key] && data[key].id) data[key].id = null;
	});

	fs.writeFileSync(`temp/data_${type}.json`, JSON.stringify(data));
};

export default flush;
