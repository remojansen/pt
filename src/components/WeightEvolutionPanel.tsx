import { useEffect, useMemo, useState } from 'react';
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { maleBodyFatData } from '../data/body-fat';
import { useUserData } from '../hooks/useUserData';
import { Button } from './Button';
import { Modal } from './Modal';
import { Panel } from './Panel';

type BMICategory =
	| 'underweight'
	| 'healthy'
	| 'overweight'
	| 'obese'
	| 'extremely-obese';
type BodyFatCategory = 'Lean' | 'Ideal' | 'Average' | 'Above average';

const BMI_COLORS: Record<BMICategory, string> = {
	underweight: '#3b82f6', // blue
	healthy: '#22c55e', // green
	overweight: '#f59e0b', // amber
	obese: '#f97316', // orange
	'extremely-obese': '#ef4444', // red
};

const BODY_FAT_COLORS: Record<BodyFatCategory, string> = {
	Lean: '#06b6d4', // cyan
	Ideal: '#22c55e', // green
	Average: '#f59e0b', // amber
	'Above average': '#ef4444', // red
};

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

function calculateBMI(weightKg: number, heightCm: number): number {
	const heightM = heightCm / 100;
	return weightKg / (heightM * heightM);
}

function getBMICategory(bmi: number): BMICategory {
	if (bmi < 18.5) return 'underweight';
	if (bmi < 25) return 'healthy';
	if (bmi < 30) return 'overweight';
	if (bmi < 35) return 'obese';
	return 'extremely-obese';
}

function getBodyFatCategory(
	percentage: number,
	age: number,
	sex: 'male' | 'female',
): BodyFatCategory {
	// Find the appropriate age bracket
	const ageBrackets = [18, 21, 26, 31, 36, 41, 46, 51, 56];
	let ageKey = ageBrackets[0];
	for (const bracket of ageBrackets) {
		if (age >= bracket) {
			ageKey = bracket;
		}
	}

	// Filter data for the sex and age bracket
	const relevantData = maleBodyFatData.filter(
		(entry) => entry.sex === sex && entry.age === ageKey,
	);

	if (relevantData.length === 0) {
		return 'Average';
	}

	// Find the category based on percentage
	// Sort by percentage to find the closest match
	const sorted = [...relevantData].sort((a, b) => a.percentage - b.percentage);

	for (const entry of sorted) {
		if (percentage <= entry.percentage) {
			return entry.category;
		}
	}

	// If percentage is higher than all entries, return the last category
	return sorted[sorted.length - 1].category;
}

interface ChartDataPoint {
	date: string;
	formattedDate: string;
	weightKg: number;
	bodyFatPercentage: number | null;
	bmiCategory: BMICategory;
	bodyFatCategory: BodyFatCategory | null;
}

interface CustomDotProps {
	cx?: number;
	cy?: number;
	payload?: ChartDataPoint;
	dataKey?: string;
}

function WeightDot({ cx, cy, payload }: CustomDotProps) {
	if (cx === undefined || cy === undefined || !payload) return null;
	const color = BMI_COLORS[payload.bmiCategory];
	return (
		<circle
			cx={cx}
			cy={cy}
			r={6}
			fill={color}
			stroke="#1f2937"
			strokeWidth={2}
		/>
	);
}

function BodyFatDot({ cx, cy, payload }: CustomDotProps) {
	if (
		cx === undefined ||
		cy === undefined ||
		!payload ||
		!payload.bodyFatCategory
	)
		return null;
	const color = BODY_FAT_COLORS[payload.bodyFatCategory];
	return (
		<circle
			cx={cx}
			cy={cy}
			r={6}
			fill={color}
			stroke="#1f2937"
			strokeWidth={2}
		/>
	);
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: Array<{ payload: ChartDataPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;

	const data = payload[0].payload;

	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
			<p className="text-gray-300 text-sm mb-2">{data.formattedDate}</p>
			<p className="text-white">
				Weight:{' '}
				<span style={{ color: BMI_COLORS[data.bmiCategory] }}>
					{data.weightKg.toFixed(1)} kg
				</span>
				<span className="text-gray-400 text-sm ml-2">({data.bmiCategory})</span>
			</p>
			{data.bodyFatPercentage !== null && data.bodyFatCategory && (
				<p className="text-white">
					Body Fat:{' '}
					<span style={{ color: BODY_FAT_COLORS[data.bodyFatCategory] }}>
						{data.bodyFatPercentage.toFixed(1)}%
					</span>
					<span className="text-gray-400 text-sm ml-2">
						({data.bodyFatCategory})
					</span>
				</p>
			)}
		</div>
	);
}

export function WeightEvolutionPanel() {
	const { statsEntries, userProfile, isLoading, addStatsEntry } = useUserData();
	const [showReminderModal, setShowReminderModal] = useState(false);
	const [showLogWeightModal, setShowLogWeightModal] = useState(false);
	const [newWeight, setNewWeight] = useState<string>('');
	const [bodyFatMode, setBodyFatMode] = useState<'unknown' | 'value'>(
		'unknown',
	);
	const [newBodyFat, setNewBodyFat] = useState<string>('');
	const [weightError, setWeightError] = useState<string | null>(null);
	const [bodyFatError, setBodyFatError] = useState<string | null>(null);

	const daysSinceLastStat = useMemo(() => {
		if (statsEntries.length === 0) return null;
		const sortedEntries = [...statsEntries].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);
		const lastStatDate = new Date(sortedEntries[0].date);
		const today = new Date();
		const diffTime = today.getTime() - lastStatDate.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}, [statsEntries]);

	useEffect(() => {
		if (daysSinceLastStat !== null && daysSinceLastStat > 7) {
			setShowReminderModal(true);
		}
	}, [daysSinceLastStat]);

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

		const today = new Date().toISOString().split('T')[0];
		await addStatsEntry({
			id: crypto.randomUUID(),
			date: today,
			weightKg: weight,
			bodyFatPercentage,
		});

		setNewWeight('');
		setNewBodyFat('');
		setBodyFatMode('unknown');
		setShowLogWeightModal(false);
	};

	const openLogWeightModal = () => {
		setNewWeight('');
		setNewBodyFat('');
		setBodyFatMode('unknown');
		setWeightError(null);
		setBodyFatError(null);
		setShowLogWeightModal(true);
	};

	const chartData = useMemo(() => {
		if (!userProfile.heightCm || !userProfile.dateOfBirth || !userProfile.sex) {
			return [];
		}

		const age = calculateAge(userProfile.dateOfBirth);
		const heightCm = userProfile.heightCm;
		const sex = userProfile.sex;

		return statsEntries
			.map((entry) => {
				const bmi = calculateBMI(entry.weightKg, heightCm);
				const bmiCategory = getBMICategory(bmi);
				const bodyFatCategory =
					entry.bodyFatPercentage !== null
						? getBodyFatCategory(entry.bodyFatPercentage, age, sex)
						: null;

				return {
					date: entry.date,
					formattedDate: new Date(entry.date).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					}),
					weightKg: entry.weightKg,
					bodyFatPercentage: entry.bodyFatPercentage,
					bmiCategory,
					bodyFatCategory,
				};
			})
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	}, [statsEntries, userProfile]);

	const weightAxisMax = useMemo(() => {
		if (chartData.length === 0) return 100;
		const maxWeight = Math.max(...chartData.map((d) => d.weightKg));
		return maxWeight + 10;
	}, [chartData]);

	const weightStats = useMemo(() => {
		if (chartData.length === 0) {
			return {
				kgsLost90Days: null,
				kgsToTarget: null,
				currentWeight: null,
				weeksToTarget: null,
				currentStreak: 0,
				longestStreak: 0,
			};
		}

		// Get current weight (most recent entry)
		const sortedData = [...chartData].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);
		const currentWeight = sortedData[0].weightKg;

		// Calculate kgs lost in last 90 days
		const today = new Date();
		const ninetyDaysAgo = new Date(today);
		ninetyDaysAgo.setDate(today.getDate() - 90);

		const entriesLast90Days = chartData.filter(
			(d) => new Date(d.date) >= ninetyDaysAgo,
		);

		let kgsLost90Days: number | null = null;
		if (entriesLast90Days.length >= 2) {
			const oldestIn90Days = entriesLast90Days.reduce((oldest, entry) =>
				new Date(entry.date) < new Date(oldest.date) ? entry : oldest,
			);
			kgsLost90Days = oldestIn90Days.weightKg - currentWeight;
		}

		// Calculate kgs to target
		const kgsToTarget =
			userProfile.targetWeightKg !== null
				? currentWeight - userProfile.targetWeightKg
				: null;

		// Calculate weeks to target
		const weeksToTarget =
			kgsToTarget !== null && userProfile.targetWeightLossPerWeekKg !== null && userProfile.targetWeightLossPerWeekKg > 0
				? Math.ceil(kgsToTarget / userProfile.targetWeightLossPerWeekKg)
				: null;

		// Calculate streaks
		// A day is "on target" if:
		// - Weight is at or below target, OR
		// - Weight is above target but lower than weight 7 days prior
		const sortedByDateAsc = [...chartData].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		const isOnTarget = (index: number): boolean => {
			const entry = sortedByDateAsc[index];
			const targetWeight = userProfile.targetWeightKg;

			// If at or below target, it's on target
			if (targetWeight !== null && entry.weightKg <= targetWeight) {
				return true;
			}

			// Check if weight is lower than 7 days prior
			const entryDate = new Date(entry.date);
			const sevenDaysAgo = new Date(entryDate);
			sevenDaysAgo.setDate(entryDate.getDate() - 7);

			// Find the closest entry on or before 7 days ago
			let priorEntry: ChartDataPoint | null = null;
			for (let i = index - 1; i >= 0; i--) {
				const candidateDate = new Date(sortedByDateAsc[i].date);
				if (candidateDate <= sevenDaysAgo) {
					priorEntry = sortedByDateAsc[i];
					break;
				}
			}

			if (priorEntry && entry.weightKg < priorEntry.weightKg) {
				return true;
			}

			return false;
		};

		// Calculate longest streak (from beginning)
		let longestStreak = 0;
		let tempStreak = 0;
		for (let i = 0; i < sortedByDateAsc.length; i++) {
			if (isOnTarget(i)) {
				tempStreak++;
				longestStreak = Math.max(longestStreak, tempStreak);
			} else {
				tempStreak = 0;
			}
		}

		// Calculate current streak (from most recent backwards)
		let currentStreak = 0;
		for (let i = sortedByDateAsc.length - 1; i >= 0; i--) {
			if (isOnTarget(i)) {
				currentStreak++;
			} else {
				break;
			}
		}

		return {
			kgsLost90Days,
			kgsToTarget,
			currentWeight,
			weeksToTarget,
			currentStreak,
			longestStreak,
		};
	}, [chartData, userProfile.targetWeightKg, userProfile.targetWeightLossPerWeekKg]);

	if (isLoading) {
		return (
			<Panel title="Weight Evolution">
				<div className="h-64 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (!userProfile.heightCm || !userProfile.dateOfBirth || !userProfile.sex) {
		return (
			<Panel title="Weight Evolution">
				<div className="h-64 flex items-center justify-center text-gray-400">
					Complete your profile to see stats chart
				</div>
			</Panel>
		);
	}

	if (chartData.length === 0) {
		return (
			<>
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
								htmlFor="newWeightEmpty"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Weight (kg)
							</label>
							<input
								type="number"
								id="newWeightEmpty"
								value={newWeight}
								onChange={(e) => setNewWeight(e.target.value)}
								className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 ${weightError ? 'border-red-500' : 'border-gray-600'}`}
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
										className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 ${bodyFatError ? 'border-red-500' : 'border-gray-600'}`}
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
				<Panel
					title="Weight Evolution"
					cta={{ cta: 'Log Weight', onCta: openLogWeightModal }}
				>
					<div className="h-64 flex items-center justify-center text-gray-400">
						No stats entries yet
					</div>
				</Panel>
			</>
		);
	}

	const hasBodyFatData = chartData.some((d) => d.bodyFatPercentage !== null);

	return (
		<>
			<Modal
				isOpen={showReminderModal}
				onClose={() => setShowReminderModal(false)}
				title="Time to Track Your Progress"
				primaryAction={{
					label: 'Submit',
					onClick: () => setShowReminderModal(false),
				}}
				secondaryAction={{
					label: 'Skip',
					onClick: () => setShowReminderModal(false),
				}}
			>
				<p>
					It has been more than 7 days since your last weight was registered. It
					is recommended to frequently track your progress to adjust the
					training program effectively.
				</p>
			</Modal>
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
							htmlFor="newWeight"
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							Weight (kg)
						</label>
						<input
							type="number"
							id="newWeight"
							value={newWeight}
							onChange={(e) => setNewWeight(e.target.value)}
							className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 ${weightError ? 'border-red-500' : 'border-gray-600'}`}
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
									className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 ${bodyFatError ? 'border-red-500' : 'border-gray-600'}`}
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
			<Panel
				title="Weight Evolution"
				cta={{ cta: 'Log Weight', onCta: openLogWeightModal }}
			>
				<div className="flex flex-wrap gap-6 mb-6">
					<div className="flex items-center gap-3">
						<div className="text-3xl">📉</div>
						<div>
							<div className="text-2xl font-bold text-white">
								{weightStats.kgsLost90Days !== null
									? `${weightStats.kgsLost90Days >= 0 ? '' : '+'}${Math.abs(weightStats.kgsLost90Days).toFixed(1)} kg`
									: '—'}
							</div>
							<div className="text-xs text-gray-400">Lost (90 days)</div>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="text-3xl">🎯</div>
						<div>
							<div className="text-2xl font-bold text-white">
								{weightStats.kgsToTarget !== null
									? `${weightStats.kgsToTarget.toFixed(1)} kg`
									: '—'}
							</div>
							<div className="text-xs text-gray-400">To Target</div>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="text-3xl">📅</div>
						<div>
							<div className="text-2xl font-bold text-white">
								{weightStats.weeksToTarget !== null && weightStats.weeksToTarget > 0
									? `${weightStats.weeksToTarget}`
									: '—'}
							</div>
							<div className="text-xs text-gray-400">Weeks to Target</div>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="text-3xl">🔥</div>
						<div>
							<div className="text-2xl font-bold text-white">
								{weightStats.currentStreak}
							</div>
							<div className="text-xs text-gray-400">Current Streak</div>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="text-3xl">🏆</div>
						<div>
							<div className="text-2xl font-bold text-white">
								{weightStats.longestStreak}
							</div>
							<div className="text-xs text-gray-400">Longest Streak</div>
						</div>
					</div>
				</div>
				<div className="h-80 min-w-0 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={chartData}
							margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
							<XAxis
								dataKey="formattedDate"
								tick={{ fill: '#9ca3af', fontSize: 12 }}
								tickLine={{ stroke: '#4b5563' }}
								axisLine={{ stroke: '#4b5563' }}
							/>
							<YAxis
								yAxisId="weight"
								orientation="left"
								tick={{ fill: '#9ca3af', fontSize: 12 }}
								tickLine={{ stroke: '#4b5563' }}
								axisLine={{ stroke: '#4b5563' }}
								domain={[45, weightAxisMax]}
								label={{
									value: 'Weight (kg)',
									angle: -90,
									position: 'insideLeft',
									fill: '#9ca3af',
									fontSize: 12,
								}}
							/>
							<YAxis
								yAxisId="bodyFat"
								orientation="right"
								tick={{ fill: '#9ca3af', fontSize: 12 }}
								tickLine={{ stroke: '#4b5563' }}
								axisLine={{ stroke: '#4b5563' }}
								domain={[0, 50]}
								label={{
									value: 'Body Fat (%)',
									angle: 90,
									position: 'insideRight',
									fill: '#9ca3af',
									fontSize: 12,
								}}
							/>
							<Tooltip content={<CustomTooltip />} />
							{userProfile.targetWeightKg !== null && (
								<ReferenceLine
									yAxisId="weight"
									y={userProfile.targetWeightKg}
									stroke="#22c55e"
									strokeWidth={2}
									strokeDasharray="8 4"
									label={{
										value: `Target: ${userProfile.targetWeightKg} kg`,
										fill: '#22c55e',
										fontSize: 12,
										position: 'right',
									}}
								/>
							)}
							<Line
								yAxisId="weight"
								type="monotone"
								dataKey="weightKg"
								stroke="#6b7280"
								strokeWidth={2}
								dot={<WeightDot />}
								activeDot={{ r: 8, stroke: '#f3f4f6', strokeWidth: 2 }}
								name="Weight"
							/>
							{hasBodyFatData && (
								<Line
									yAxisId="bodyFat"
									type="monotone"
									dataKey="bodyFatPercentage"
									stroke="#6b7280"
									strokeWidth={2}
									strokeDasharray="5 5"
									dot={<BodyFatDot />}
									activeDot={{ r: 8, stroke: '#f3f4f6', strokeWidth: 2 }}
									name="Body Fat"
									connectNulls
								/>
							)}
						</LineChart>
					</ResponsiveContainer>
				</div>
			</Panel>
		</>
	);
}
