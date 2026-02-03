import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonColor = 'blue' | 'purple' | 'gray';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: ButtonVariant;
	color?: ButtonColor;
	size?: ButtonSize;
	fullWidth?: boolean;
	active?: boolean;
}

const colorStyles: Record<ButtonColor, Record<ButtonVariant, string>> = {
	blue: {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
		secondary:
			'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500',
		ghost: 'text-blue-400 hover:text-blue-300 hover:bg-gray-700',
	},
	purple: {
		primary:
			'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
		secondary:
			'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500',
		ghost: 'text-purple-400 hover:text-purple-300 hover:bg-gray-700',
	},
	gray: {
		primary: 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500',
		secondary:
			'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500',
		ghost: 'text-gray-400 hover:text-gray-300 hover:bg-gray-700',
	},
};

const sizeStyles: Record<ButtonSize, string> = {
	sm: 'px-4 py-2 text-sm',
	md: 'px-4 py-3 text-base',
	lg: 'px-6 py-4 text-lg',
};

export function Button({
	children,
	variant = 'primary',
	color = 'blue',
	size = 'sm',
	fullWidth = false,
	active,
	disabled,
	className = '',
	...props
}: ButtonProps) {
	const baseStyles =
		'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800';

	const disabledStyles = disabled
		? 'bg-gray-700 text-gray-500 cursor-not-allowed hover:bg-gray-700'
		: '';

	// For toggle buttons with active state
	const activeStyles =
		active !== undefined
			? active
				? colorStyles[color].primary
				: colorStyles[color].secondary
			: colorStyles[color][variant];

	const widthStyles = fullWidth ? 'w-full' : '';

	return (
		<button
			type="button"
			disabled={disabled}
			className={`${baseStyles} ${sizeStyles[size]} ${disabled ? disabledStyles : activeStyles} ${widthStyles} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}
