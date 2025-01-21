import { cliLoading, getUrls, pocketbase } from './utility.js';

export const check = async () => {
	const pb = await pocketbase();
	const bar = cliLoading(`Checking`);

	let data = {
		incomplete_files: []
	};
	let countPull = 1;
	let totalPages = 1;
	for (let i = 1; i <= totalPages; i++) {
		// if (i > 1) continue; // DEBUG
		const payload = await pb.collection('avogado').getList(i, 200);
		if (i === 1) {
			bar.start(payload.totalItems, 0);
		}
		totalPages = payload.totalPages;
		payload.items?.forEach((item) => {
			// if (key > 0) return; // DEBUG
			let urls = getUrls(item.type, item.data);
			if (urls.length !== item.files.length) {
				data.incomplete_files.push(item.id);
			}
			bar.update(countPull);
			countPull++;
		});
	}
	bar.stop();

	console.log(data);
};

export default check;
