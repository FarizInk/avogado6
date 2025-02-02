import axios from 'axios';
import { cliLoading, delay, pocketbase } from './utility.js';
import fs from 'node:fs';
import 'dotenv/config';

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
			url: item.url,
			metadata: {
				title: null,
				description: null
			}
		};

		let info = null;
		let infoMetadata = {
			type,
			via: null,
			medias: []
		}
		if (type === 'web') {
			if (!item.identifier) continue;
			payload.identifier = item.identifier;
			info = item;
			payload.date = item.date ? new Date(item.date).toISOString() : null;
			infoMetadata.medias = [item.url]
		} else {
				try {
				const { data: responseData } = await axios.post(`${process.env.H_API_URL}`, {
					url: item.url,
				}, {
					headers: {
						'Accept': 'application/json',
						'Authorization': `Bearer ${process.env.H_API_TOKEN}`
					}
				});

				info = responseData.data
				infoMetadata.via = responseData?.via ?? null
				infoMetadata.medias = responseData?.medias ?? []
				let timestamp = null
				if (type === 'instagram') {
					timestamp = responseData?.data?.taken_at_timestamp ?? responseData?.data?.taken_at
					if (timestamp) timestamp  = timestamp * 1000
				} else if (type === 'twitter') {
					timestamp = responseData?.data?.date
				}
				payload.date = timestamp ? new Date(timestamp) : null
			} catch (error) {
				console.error(error);
				continue;
			}
		}

		if (!payload.identifier || !payload.date) continue;

		try {
			const pbPayload = await pb.collection('avogado').create(payload);
			data[i].id = pbPayload.id;
			fs.writeFileSync(dataPath, JSON.stringify(data));
			if (info !== null) {
				const infoPayload = await pb.collection('avogado_info').create({
					data: info,
					avogado: pbPayload.id,
					metadata: infoMetadata
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
