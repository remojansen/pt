import { useEffect, useMemo, useState } from 'react';
import {
	Bar,
	ComposedChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { getDaysForTimeRange, useTimeframe } from '../hooks/useTimeframe';
import { useTour } from '../hooks/useTour';
import {
	type DietEntry,
	type MealType,
	type UserStatsEntry,
	useUserData,
} from '../hooks/useUserData';
import { Button } from './Button';
import { Highlight } from './Highlight';
import { HighlightGroup } from './HighlightGroup';
import { Modal } from './Modal';
import { Panel } from './Panel';

interface DayData {
	date: Date;
	dateStr: string;
}

interface ChartDataPoint {
	dayLabel: string;
	date: Date;
	calories: number | null;
	isOverLimit: boolean;
	isToday: boolean;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: Array<{
		payload: ChartDataPoint;
		dataKey: string;
		color: string;
		name: string;
		value: number;
	}>;
	dailyLimit: number;
}

function CustomTooltip({ active, payload, dailyLimit }: CustomTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;

	const data = payload[0].payload;
	const hasData = data.calories !== null;

	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
			<p className="text-gray-300 text-sm mb-1">
				{data.date.toLocaleDateString()}
				{data.isToday && <span className="ml-2 text-purple-400">(Today)</span>}
			</p>
			{hasData ? (
				<>
					<p className="text-white">
						Calories:{' '}
						<span
							className={`font-semibold ${data.isOverLimit ? 'text-red-400' : 'text-green-400'}`}
						>
							{data.calories} kcal
						</span>
					</p>
					<p className="text-xs text-gray-400 mt-1">
						{data.isOverLimit
							? `🔴 ${(data.calories ?? 0) - dailyLimit} kcal over limit`
							: `✅ ${dailyLimit - (data.calories ?? 0)} kcal under limit`}
					</p>
				</>
			) : (
				<p className="text-gray-400">No data logged</p>
			)}
		</div>
	);
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
	const roundedTdee = Math.round(tdee);

	// 1 kg of body fat = ~7700 calories
	// Weekly deficit needed = targetWeightLossPerWeekKg * 7700 calories
	// Daily deficit = weekly deficit / 7 days
	const dailyDeficit = (targetWeightLossPerWeekKg * 7700) / 7;

	// Daily limit = TDEE - deficit needed
	// Clamp to realistic human calorie limits (1200-3500 kcal)
	const rawDailyLimit = Math.round(roundedTdee - dailyDeficit);
	const dailyLimit = Math.max(1200, Math.min(3500, rawDailyLimit));

	// Calculate displayed deficit from rounded values to ensure consistency
	// (so dailyLimit + deficit = roundedTdee)
	const deficit = roundedTdee - dailyLimit;

	return { dailyLimit, deficit };
}

// Utility function to get the current local date as YYYY-MM-DD string
function getLocalDateString() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function DietConsistencyPanel() {
	const {
		userProfile,
		statsEntryCount,
		dietEntries,
		dietEntryCount,
		isLoading,
		addDietEntry,
		loadAllUserDietEntries,
		loadAllUserStatsEntries,
	} = useUserData();

	const [allDietEntries, setAllDietEntries] = useState<DietEntry[]>([]);
	const [allStatsEntries, setAllStatsEntries] = useState<UserStatsEntry[]>([]);
	const { timeRange } = useTimeframe();
	const [showReminderModal, setShowReminderModal] = useState(false);
	const [reminderMealType, setReminderMealType] = useState<MealType | null>(
		null,
	);
	const [showLogMealModal, setShowLogMealModal] = useState(false);

	// Load all entries for charting (beyond default pagination)
	// Re-run when entry counts change (new entry added/deleted)
	// biome-ignore lint/correctness/useExhaustiveDependencies: dietEntryCount triggers reload when data changes
	useEffect(() => {
		loadAllUserDietEntries().then(setAllDietEntries);
	}, [loadAllUserDietEntries, dietEntryCount]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: statsEntryCount triggers reload when data changes
	useEffect(() => {
		loadAllUserStatsEntries().then(setAllStatsEntries);
	}, [loadAllUserStatsEntries, statsEntryCount]);

	// Log Meal state

	const [mealDate, setMealDate] = useState(getLocalDateString);
	const [mealCalories, setMealCalories] = useState('');
	const [mealType, setMealType] = useState<MealType | null>(null);
	const [caloriesError, setCaloriesError] = useState<string | null>(null);

	// Check which meals are logged for today
	const todaysMeals = useMemo(() => {
		const today = getLocalDateString();
		const todaysEntries = dietEntries.filter((entry) => entry.date === today);
		return {
			breakfast: todaysEntries.some((entry) => entry.mealType === 'breakfast'),
			lunch: todaysEntries.some((entry) => entry.mealType === 'lunch'),
			dinner: todaysEntries.some((entry) => entry.mealType === 'dinner'),
		};
	}, [dietEntries]);

	const { runTour } = useTour();

	// Close reminder modal when tour starts
	useEffect(() => {
		if (runTour) {
			setShowReminderModal(false);
			setReminderMealType(null);
		}
	}, [runTour]);

	// Show time-based meal reminders (only if enabled in settings and not during tour)
	useEffect(() => {
		// Default to true if not set (for backwards compatibility)
		if (userProfile.calorieReminderEnabled === false) return;
		// Don't show reminders during the tour
		if (runTour) return;

		const now = new Date();
		const currentHour = now.getHours();

		// Check dinner first (21:00+), then lunch (13:00+), then breakfast (5:00+)
		// This ensures we show the most relevant reminder
		if (currentHour >= 21 && !todaysMeals.dinner) {
			setReminderMealType('dinner');
			setShowReminderModal(true);
		} else if (currentHour >= 13 && !todaysMeals.lunch) {
			setReminderMealType('lunch');
			setShowReminderModal(true);
		} else if (currentHour >= 5 && !todaysMeals.breakfast) {
			setReminderMealType('breakfast');
			setShowReminderModal(true);
		}
	}, [todaysMeals, userProfile.calorieReminderEnabled, runTour]);

	const openLogMealModal = (preselectedMealType?: MealType) => {
		setMealDate(getLocalDateString());
		setMealCalories('');
		setMealType(preselectedMealType ?? null);
		setCaloriesError(null);
		setShowLogMealModal(true);
	};

	const handleLogMeal = async () => {
		setCaloriesError(null);

		const calories = Number.parseInt(mealCalories, 10);
		if (!mealCalories.trim()) {
			setCaloriesError('Calories is required');
			return;
		}
		if (Number.isNaN(calories) || calories <= 0) {
			setCaloriesError('Calories must be a positive number');
			return;
		}

		await addDietEntry({
			id: crypto.randomUUID(),
			date: mealDate,
			calories,
			mealType: mealType ?? undefined,
		});

		setShowLogMealModal(false);
		setShowReminderModal(false);
		setReminderMealType(null);
	};

	const selectedDays = useMemo(() => {
		const days: DayData[] = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const numDays = getDaysForTimeRange(timeRange);

		for (let i = numDays - 1; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			// Use local date format (YYYY-MM-DD) to match how meals are logged
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			days.push({
				date,
				dateStr: `${year}-${month}-${day}`,
			});
		}
		return days;
	}, [timeRange]);

	// Create a map of diet entries by date
	const dietEntriesMap = useMemo(() => {
		const map = new Map<string, DietEntry>();
		for (const entry of allDietEntries) {
			map.set(entry.date, entry);
		}
		return map;
	}, [allDietEntries]);

	// Calculate streaks based on ALL available data, not filtered by time range
	const streaks = useMemo(() => {
		const latestStats = allStatsEntries.length > 0 ? allStatsEntries[0] : null;
		const currentWeightKg = latestStats?.weightKg;

		const {
			heightCm,
			dateOfBirth,
			sex,
			targetWeightKg,
			targetWeightLossPerWeekKg,
		} = userProfile;

		// Check if we have all the data needed to calculate calorie limit
		if (
			!currentWeightKg ||
			!heightCm ||
			!dateOfBirth ||
			!sex ||
			!targetWeightKg ||
			!targetWeightLossPerWeekKg
		) {
			return { currentStreak: 0, longestStreak: 0 };
		}

		const age = calculateAge(dateOfBirth);
		const { dailyLimit } = calculateDailyCalorieLimit(
			currentWeightKg,
			targetWeightLossPerWeekKg,
			heightCm,
			age,
			sex,
		);

		// Get all diet entries (1 year of data)
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const allDays: DayData[] = [];
		for (let i = 365; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			// Use local date format (YYYY-MM-DD) to match how meals are logged
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			allDays.push({
				date,
				dateStr: `${year}-${month}-${day}`,
			});
		}

		const allChartData = allDays.map((day) => {
			const dietEntry = dietEntriesMap.get(day.dateStr);
			return {
				date: day.date,
				dateStr: day.dateStr,
				calories: dietEntry?.calories ?? null,
			};
		});

		let currentStreak = 0;
		let longestStreak = 0;
		let tempStreak = 0;

		// Go through chart data to calculate longest streak
		for (const day of allChartData) {
			if (day.calories !== null && day.calories <= dailyLimit) {
				tempStreak++;
				longestStreak = Math.max(longestStreak, tempStreak);
			} else {
				tempStreak = 0;
			}
		}

		// Calculate current streak (from today backwards)
		for (let i = allChartData.length - 1; i >= 0; i--) {
			const day = allChartData[i];
			if (day.calories !== null && day.calories <= dailyLimit) {
				currentStreak++;
			} else if (day.calories !== null) {
				break;
			}
		}

		return { currentStreak, longestStreak };
	}, [allStatsEntries, userProfile, dietEntriesMap]);

	// Calculate calorie limit and chart data for selected time range
	const calorieData = useMemo(() => {
		// Get current weight from latest stats entry
		const latestStats = allStatsEntries.length > 0 ? allStatsEntries[0] : null;
		const currentWeightKg = latestStats?.weightKg;

		const {
			heightCm,
			dateOfBirth,
			sex,
			targetWeightKg,
			targetWeightLossPerWeekKg,
		} = userProfile;

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

		// Get today's date for comparison
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

		// Get calorie data for selected days
		const chartData: ChartDataPoint[] = selectedDays.map((day) => {
			const dietEntry = dietEntriesMap.get(day.dateStr);
			const calories = dietEntry?.calories ?? null;
			return {
				dayLabel: `${day.date.getDate()}`,
				date: day.date,
				calories,
				isOverLimit: calories !== null && calories > dailyLimit,
				isToday: day.dateStr === todayStr,
			};
		});

		return {
			dailyLimit,
			deficit,
			chartData,
			currentWeightKg,
			targetWeightKg,
		};
	}, [allStatsEntries, userProfile, selectedDays, dietEntriesMap]);

	if (isLoading) {
		return (
			<Panel title="Diet Consistency" dataTour="diet-consistency">
				<div className="h-64 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (!calorieData) {
		return (
			<Panel title="Diet Consistency" dataTour="diet-consistency">
				<div className="h-64 flex items-center justify-center text-gray-400">
					Set your target weight and target weight loss per week in Settings,
					and add weight measurements to track calorie intake.
				</div>
			</Panel>
		);
	}

	return (
		<>
			<Modal
				isOpen={showReminderModal}
				onClose={() => {
					setShowReminderModal(false);
					setReminderMealType(null);
				}}
				title={`Time to Log Your ${reminderMealType ? reminderMealType.charAt(0).toUpperCase() + reminderMealType.slice(1) : 'Meal'}`}
				primaryAction={{
					label: `Log ${reminderMealType ? reminderMealType.charAt(0).toUpperCase() + reminderMealType.slice(1) : 'Meal'}`,
					onClick: () => openLogMealModal(reminderMealType ?? undefined),
				}}
				secondaryAction={{
					label: 'Skip',
					onClick: () => {
						setShowReminderModal(false);
						setReminderMealType(null);
					},
				}}
			>
				<p>
					{reminderMealType === 'breakfast' &&
						"Good morning! You haven't logged your breakfast yet today. Track your morning meal to stay on top of your nutrition goals."}
					{reminderMealType === 'lunch' &&
						"It's past lunchtime and you haven't logged your lunch yet. Don't forget to track your midday meal!"}
					{reminderMealType === 'dinner' &&
						"Evening reminder: You haven't logged your dinner yet today. Complete your daily food log before bed!"}
					{!reminderMealType &&
						'Tracking your calorie intake consistently helps you reach your fitness goals.'}
				</p>
			</Modal>

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
							htmlFor="diet-panel-meal-date"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Date
						</label>
						<input
							id="diet-panel-meal-date"
							type="date"
							value={mealDate}
							onChange={(e) => setMealDate(e.target.value)}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label
							htmlFor="diet-panel-meal-calories"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Total Calories (kcal)
						</label>
						<input
							id="diet-panel-meal-calories"
							type="number"
							value={mealCalories}
							onChange={(e) => setMealCalories(e.target.value)}
							placeholder="e.g. 2000"
							min="0"
							className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${caloriesError ? 'border-red-500' : 'border-gray-700'}`}
						/>
						{caloriesError && (
							<p className="text-red-500 text-sm mt-1">{caloriesError}</p>
						)}
					</div>
				</div>
			</Modal>

			<Panel title="Diet Consistency" dataTour="diet-consistency">
				<HighlightGroup>
					<Highlight
						value={`${calorieData.dailyLimit} kcal`}
						label="Daily limit"
					/>
					<Highlight
						value={`${Math.abs(calorieData.deficit)} kcal`}
						label={`Daily ${calorieData.deficit >= 0 ? 'deficit' : 'surplus'}`}
					/>
					<Highlight
						value={`${streaks.currentStreak} days`}
						label="Current Streak"
					/>
					<Highlight
						value={`${streaks.longestStreak} days`}
						label="Longest Streak"
					/>
				</HighlightGroup>

				<div className="mt-4 flex flex-wrap gap-3 text-xs">
					<div className="flex items-center gap-1">
						<div className="w-3 h-3 rounded bg-green-500" />
						<span className="text-gray-400">Under limit</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="w-3 h-3 rounded bg-red-500" />
						<span className="text-gray-400">Over limit</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="w-3 h-3 rounded bg-purple-500" />
						<span className="text-gray-400">Today</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="w-6 border-t-2 border-dashed border-yellow-500" />
						<span className="text-gray-400">Daily limit</span>
					</div>
				</div>

				<div className="h-80 min-w-0 w-full mt-4">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart
							data={calorieData.chartData}
							margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
						>
							<XAxis
								dataKey="dayLabel"
								tick={{ fill: '#9ca3af', fontSize: 11 }}
								tickLine={{ stroke: '#4b5563' }}
								axisLine={{ stroke: '#4b5563' }}
								interval={calorieData.chartData.length > 15 ? 2 : 0}
							/>
							<YAxis
								tick={{ fill: '#9ca3af', fontSize: 12 }}
								tickLine={{ stroke: '#4b5563' }}
								axisLine={{ stroke: '#4b5563' }}
								label={{
									value: 'kcal',
									angle: -90,
									position: 'insideLeft',
									fill: '#9ca3af',
									fontSize: 12,
								}}
							/>
							<Tooltip
								content={<CustomTooltip dailyLimit={calorieData.dailyLimit} />}
							/>
							<ReferenceLine
								y={calorieData.dailyLimit}
								stroke="#eab308"
								strokeDasharray="5 5"
								strokeWidth={2}
								label={{
									value: 'Limit',
									position: 'right',
									fill: '#eab308',
									fontSize: 12,
								}}
							/>
							<Bar
								dataKey="calories"
								name="Calories"
								radius={[4, 4, 0, 0]}
								fill="#6b7280"
								// Dynamic fill based on over/under limit
								// biome-ignore lint/suspicious/noExplicitAny: recharts types
								shape={(props: any) => {
									const { x, y, width, height, payload } = props;
									if (payload.calories === null) {
										// No data - show thin gray bar
										return (
											<rect
												x={x}
												y={y + height - 2}
												width={width}
												height={2}
												fill="#374151"
												rx={1}
												ry={1}
											/>
										);
									}
									let fill: string;
									if (payload.isToday) {
										fill = '#a855f7'; // purple-500
									} else if (payload.isOverLimit) {
										fill = '#ef4444'; // red-500
									} else {
										fill = '#22c55e'; // green-500
									}
									return (
										<rect
											x={x}
											y={y}
											width={width}
											height={height}
											fill={fill}
											rx={4}
											ry={4}
										/>
									);
								}}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</Panel>
		</>
	);
}
