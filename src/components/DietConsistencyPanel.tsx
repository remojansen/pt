import { useMemo, useState } from 'react';
import { type DietEntry, useUserData } from '../hooks/useUserData';
import { Modal } from './Modal';
import { Panel } from './Panel';

interface DayData {
	date: Date;
	dateStr: string;
}

// Calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
	const today = new Date();
	const birthDate = new Date(dateOfBirth);
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (
		monthDiff < 0 ||
		(monthDiff === 0 && today.getDate() < birthDate.getDate())
	) {
		age--;
	}
	return age;
}

// Calculate BMR using Mifflin-St Jeor equation
function calculateBMR(
	weightKg: number,
	heightCm: number,
	age: number,
	sex: 'male' | 'female',
): number {
	const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;
	return sex === 'male' ? baseBMR + 5 : baseBMR - 161;
}

// Calculate daily calorie limit based on weekly weight loss goal
function calculateDailyCalorieLimit(
	currentWeightKg: number,
	targetWeightLossPerWeekKg: number,
	heightCm: number,
	age: number,
	sex: 'male' | 'female',
): { dailyLimit: number; deficit: number } {
	const bmr = calculateBMR(currentWeightKg, heightCm, age, sex);
	// TDEE with sedentary activity level (BMR * 1.2)
	const tdee = bmr * 1.2;

	// 1 kg of body fat = ~7700 calories
	// Weekly deficit needed = targetWeightLossPerWeekKg * 7700 calories
	// Daily deficit = weekly deficit / 7 days
	const dailyDeficit = (targetWeightLossPerWeekKg * 7700) / 7;

	// Daily limit = TDEE - deficit needed
	// Clamp to realistic human calorie limits (1200-3500 kcal)
	const rawDailyLimit = Math.round(tdee - dailyDeficit);
	const dailyLimit = Math.max(1200, Math.min(3500, rawDailyLimit));

	return { dailyLimit, deficit: Math.round(dailyDeficit) };
}

export function DietConsistencyPanel() {
	const { userProfile, statsEntries, dietEntries, isLoading, addDietEntry } =
		useUserData();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [mealDate, setMealDate] = useState(
		() => new Date().toISOString().split('T')[0],
	);
	const [mealCalories, setMealCalories] = useState('');

	const last30Days = useMemo(() => {
		const days: DayData[] = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let i = 29; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			days.push({
				date,
				dateStr: date.toISOString().split('T')[0],
			});
		}
		return days;
	}, []);

	// Create a map of diet entries by date
	const dietEntriesMap = useMemo(() => {
		const map = new Map<string, DietEntry>();
		for (const entry of dietEntries) {
			map.set(entry.date, entry);
		}
		return map;
	}, [dietEntries]);

	// Calculate calorie limit and chart data
	const calorieData = useMemo(() => {
		// Get current weight from latest stats entry
		const latestStats = statsEntries.length > 0 ? statsEntries[0] : null;
		const currentWeightKg = latestStats?.weightKg;

		const { heightCm, dateOfBirth, sex, targetWeightKg, targetWeightLossPerWeekKg } =
			userProfile;

		// Check if we have all the data needed to calculate calorie limit
		if (
			!currentWeightKg ||
			!heightCm ||
			!dateOfBirth ||
			!sex ||
			!targetWeightKg ||
			!targetWeightLossPerWeekKg
		) {
			return null;
		}

		const age = calculateAge(dateOfBirth);
		const { dailyLimit, deficit } = calculateDailyCalorieLimit(
			currentWeightKg,
			targetWeightLossPerWeekKg,
			heightCm,
			age,
			sex,
		);

		// Get calorie data for last 30 days
		const chartData = last30Days.map((day) => {
			const dietEntry = dietEntriesMap.get(day.dateStr);
			return {
				date: day.date,
				dateStr: day.dateStr,
				calories: dietEntry?.calories ?? null,
			};
		});

		// Calculate max calories for chart scaling
		const calorieValues = chartData
			.map((d) => d.calories)
			.filter((c): c is number => c !== null);
		const maxCalories =
			calorieValues.length > 0
				? Math.max(...calorieValues, dailyLimit)
				: dailyLimit;

		// Calculate streaks (consecutive days under limit)
		let currentStreak = 0;
		let longestStreak = 0;
		let tempStreak = 0;

		// Go through chart data to calculate longest streak
		for (const day of chartData) {
			if (day.calories !== null && day.calories <= dailyLimit) {
				tempStreak++;
				longestStreak = Math.max(longestStreak, tempStreak);
			} else {
				tempStreak = 0;
			}
		}

		// Calculate current streak (from today backwards)
		for (let i = chartData.length - 1; i >= 0; i--) {
			const day = chartData[i];
			if (day.calories !== null && day.calories <= dailyLimit) {
				currentStreak++;
			} else if (day.calories !== null) {
				break;
			}
		}

		return {
			dailyLimit,
			deficit,
			chartData,
			maxCalories,
			currentWeightKg,
			targetWeightKg,
			currentStreak,
			longestStreak,
		};
	}, [statsEntries, userProfile, last30Days, dietEntriesMap]);

	if (isLoading) {
		return (
			<Panel title="Diet Consistency">
				<div className="h-64 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (!calorieData) {
		return (
			<Panel title="Diet Consistency">
				<div className="h-64 flex items-center justify-center text-gray-400">
					Set your target weight and target weight loss per week in Settings, and add weight
					measurements to track calorie intake.
				</div>
			</Panel>
		);
	}

	const handleLogMeal = async () => {
		const calories = Number.parseInt(mealCalories, 10);
		if (mealDate && !Number.isNaN(calories) && calories > 0) {
			await addDietEntry({
				id: crypto.randomUUID(),
				date: mealDate,
				calories,
			});
			setIsModalOpen(false);
			setMealCalories('');
			setMealDate(new Date().toISOString().split('T')[0]);
		}
	};

	return (
		<Panel
			title="Diet Consistency"
			cta={{ cta: 'Log Meal', onCta: () => setIsModalOpen(true) }}
		>
			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title="Log Meal"
				primaryAction={{ label: 'Save', onClick: handleLogMeal }}
				secondaryAction={{ label: 'Cancel', onClick: () => setIsModalOpen(false) }}
			>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="meal-date"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Date
						</label>
						<input
							id="meal-date"
							type="date"
							value={mealDate}
							onChange={(e) => setMealDate(e.target.value)}
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label
							htmlFor="meal-calories"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Total Calories (kcal)
						</label>
						<input
							id="meal-calories"
							type="number"
							value={mealCalories}
							onChange={(e) => setMealCalories(e.target.value)}
							placeholder="e.g. 2000"
							min="0"
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
			</Modal>

			<div className="flex gap-6 mb-4">
				<div>
					<div className="text-2xl font-bold text-white">
						🎯 {calorieData.dailyLimit} kcal
					</div>
					<div className="text-sm text-gray-400">Daily limit</div>
				</div>
				<div>
					<div
						className={`text-2xl font-bold ${calorieData.deficit > 0 ? 'text-green-400' : calorieData.deficit < 0 ? 'text-blue-400' : 'text-white'}`}
					>
						📉 {Math.abs(calorieData.deficit)} kcal
					</div>
					<div className="text-sm text-gray-400">
						Daily {calorieData.deficit >= 0 ? 'deficit' : 'surplus'}
					</div>
				</div>
				<div>
					<div className="text-2xl font-bold text-orange-400">
						🔥 {calorieData.currentStreak} days
					</div>
					<div className="text-sm text-gray-400">Current Streak</div>
				</div>
				<div>
					<div className="text-2xl font-bold text-yellow-400">
						🏆 {calorieData.longestStreak} days
					</div>
					<div className="text-sm text-gray-400">Longest Streak</div>
				</div>
			</div>

			<div className="overflow-x-auto">
				<div className="min-w-[800px] h-48 relative">
					{/* Y-axis labels */}
					<div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-xs text-gray-400">
						<span>{Math.round(calorieData.maxCalories * 1.1)}</span>
						<span>{Math.round(calorieData.maxCalories * 0.55)}</span>
						<span>0</span>
					</div>

					{/* Chart area */}
					<div className="ml-14 h-full relative">
						{/* Limit line */}
						<div
							className="absolute left-0 right-0 border-t-2 border-dashed border-yellow-500 z-10"
							style={{
								bottom: `${(calorieData.dailyLimit / (calorieData.maxCalories * 1.1)) * 100}%`,
							}}
						>
							<span className="absolute right-0 -top-4 text-xs text-yellow-500">
								Limit
							</span>
						</div>

						{/* Bars */}
						<div className="flex items-end h-[calc(100%-24px)] gap-0.5">
							{calorieData.chartData.map((day) => {
								const calories = day.calories;
								const hasData = calories !== null;
								const heightPercent = hasData
									? Math.min(
											(calories / (calorieData.maxCalories * 1.1)) * 100,
											100,
										)
									: 0;
								const isOverLimit =
									hasData && calories > calorieData.dailyLimit;

								return (
									<div
										key={day.dateStr}
										className="flex-1 flex flex-col items-center"
									>
										<div className="w-full relative flex-1 flex items-end">
											{hasData ? (
												<div
													className={`w-full rounded-t-sm ${isOverLimit ? 'bg-red-500' : 'bg-green-500'}`}
													style={{ height: `${heightPercent}%` }}
													title={`${day.date.toLocaleDateString()}: ${calories} kcal${isOverLimit ? ' (over limit)' : ''}`}
												/>
											) : (
												<div
													className="w-full h-1 bg-gray-700 rounded-sm"
													title={`${day.date.toLocaleDateString()}: No data`}
												/>
											)}
										</div>
									</div>
								);
							})}
						</div>

						{/* X-axis labels */}
						<div className="flex mt-1">
							{calorieData.chartData.map((day, index) => (
								<div
									key={day.dateStr}
									className="flex-1 text-center text-[10px] text-gray-500"
								>
									{index % 5 === 0 ? day.date.getDate() : ''}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-sm bg-green-500" />
					<span>Under limit</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-sm bg-red-500" />
					<span>Over limit</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-1 rounded-sm bg-gray-700" />
					<span>No data</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-6 border-t-2 border-dashed border-yellow-500" />
					<span>Daily limit</span>
				</div>
			</div>
		</Panel>
	);
}
