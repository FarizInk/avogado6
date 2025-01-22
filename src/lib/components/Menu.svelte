<script lang="ts">
	import Setting from 'lucide-svelte/icons/settings';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
</script>

<Drawer.Root>
	<div class="fixed bottom-2 flex w-full items-center justify-center">
		<Drawer.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' })}
			><Setting /></Drawer.Trigger
		>
	</div>
	<Drawer.Content class="fixed bottom-0">
		<div class="mx-auto w-full max-w-sm">
			<Drawer.Header>
				<Drawer.Title>Move Goal</Drawer.Title>
				<Drawer.Description>Set your daily activity goal.</Drawer.Description>
			</Drawer.Header>
			<div class="p-4 pb-0"></div>
			<Drawer.Footer>
				<Button>Submit</Button>
				<Drawer.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Drawer.Close>
			</Drawer.Footer>
		</div>
	</Drawer.Content>
</Drawer.Root>
