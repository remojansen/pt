import type { ReactNode } from 'react';
import { Button } from './Button';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	size?: ModalSize;
	primaryAction?: {
		label: string;
		onClick: () => void;
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
	};
}

const sizeStyles: Record<ModalSize, string> = {
	sm: 'max-w-sm',
	md: 'max-w-md',
	lg: 'max-w-2xl',
	xl: 'max-w-4xl',
};

export function Modal({
	isOpen,
	onClose,
	title,
	children,
	size = 'md',
	primaryAction,
	secondaryAction,
}: ModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60"
				onClick={onClose}
				aria-label="Close modal"
			/>
			<div
				className={`relative bg-gray-800 rounded-lg shadow-xl ${sizeStyles[size]} w-full mx-4 border border-gray-700`}
			>
				<div className="px-6 py-4 border-b border-gray-700">
					<h3 className="text-lg font-semibold text-white">{title}</h3>
				</div>
				<div className="px-6 py-4 text-gray-300">{children}</div>
				{(primaryAction || secondaryAction) && (
					<div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
						{secondaryAction && (
							<Button variant="secondary" onClick={secondaryAction.onClick}>
								{secondaryAction.label}
							</Button>
						)}
						{primaryAction && (
							<Button
								variant="primary"
								color="blue"
								onClick={primaryAction.onClick}
							>
								{primaryAction.label}
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
