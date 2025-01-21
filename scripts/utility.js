import PocketBase from 'pocketbase';
import 'dotenv/config';
import cliProgress from 'cli-progress';
import axios from 'axios';

export const delay = (time) => {
	return new Promise(function (resolve) {
		setTimeout(resolve, time * 1000);
	});
};

export const pocketbase = async () => {
	const pb = new PocketBase(process.env.POCKETBASE_URL);
	await pb
		.collection('_superusers')
		.authWithPassword(process.env.POCKETBASE_USERNAME, process.env.POCKETBASE_PASSWORD);

	return pb;
};

export const cliLoading = (title = '') => {
	return new cliProgress.SingleBar(
		{
			format: `${title} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`
		},
		cliProgress.Presets.shades_classic
	);
};

export const getDataIG = async (url) => {
	try {
		const { data: responseData } = await axios.get(
			`${url.replace('/reel/', '/p/').replace('/reels/', '/p/').toString()}?__a=1&__d=dis`,
			{
				headers: {
					Cookie: process.env.IG_COOKIES
				},
				withCredentials: true
			}
		);
		return responseData;
	} catch (error) {
		console.error(error);
		return null;
	}
};

export const getUrls = (type, data) => {
	let urls = [];
	if (type === 'web') {
		if (data?.url) urls.push(data.url);
	} else if (type === 'twitter') {
		data?.mediaURLs?.forEach((url) => urls.push(url));
	} else if (type === 'instagram') {
		if (data.url.toString().includes('/reel')) {
			const video = data?.video_versions ? data?.video_versions[0] : null;
			if (video && video.url) urls.push(video.url);
		} else {
			const medias = data?.carousel_media ?? [data];
			for (let i = 0; i < medias.length; i++) {
				const media = medias[i];
				let url = null;
				if (media.video_versions?.length >= 1) {
					url = media.video_versions[0]?.url;
				} else {
					url = media.image_versions2?.candidates[0]?.url ?? null;
				}
				if (url) urls.push(url);
			}
		}
	}

	return urls;
};
