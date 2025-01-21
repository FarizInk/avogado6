<script lang="ts">
	export let item = null;
	let isDragging = false;

	function handleMouseDown() {
		isDragging = true;
	}

	function handleMouseUp() {
		isDragging = false;
	}
	const src = `https://space.fariz.dev/api/files/${item?.collectionId}/${item?.id}/${item?.file}`;
</script>

<button type="button" on:mouseup={handleMouseUp} on:mousedown={handleMouseDown}>
	{#if item?.file?.includes('mp4')}
		<video controls class="rounded-md">
			<source {src} type="video/mp4" />
			<track kind="captions" />
			Your browser does not support the video tag.
		</video>
	{:else}
		<img {src} alt="" class="rounded-md {isDragging ? 'cursor-grabbing' : 'cursor-grab'}" />
	{/if}
</button>
