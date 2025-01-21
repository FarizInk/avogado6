<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.ts';
	import * as Carousel from '$lib/components/ui/carousel/index.ts';
	import Image from './Image.svelte';
	import { AspectRatio } from '$lib/components/ui/aspect-ratio/index.ts';
	import Instagram from 'lucide-svelte/icons/instagram';
	import Twitter from 'lucide-svelte/icons/twitter';
	import Globe from 'lucide-svelte/icons/globe';
	import Download from 'lucide-svelte/icons/download';
	import Button from '../ui/button/button.svelte';
	import FileVideo from 'lucide-svelte/icons/file-video';
	import { type CarouselAPI } from '$lib/components/ui/carousel/context.ts';
	import { formatDateTime } from '@/utils.ts';

	let props = $props();
	let item = props.item || null;

	let api = $state<CarouselAPI>();
	let current = $state(0);
	const count = $derived(api ? api.scrollSnapList().length : 0);

	$effect(() => {
		if (api) {
			current = api.selectedScrollSnap() + 1;
			api.on('select', () => {
				current = api!.selectedScrollSnap() + 1;
			});
		}
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{item?.metadata?.title ?? '-'}</Card.Title>
		<Card.Description>{item?.metadata?.description ?? '-'}</Card.Description>
	</Card.Header>
	<Card.Content class="group relative flex flex-wrap items-center justify-center gap-2">
		<Carousel.Root setApi={(emblaApi) => (api = emblaApi)} class="relative">
			<Carousel.Content>
				{#each item.expand?.files ?? [] as file}
					<Carousel.Item>
						<Image item={file} />
					</Carousel.Item>
				{/each}
			</Carousel.Content>

			<span class="opacity-0 duration-150 group-hover:opacity-100">
				<Carousel.Previous
					class={(item?.expand?.files?.length ?? 0) <= 1
						? 'hidden'
						: '!-left-0 duration-150 group-hover:!left-2'}
				/>
			</span>
			<span class="opacity-0 duration-150 group-hover:opacity-100">
				<Carousel.Next
					class={(item?.expand?.files?.length ?? 0) <= 1
						? 'hidden'
						: '!-right-0 duration-150 group-hover:!right-2'}
				/>
			</span>
		</Carousel.Root>

		{#if (item.expand?.files.length ?? 0) > 1}
			<div
				class="absolute top-0 flex w-full flex-wrap items-center justify-center gap-2 opacity-0 duration-150 group-hover:top-8 group-hover:opacity-100"
			>
				{#each item.expand?.files ?? [] as file, index}
					<button
						type="button"
						class="w-[35px] opacity-50 duration-150 ease-in-out hover:opacity-100"
						onclick={() => api?.scrollTo(index)}
					>
						<AspectRatio
							ratio={1 / 1}
							class="flex cursor-pointer items-center justify-center overflow-hidden rounded-md bg-muted"
						>
							{#if file?.file?.includes('mp4')}
								<FileVideo class="h-4" />
							{:else}
								<img
									src={`https://space.fariz.dev/api/files/${file?.collectionId}/${file?.id}/${file?.file}?thumb=100x100`}
									alt=""
									class="object-cover grayscale hover:grayscale-0"
								/>
							{/if}
						</AspectRatio>
					</button>
				{/each}
			</div>
		{/if}
	</Card.Content>
	<Card.Footer class="flex items-center justify-between gap-2">
		<div>
			<p class="text-md text-secondary-foreground opacity-50">
				{item?.expand?.files?.length ?? 0} Media
			</p>
			<pre class="text-xs text-secondary-foreground">{formatDateTime(new Date(item.date))}</pre>
		</div>
		<div class="flex items-center gap-2">
			<a href="/" class="text-primary-foreground duration-150 hover:text-primary">
				{#if item.type === 'instagram'}
					<Instagram />
				{:else if item.type === 'twitter'}
					<Twitter />
				{:else if item.type === 'web'}
					<Globe />
				{/if}
			</a>
			<Button variant="outline" size="icon">
				<Download />
			</Button>
		</div>
	</Card.Footer>
</Card.Root>
