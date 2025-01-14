import { persisted } from "svelte-persisted-store";

import type { Style } from "$lib/registry/styles.ts";
import type { Theme } from "$lib/registry/themes.ts";

type Config = {
	style: Style["name"];
	theme: Theme["name"];
	radius: number;
};

export const config = persisted<Config>("config", {
	style: "default",
	theme: "zinc",
	radius: 0.5,
});