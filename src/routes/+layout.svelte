<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import '../app.css';
	import Metadata from '@/components/metadata.svelte';
	import Menu from '@/components/Menu.svelte';

	let { children } = $props();
</script>

<ModeWatcher />
<Metadata />
<Toaster />
<div class="relative min-h-screen bg-background" id="page" data-vaul-drawer-wrapper>
	{@render children()}
	<Menu />
</div>
