import type { ReactNode } from 'react';

interface PanelProps {
	title: string;
	children: ReactNode;
	headerActions?: ReactNode;
	dataTour?: string;
}

export function Panel({
	title,
	children,
	headerActions,
	dataTour,
}: PanelProps) {
	return (
		<div className="bg-gray-900 rounded-lg shadow min-w-0" data-tour={dataTour}>
			<div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-white">{title}</h2>
				{headerActions && <div>{headerActions}</div>}
			</div>
			<div className="p-6 min-w-0">{children}</div>
		</div>
	);
}
