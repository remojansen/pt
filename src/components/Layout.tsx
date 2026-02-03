import type { ReactNode } from 'react';
import { Copyright } from './Copyright';
import { Navbar } from './Navbar';

interface LayoutProps {
	children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
	return (
		<div className="min-h-screen flex flex-col">
			<Navbar />
			<main className="pt-16 flex-1">{children}</main>
			<Copyright />
		</div>
	);
}
