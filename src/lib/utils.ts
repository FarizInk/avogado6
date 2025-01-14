import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const isBrowser = typeof document !== "undefined";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function updateTheme() {
	if (!isBrowser) return;
	document.body.classList.forEach((className) => {
		if (className.match(/^theme.*/)) {
			document.body.classList.remove(className);
		}
	});
}