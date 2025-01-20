import axios from 'axios';
import { cliLoading, delay, getDataIG, pocketbase } from './utility.js';
import fs from 'node:fs';

export const push = async (type) => {
	const pb = await pocketbase();
	const dataPath = `temp/data_${type}.json`;
	const fileData = fs.existsSync(dataPath) ? fs.readFileSync(dataPath) : null;
	let data = fileData ? JSON.parse(fileData) : [];

	const bar = cliLoading(`Pushing ${type}`);
	bar.start(data.filter((item) => item.id === null).length, 0);

	let countPush = 1;
	for (let i = 0; i < data.length; i++) {
		const item = data[i];
		if (item.id) continue;
		delete item.id;
		const urlSplitter = item.url?.split('/') ?? [];
		let payload = {
			identifier:
				urlSplitter.length > 0 && !urlSplitter[urlSplitter.length - 1]
					? urlSplitter[urlSplitter.length - 2]
					: (urlSplitter[urlSplitter.length - 1] ?? null),
			type: type,
			date: null,
			url: item.url
		};
		let info = null;

		if (type === 'web') {
			if (!item.identifier) continue;
			payload.identifier = item.identifier;
			info = item;
			payload.date = item.date ? new Date(item.date).toISOString() : null;
		} else if (type === 'twitter') {
			if (!item.url) continue;
			let dataJSON = {
				url: item.url
			};
			try {
				const { data: responseData } = await axios.get(
					item.url.replace('/x.com', '/api.vxtwitter.com')
				);
				dataJSON = {
					...responseData,
					...dataJSON
				};
			} catch (error) {
				console.error(error);
				continue;
			}
			info = dataJSON;
			payload.date = dataJSON.date ? new Date(dataJSON.date)?.toISOString() : null;
		} else if (type === 'instagram') {
			if (!item.url) continue;
			let dataJSON = {
				url: item.url
			};
			const responseData = await getDataIG(item.url);
			if (responseData?.items && responseData?.items.length) {
				const responseItem = responseData?.items[0] ?? null;
				dataJSON = {
					...responseItem,
					...dataJSON
				};
			}
			info = dataJSON;
			payload.date = dataJSON.taken_at ? new Date(dataJSON.taken_at * 1000)?.toISOString() : null;
		}


		if (!payload.identifier || !payload.date) continue;

		try {
			const pbPayload = await pb.collection('avogado').create(payload);
			data[i].id = pbPayload.id;
			fs.writeFileSync(dataPath, JSON.stringify(data));
			if (info !== null) {
				const infoPayload = await pb.collection('avogado_info').create({
					data: info,
					avogado: pbPayload.id
				});

				await pb.collection('avogado').update(pbPayload.id, {
					...pbPayload,
					info: infoPayload.id
				});
			}
			bar.update(countPush);
			countPush++;
		} catch (err) {
			if (err?.response?.data?.identifier?.code !== 'validation_not_unique') {
				console.error(err);
			}
		}

		if (type === 'instagram' || type === 'twitter') await delay(2);
	}
	bar.stop();
};
