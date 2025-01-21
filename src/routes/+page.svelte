<script>
	import PocketBase from 'pocketbase';
	import { onMount } from 'svelte';
	import Card from '@/components/Card/Card.svelte';

	const pb = new PocketBase('https://space.fariz.dev');

	let data = [];
	onMount(async () => {
		// fetch a paginated records list
		const resultList = await pb.collection('avogado').getList(1, 15, {
			expand: 'files',
			sort: '-date'
		});

		console.log(resultList);
		data = resultList.items;
	});
</script>

<div class="container mx-auto min-h-screen max-w-[500px] space-y-4 px-2 pb-10 pt-5">
	{#each data as item}
		<Card {item} />
	{/each}
</div>
