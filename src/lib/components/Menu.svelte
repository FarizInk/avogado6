<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar/index.js';

	let filterWeb = $state(true);
	let filterTwitter = $state(true);
	let filterIG = $state(true);
	let sort = $state('newest');
</script>

<div class="fixed bottom-5 left-0 right-0 mx-auto w-fit text-center">
	<Menubar.Root>
		<Menubar.Menu>
			<Menubar.Trigger>File</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Item>
					New Tab <Menubar.Shortcut>⌘T</Menubar.Shortcut>
				</Menubar.Item>
				<Menubar.Item>
					New Window <Menubar.Shortcut>⌘N</Menubar.Shortcut>
				</Menubar.Item>
				<Menubar.Item>New Incognito Window</Menubar.Item>
				<Menubar.Separator />
				<Menubar.Sub>
					<Menubar.SubTrigger>Share</Menubar.SubTrigger>
					<Menubar.SubContent>
						<Menubar.Item>Email link</Menubar.Item>
						<Menubar.Item>Messages</Menubar.Item>
						<Menubar.Item>Notes</Menubar.Item>
					</Menubar.SubContent>
				</Menubar.Sub>
				<Menubar.Separator />
				<Menubar.Item>
					Print... <Menubar.Shortcut>⌘P</Menubar.Shortcut>
				</Menubar.Item>
			</Menubar.Content>
		</Menubar.Menu>
		<Menubar.Menu>
			<Menubar.Trigger>Edit</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Item>
					Undo <Menubar.Shortcut>⌘Z</Menubar.Shortcut>
				</Menubar.Item>
				<Menubar.Item>
					Redo <Menubar.Shortcut>⇧⌘Z</Menubar.Shortcut>
				</Menubar.Item>
				<Menubar.Separator />
				<Menubar.Sub>
					<Menubar.SubTrigger>Find</Menubar.SubTrigger>
					<Menubar.SubContent>
						<Menubar.Item>Search the web</Menubar.Item>
						<Menubar.Separator />
						<Menubar.Item>Find...</Menubar.Item>
						<Menubar.Item>Find Next</Menubar.Item>
						<Menubar.Item>Find Previous</Menubar.Item>
					</Menubar.SubContent>
				</Menubar.Sub>
				<Menubar.Separator />
				<Menubar.Item>Cut</Menubar.Item>
				<Menubar.Item>Copy</Menubar.Item>
				<Menubar.Item>Paste</Menubar.Item>
			</Menubar.Content>
		</Menubar.Menu>
		<Menubar.Menu>
			<Menubar.Trigger>Filter</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.CheckboxItem bind:checked={filterWeb}>Web</Menubar.CheckboxItem>
				<Menubar.CheckboxItem bind:checked={filterTwitter}>Twitter / X</Menubar.CheckboxItem>
				<Menubar.CheckboxItem bind:checked={filterIG}>Instagram</Menubar.CheckboxItem>
				<Menubar.Separator />
				<Menubar.Item inset>All</Menubar.Item>
			</Menubar.Content>
		</Menubar.Menu>
		<Menubar.Menu>
			<Menubar.Trigger>Sort</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.RadioGroup bind:value={sort}>
					<Menubar.RadioItem value="newest">Newest</Menubar.RadioItem>
					<Menubar.RadioItem value="oldest">Oldest</Menubar.RadioItem>
				</Menubar.RadioGroup>
			</Menubar.Content>
		</Menubar.Menu>
	</Menubar.Root>
</div>
