export function Copyright() {
	const year = new Date().getFullYear();
	return (
		<footer className="py-6 text-center text-sm text-gray-500 bg-gray-900">
			&copy; {year} Race Buddy. All rights reserved.
		</footer>
	);
}
