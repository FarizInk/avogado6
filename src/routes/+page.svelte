<script>
	import PocketBase from 'pocketbase';
	import { onMount } from 'svelte';
	import CardTimeline from '@/components/Timeline/List.svelte';
	import { Button } from '$lib/components/ui/button/index.ts';
	import * as Card from '$lib/components/ui/card/index.ts';
	import * as Select from '$lib/components/ui/select/index.ts';
	import { Input } from '$lib/components/ui/input/index.ts';
	import { Label } from '$lib/components/ui/label/index.ts';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.ts';
	import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { MediaQuery } from 'svelte/reactivity';
	import * as Pagination from '$lib/components/ui/pagination/index.ts';

	const pb = new PocketBase('https://space.fariz.dev');

	const isDesktop = new MediaQuery('(min-width: 800px)');
	let totalItems = $state(0);
	const perPage = $state(15);
	const siblingCount = $derived(isDesktop.current ? 1 : 0);
	let currentPage = $state(1);

	let data = $state([]);
	const fetchData = async () => {
		// fetch a paginated records list
		const resultList = await pb.collection('avogado').getList(currentPage, perPage, {
			expand: 'files',
			sort: '-date'
		});

		console.log(resultList);
		data = resultList.items;
		totalItems = resultList.totalItems;
	};

	onMount(async () => {
		await fetchData();
	});

	const typeOption = [
		{
			value: 'web',
			label: 'Web'
		},
		{
			value: 'twitter',
			label: 'Twitter / X'
		},
		{
			value: 'instagram',
			label: 'Instagram'
		}
	];

	let types = $state([]);

	const selectedType = $derived(
		types.length === 0
			? 'All Type'
			: typeOption
					.filter((a) => types.includes(a.value))
					.map((a) => a.label)
					.join(', ')
	);

	const onPageChange = async (value) => {
		currentPage = value;
		await fetchData();
	};
</script>

<div class="container mx-auto flex min-h-screen justify-center gap-4 pb-10 pt-5">
	<div class="max-w-[500px] space-y-4">
		{#each data as item}
			<CardTimeline {item} />
		{/each}
	</div>
	<div class="relative">
		<div class="sticky top-4 w-[350px]">
			<Card.Root>
				<!-- <Card.Header>
					<Card.Title>Create project</Card.Title>
					<Card.Description>Deploy your new project in one-click.</Card.Description>
				</Card.Header> -->
				<Card.Content>
					<form>
						<div class="grid w-full items-center gap-4">
							<div class="flex flex-col space-y-1.5">
								<Label for="keyword">Search</Label>
								<Input id="keyword" placeholder="type the keyword..." />
							</div>
							<div class="flex flex-col space-y-1.5">
								<Label for="type">Type</Label>
								<Select.Root type="multiple" bind:value={types}>
									<Select.Trigger id="type">
										{selectedType}
									</Select.Trigger>
									<Select.Content>
										{#each typeOption as { value, label }}
											<Select.Item {value} {label} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div class="flex flex-col space-y-1.5">
								<Label for="type">Sort By</Label>
								<RadioGroup.Root value="newest">
									<div class="flex items-center space-x-2">
										<RadioGroup.Item value="newest" id="r1" />
										<Label for="r1">Newest</Label>
									</div>
									<div class="flex items-center space-x-2">
										<RadioGroup.Item value="oldest" id="r2" />
										<Label for="r2">Oldest</Label>
									</div>
								</RadioGroup.Root>
							</div>
						</div>
					</form>
				</Card.Content>
				<Card.Footer class="flex justify-between">
					<!-- <Button variant="outline">Cancel</Button> -->
					<Button class="flex w-full items-center justify-center gap-2">
						<SlidersHorizontal />
						Filter
					</Button>
				</Card.Footer>
			</Card.Root>

			<Pagination.Root
				count={totalItems}
				{perPage}
				{siblingCount}
				class="mt-2"
				page={currentPage}
				{onPageChange}
			>
				{#snippet children({ pages, currentPage })}
					<Pagination.Content>
						<Pagination.Item>
							<Pagination.PrevButton>
								<ChevronLeft class="size-4" />
								<span class="hidden sm:block">Previous</span>
							</Pagination.PrevButton>
						</Pagination.Item>
						<!-- {#each pages as page (page.key)}
							{#if page.type === 'ellipsis'}
								<Pagination.Item>
									<Pagination.Ellipsis />
								</Pagination.Item>
							{:else}
								<Pagination.Item>
									<Pagination.Link {page} isActive={currentPage === page.value}>
										{page.value}
									</Pagination.Link>
								</Pagination.Item>
							{/if}
						{/each} -->
						<Pagination.Item>
							<Pagination.NextButton>
								<span class="hidden sm:block">Next</span>
								<ChevronRight class="size-4" />
							</Pagination.NextButton>
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		</div>
	</div>
</div>
