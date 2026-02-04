import { useEffect, useRef, useState } from 'react';
import { IoAddCircleSharp, IoSettingsSharp } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import { Button } from './Button';
import { Modal } from './Modal';

export function Navbar() {
	const { addStatsEntry, addDietEntry } = useUserData();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [showLogWeightModal, setShowLogWeightModal] = useState(false);
	const [showLogMealModal, setShowLogMealModal] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Log Weight state
	const [newWeight, setNewWeight] = useState('');
	const [bodyFatMode, setBodyFatMode] = useState<'unknown' | 'value'>(
		'unknown',
	);
	const [newBodyFat, setNewBodyFat] = useState('');
	const [weightError, setWeightError] = useState<string | null>(null);
	const [bodyFatError, setBodyFatError] = useState<string | null>(null);

	// Helper to get local date string (YYYY-MM-DD)
	const getLocalDateString = () => {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	// Log Meal state
	const [mealDate, setMealDate] = useState(getLocalDateString);
	const [mealCalories, setMealCalories] = useState('');
	const [mealType, setMealType] = useState<
		'breakfast' | 'lunch' | 'dinner' | 'snack' | null
	>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const openLogWeightModal = () => {
		setNewWeight('');
		setNewBodyFat('');
		setBodyFatMode('unknown');
		setWeightError(null);
		setBodyFatError(null);
		setIsDropdownOpen(false);
		setShowLogWeightModal(true);
	};

	const openLogMealModal = () => {
		setMealDate(getLocalDateString());
		setMealCalories('');
		setMealType(null);
		setIsDropdownOpen(false);
		setShowLogMealModal(true);
	};

	const handleLogWeight = async () => {
		setWeightError(null);
		setBodyFatError(null);

		const weight = Number.parseFloat(newWeight);
		if (!newWeight.trim()) {
			setWeightError('Weight is required');
			return;
		}
		if (Number.isNaN(weight) || weight < 20 || weight > 300) {
			setWeightError('Weight must be between 20 and 300 kg');
			return;
		}

		const bodyFatPercentage =
			bodyFatMode === 'value' && newBodyFat
				? Number.parseFloat(newBodyFat)
				: null;

		if (bodyFatMode === 'value' && !newBodyFat.trim()) {
			setBodyFatError('Body fat percentage is required');
			return;
		}
		if (
			bodyFatPercentage !== null &&
			(Number.isNaN(bodyFatPercentage) ||
				bodyFatPercentage < 1 ||
				bodyFatPercentage > 55)
		) {
			setBodyFatError('Body fat must be between 1 and 55%');
			return;
		}

		const today = getLocalDateString();
		await addStatsEntry({
			id: crypto.randomUUID(),
			date: today,
			weightKg: weight,
			bodyFatPercentage,
		});

		setShowLogWeightModal(false);
	};

	const handleLogMeal = async () => {
		const calories = Number.parseInt(mealCalories, 10);
		if (mealDate && !Number.isNaN(calories) && calories > 0) {
			await addDietEntry({
				id: crypto.randomUUID(),
				date: mealDate,
				calories,
			});
			setShowLogMealModal(false);
		}
	};

	return (
		<>
			<nav
				className="fixed top-0 left-0 right-0 z-50 bg-gray-900 shadow-md"
				data-tour="navbar"
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Link to="/" className="flex items-center gap-2">
							<span className="text-2xl">💪</span>
							<span className="text-xl font-bold text-white">
								Personal Trainer
							</span>
						</Link>
						<div className="flex items-center gap-4">
							<div className="relative" ref={dropdownRef}>
								<button
									type="button"
									onClick={() => setIsDropdownOpen(!isDropdownOpen)}
									className="flex items-center justify-center h-6 w-6 text-gray-300 hover:text-white"
									data-tour="add-button"
								>
									<IoAddCircleSharp className="h-6 w-6" />
								</button>
								{isDropdownOpen && (
									<div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
										<button
											type="button"
											onClick={openLogWeightModal}
											className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white"
										>
											Log Weight
										</button>
										<button
											type="button"
											onClick={openLogMealModal}
											className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white"
										>
											Log Meal
										</button>
									</div>
								)}
							</div>
							<Link
								to="/settings"
								className="flex items-center justify-center h-6 w-6 text-gray-300 hover:text-white"
								data-tour="settings-link"
							>
								<IoSettingsSharp className="h-6 w-6" />
							</Link>
						</div>
					</div>
				</div>
			</nav>

			{/* Log Weight Modal */}
			<Modal
				isOpen={showLogWeightModal}
				onClose={() => setShowLogWeightModal(false)}
				title="Log Weight"
				primaryAction={{
					label: 'Save',
					onClick: handleLogWeight,
				}}
				secondaryAction={{
					label: 'Cancel',
					onClick: () => setShowLogWeightModal(false),
				}}
			>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="navbarWeight"
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							Weight (kg)
						</label>
						<input
							type="number"
							id="navbarWeight"
							value={newWeight}
							onChange={(e) => setNewWeight(e.target.value)}
							className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 ${weightError ? 'border-red-500' : 'border-gray-700'}`}
							placeholder="70"
							min="20"
							max="300"
							step="0.1"
						/>
						{weightError && (
							<p className="text-red-500 text-sm mt-1">{weightError}</p>
						)}
					</div>
					<div>
						<span className="block text-sm font-medium text-gray-300 mb-2">
							Body Fat (%)
						</span>
						<div className="flex gap-2 mb-2">
							<Button
								color="blue"
								active={bodyFatMode === 'unknown'}
								onClick={() => setBodyFatMode('unknown')}
								className="flex-1"
							>
								Unknown
							</Button>
							<Button
								color="blue"
								active={bodyFatMode === 'value'}
								onClick={() => setBodyFatMode('value')}
								className="flex-1"
							>
								Enter Value
							</Button>
						</div>
						{bodyFatMode === 'value' && (
							<>
								<input
									type="number"
									value={newBodyFat}
									onChange={(e) => setNewBodyFat(e.target.value)}
									className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 ${bodyFatError ? 'border-red-500' : 'border-gray-700'}`}
									placeholder="15"
									min="1"
									max="55"
									step="0.1"
								/>
								{bodyFatError && (
									<p className="text-red-500 text-sm mt-1">{bodyFatError}</p>
								)}
							</>
						)}
					</div>
				</div>
			</Modal>

			{/* Log Meal Modal */}
			<Modal
				isOpen={showLogMealModal}
				onClose={() => setShowLogMealModal(false)}
				title="Log Meal"
				primaryAction={{ label: 'Save', onClick: handleLogMeal }}
				secondaryAction={{
					label: 'Cancel',
					onClick: () => setShowLogMealModal(false),
				}}
			>
				<div className="space-y-4">
					<div>
						<span className="block text-sm font-medium text-gray-300 mb-2">
							Meal Type
						</span>
						<div className="flex gap-2">
							<Button
								color="blue"
								active={mealType === 'breakfast'}
								onClick={() =>
									setMealType(mealType === 'breakfast' ? null : 'breakfast')
								}
								className="flex-1"
							>
								Breakfast
							</Button>
							<Button
								color="blue"
								active={mealType === 'lunch'}
								onClick={() =>
									setMealType(mealType === 'lunch' ? null : 'lunch')
								}
								className="flex-1"
							>
								Lunch
							</Button>
							<Button
								color="blue"
								active={mealType === 'dinner'}
								onClick={() =>
									setMealType(mealType === 'dinner' ? null : 'dinner')
								}
								className="flex-1"
							>
								Dinner
							</Button>
							<Button
								color="blue"
								active={mealType === 'snack'}
								onClick={() =>
									setMealType(mealType === 'snack' ? null : 'snack')
								}
								className="flex-1"
							>
								Snack
							</Button>
						</div>
					</div>
					<div>
						<label
							htmlFor="navbar-meal-date"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Date
						</label>
						<input
							id="navbar-meal-date"
							type="date"
							value={mealDate}
							onChange={(e) => setMealDate(e.target.value)}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label
							htmlFor="navbar-meal-calories"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Total Calories (kcal)
						</label>
						<input
							id="navbar-meal-calories"
							type="number"
							value={mealCalories}
							onChange={(e) => setMealCalories(e.target.value)}
							placeholder="e.g. 2000"
							min="0"
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
			</Modal>
		</>
	);
}
