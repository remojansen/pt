import { type ReactNode, useEffect, useRef, useState } from 'react';

export interface DropdownOption<T = string> {
	value: T;
	label: string;
}

interface DropdownProps<T = string> {
	options: DropdownOption<T>[];
	value: T;
	onChange: (value: T) => void;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	buttonContent?: (selectedOption: DropdownOption<T> | undefined) => ReactNode;
}

export function Dropdown<T = string>({
	options,
	value,
	onChange,
	disabled = false,
	placeholder = 'Select...',
	className = '',
	buttonContent,
}: DropdownProps<T>) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((opt) => opt.value === value);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
	}, [isOpen]);

	// Handle keyboard navigation
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (!isOpen) return;

			if (event.key === 'Escape') {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown);
			return () => {
				document.removeEventListener('keydown', handleKeyDown);
			};
		}
	}, [isOpen]);

	const handleToggle = () => {
		if (!disabled) {
			setIsOpen(!isOpen);
		}
	};

	const handleSelect = (optionValue: T) => {
		onChange(optionValue);
		setIsOpen(false);
	};

	const defaultButtonContent = selectedOption
		? selectedOption.label
		: placeholder;

	return (
		<div ref={dropdownRef} className={`relative ${className}`}>
			<button
				type="button"
				onClick={handleToggle}
				disabled={disabled}
				className={`
					px-4 py-2 text-sm font-medium rounded-lg transition-colors 
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500
					flex items-center justify-between gap-2 min-w-[140px]
					${
						disabled
							? 'bg-gray-800 text-gray-500 cursor-not-allowed'
							: 'bg-purple-600 text-white hover:bg-purple-700'
					}
				`}
			>
				<span>
					{buttonContent ? buttonContent(selectedOption) : defaultButtonContent}
				</span>
				<svg
					className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{isOpen && (
				<div className="absolute z-50 mt-2 w-full min-w-[140px] bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
					<ul className="py-1">
						{options.map((option) => (
							<li key={String(option.value)}>
								<button
									type="button"
									onClick={() => handleSelect(option.value)}
									className={`
										w-full text-left px-4 py-2 text-sm transition-colors
										${
											option.value === value
												? 'bg-purple-600 text-white'
												: 'text-gray-300 hover:bg-gray-700'
										}
									`}
								>
									{option.label}
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
