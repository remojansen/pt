import { useMemo, useState } from 'react';
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import {
	ActivityType,
	type RepetitionKey,
	RepetitionType,
	type Strength,
	useUserData,
} from '../hooks/useUserData';
import { Highlight } from './Highlight';
import { HighlightGroup } from './HighlightGroup';
import { Panel } from './Panel';
import {
	getDaysForTimeRange,
	TimeframeFilter,
	type TimeRange,
} from './TimeframeFilter';

const REPETITION_LABELS: Record<RepetitionKey, string> = {
	[RepetitionType.BicepCurl]: 'Bicep Curl',
	[RepetitionType.CableTricepPushdown]: 'Cable Tricep Pushdown',
	[RepetitionType.FrontRaise]: 'Front Raise',
	[RepetitionType.LateralRaise]: 'Lateral Raise',
	[RepetitionType.ShoulderPress]: 'Shoulder Press',
	[RepetitionType.BackExtension]: 'Back Extension',
	[RepetitionType.CableLatPulldown]: 'Cable Lat Pulldown',
	[RepetitionType.CableRow]: 'Cable Row',
	[RepetitionType.Shrugs]: 'Shrugs',
	[RepetitionType.DumbbellBenchPress]: 'Dumbbell Bench Press',
	[RepetitionType.Flys]: 'Flys',
	[RepetitionType.BarbellSquats]: 'Barbell Squats',
	[RepetitionType.CableHipAdduction]: 'Cable Hip Adduction',
	[RepetitionType.LegExtension]: 'Leg Extension',
	[RepetitionType.LyingLegCurl]: 'Lying Leg Curl',
	[RepetitionType.PullUps]: 'Pull Ups',
	[RepetitionType.CableCrunch]: 'Cable Crunch',
	[RepetitionType.Crunches]: 'Crunches',
	[RepetitionType.HangingKneeRaise]: 'Hanging Knee Raise',
	[RepetitionType.ReverseCrunches]: 'Reverse Crunches',
	[RepetitionType.SitUps]: 'Sit Ups',
	[RepetitionType.InclineDumbbellFly]: 'Incline Dumbbell Fly',
	[RepetitionType.InclineDumbbellPress]: 'Incline Dumbbell Press',
	[RepetitionType.ConcentrationCurls]: 'Concentration Curls',
	[RepetitionType.HammerCurls]: 'Hammer Curls',
	[RepetitionType.CableDonkeyKickback]: 'Cable Donkey Kickback',
	[RepetitionType.BandCalfRaise]: 'Band Calf Raise',
	[RepetitionType.CableWristCurls]: 'Cable Wrist Curls',
};

const REPETITION_COLORS: Record<RepetitionKey, string> = {
	[RepetitionType.BicepCurl]: '#3b82f6', // blue
	[RepetitionType.CableTricepPushdown]: '#22c55e', // green
	[RepetitionType.FrontRaise]: '#f59e0b', // amber
	[RepetitionType.LateralRaise]: '#a855f7', // purple
	[RepetitionType.ShoulderPress]: '#ec4899', // pink
	[RepetitionType.BackExtension]: '#14b8a6', // teal
	[RepetitionType.CableLatPulldown]: '#6366f1', // indigo
	[RepetitionType.CableRow]: '#84cc16', // lime
	[RepetitionType.Shrugs]: '#f97316', // orange
	[RepetitionType.DumbbellBenchPress]: '#ef4444', // red
	[RepetitionType.Flys]: '#8b5cf6', // violet
	[RepetitionType.BarbellSquats]: '#06b6d4', // cyan
	[RepetitionType.CableHipAdduction]: '#d946ef', // fuchsia
	[RepetitionType.LegExtension]: '#eab308', // yellow
	[RepetitionType.LyingLegCurl]: '#10b981', // emerald
	[RepetitionType.PullUps]: '#0ea5e9', // sky
	[RepetitionType.CableCrunch]: '#f43f5e', // rose
	[RepetitionType.Crunches]: '#7c3aed', // purple-600
	[RepetitionType.HangingKneeRaise]: '#0d9488', // teal-600
	[RepetitionType.ReverseCrunches]: '#c026d3', // fuchsia-600
	[RepetitionType.SitUps]: '#ea580c', // orange-600
	[RepetitionType.InclineDumbbellFly]: '#fb7185', // rose-400
	[RepetitionType.InclineDumbbellPress]: '#2dd4bf', // teal-400
	[RepetitionType.ConcentrationCurls]: '#a78bfa', // violet-400
	[RepetitionType.HammerCurls]: '#fbbf24', // amber-400
	[RepetitionType.CableDonkeyKickback]: '#34d399', // emerald-400
	[RepetitionType.BandCalfRaise]: '#f472b6', // pink-400
	[RepetitionType.CableWristCurls]: '#60a5fa', // blue-400
};

type StrengthActivityType =
	| typeof ActivityType.StrengthTrainingLegs
	| typeof ActivityType.StrengthTrainingArms
	| typeof ActivityType.StrengthTrainingCore
	| typeof ActivityType.StrengthTrainingShoulders
	| typeof ActivityType.StrengthTrainingBack
	| typeof ActivityType.StrengthTrainingChest;

const MUSCLE_GROUP_LABELS: Record<StrengthActivityType, string> = {
	[ActivityType.StrengthTrainingLegs]: 'Legs',
	[ActivityType.StrengthTrainingArms]: 'Arms',
	[ActivityType.StrengthTrainingCore]: 'Core',
	[ActivityType.StrengthTrainingChest]: 'Chest',
	[ActivityType.StrengthTrainingShoulders]: 'Shoulders',
	[ActivityType.StrengthTrainingBack]: 'Back',
};

interface MuscleGroupGain {
	type: StrengthActivityType;
	label: string;
	gainPercent: number;
	firstWeight: number | null;
	lastWeight: number | null;
}

interface ChartDataPoint {
	date: string;
	formattedDate: string;
	[key: string]: number | string | null;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: Array<{
		payload: ChartDataPoint;
		dataKey: string;
		color: string;
		name: string;
		value: number | null;
	}>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;

	const data = payload[0].payload;

	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
			<p className="text-gray-300 text-sm mb-2">{data.formattedDate}</p>
			{Object.values(RepetitionType).map((repType) => {
				const weight = data[repType];
				if (weight === null || weight === undefined) return null;
				return (
					<p key={repType} className="text-white">
						{REPETITION_LABELS[repType]}:{' '}
						<span style={{ color: REPETITION_COLORS[repType] }}>
							{weight} kg
						</span>
					</p>
				);
			})}
		</div>
	);
}

function isStrengthActivity(activity: { type: string }): activity is Strength {
	return activity.type.startsWith('StrengthTraining');
}

export function StrengthEvolutionPanel() {
	const { activities, isLoading } = useUserData();
	const [selectedRange, setSelectedRange] = useState<TimeRange>('1month');

	const chartData = useMemo(() => {
		// Filter by time range
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const numDays = getDaysForTimeRange(selectedRange);
		const cutoffDate = new Date(today);
		cutoffDate.setDate(today.getDate() - numDays);

		// Filter strength activities
		const strengthActivities = activities.filter(
			(a) => isStrengthActivity(a) && new Date(a.date) >= cutoffDate,
		);

		if (strengthActivities.length === 0) return [];

		// Group max weight by date and repetition type
		const dataByDate = new Map<string, Record<RepetitionKey, number[]>>();

		for (const activity of strengthActivities) {
			const dateKey = activity.date;

			if (!dataByDate.has(dateKey)) {
				const emptyRecord = {} as Record<RepetitionKey, number[]>;
				for (const repType of Object.values(RepetitionType)) {
					emptyRecord[repType] = [];
				}
				dataByDate.set(dateKey, emptyRecord);
			}

			const dateData = dataByDate.get(dateKey);
			if (!dateData) continue;

			if ('repetitions' in activity) {
				for (const rep of activity.repetitions) {
					if (rep.weightKg > 0) {
						dateData[rep.type as RepetitionKey].push(rep.weightKg);
					}
				}
			}
		}

		// Convert to chart data - use max weight for each repetition type per day
		const data: ChartDataPoint[] = [];
		for (const [date, weights] of dataByDate) {
			const point: ChartDataPoint = {
				date,
				formattedDate: new Date(date).toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
				}),
			};

			for (const repType of Object.values(RepetitionType)) {
				const repWeights = weights[repType];
				point[repType] = repWeights.length > 0 ? Math.max(...repWeights) : null;
			}

			// Only include date if it has at least one weight value
			const hasData = Object.values(RepetitionType).some(
				(repType) => point[repType] !== null,
			);
			if (hasData) {
				data.push(point);
			}
		}

		// Sort by date ascending
		return data.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
	}, [activities, selectedRange]);

	// Determine which repetition types have data
	const activeRepetitionTypes = useMemo(() => {
		return Object.values(RepetitionType).filter((repType) =>
			chartData.some((point) => point[repType] !== null),
		);
	}, [chartData]);

	// Calculate muscle group gains (first day vs last day)
	const muscleGroupGains = useMemo((): MuscleGroupGain[] => {
		const strengthActivities = activities.filter(isStrengthActivity);

		const strengthTypes: StrengthActivityType[] = [
			ActivityType.StrengthTrainingLegs,
			ActivityType.StrengthTrainingArms,
			ActivityType.StrengthTrainingCore,
			ActivityType.StrengthTrainingChest,
			ActivityType.StrengthTrainingShoulders,
			ActivityType.StrengthTrainingBack,
		];

		return strengthTypes.map((muscleType) => {
			// Get all activities for this muscle group
			const muscleActivities = strengthActivities
				.filter((a) => a.type === muscleType)
				.sort(
					(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
				);

			if (muscleActivities.length === 0) {
				return {
					type: muscleType,
					label: MUSCLE_GROUP_LABELS[muscleType],
					gainPercent: 0,
					firstWeight: null,
					lastWeight: null,
				};
			}

			// Get max weight from first day
			const firstDayActivities = muscleActivities.filter(
				(a) => a.date === muscleActivities[0].date,
			);
			const firstWeights = firstDayActivities.flatMap((a) =>
				a.repetitions.filter((r) => r.weightKg > 0).map((r) => r.weightKg),
			);
			const firstWeight =
				firstWeights.length > 0 ? Math.max(...firstWeights) : null;

			// Get max weight from last day
			const lastDayActivities = muscleActivities.filter(
				(a) => a.date === muscleActivities[muscleActivities.length - 1].date,
			);
			const lastWeights = lastDayActivities.flatMap((a) =>
				a.repetitions.filter((r) => r.weightKg > 0).map((r) => r.weightKg),
			);
			const lastWeight =
				lastWeights.length > 0 ? Math.max(...lastWeights) : null;

			// Calculate percentage gain (default to 0 if not enough data)
			let gainPercent = 0;
			if (firstWeight !== null && lastWeight !== null && firstWeight > 0) {
				gainPercent = ((lastWeight - firstWeight) / firstWeight) * 100;
			}

			return {
				type: muscleType,
				label: MUSCLE_GROUP_LABELS[muscleType],
				gainPercent,
				firstWeight,
				lastWeight,
			};
		});
	}, [activities]);

	const timeRangeFilter = (
		<TimeframeFilter
			value={selectedRange}
			onChange={setSelectedRange}
			disabled={isLoading}
		/>
	);

	if (isLoading) {
		return (
			<Panel
				title="Strength Evolution"
				headerActions={timeRangeFilter}
				dataTour="strength-evolution"
			>
				<div className="h-64 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (chartData.length === 0) {
		return (
			<Panel
				title="Strength Evolution"
				headerActions={timeRangeFilter}
				dataTour="strength-evolution"
			>
				<div className="h-64 flex items-center justify-center text-gray-400">
					No strength training activities yet
				</div>
			</Panel>
		);
	}

	return (
		<Panel
			title="Strength Evolution"
			headerActions={timeRangeFilter}
			dataTour="strength-evolution"
		>
			<HighlightGroup>
				{muscleGroupGains.map((gain) => (
					<Highlight
						key={gain.type}
						value={`${gain.gainPercent >= 0 ? '+' : '-'}${gain.gainPercent.toFixed(1)}%`}
						label={`${gain.label} Gain`}
					/>
				))}
			</HighlightGroup>
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
							tick={{ fill: '#9ca3af', fontSize: 12 }}
							tickLine={{ stroke: '#4b5563' }}
							axisLine={{ stroke: '#4b5563' }}
							label={{
								value: 'Weight (kg)',
								angle: -90,
								position: 'insideLeft',
								fill: '#9ca3af',
								fontSize: 12,
							}}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Legend
							wrapperStyle={{ color: '#9ca3af' }}
							formatter={(value) => (
								<span className="text-gray-300">{value}</span>
							)}
						/>
						{activeRepetitionTypes.map((repType) => (
							<Line
								key={repType}
								type="monotone"
								dataKey={repType}
								stroke={REPETITION_COLORS[repType]}
								strokeWidth={2}
								dot={{ fill: REPETITION_COLORS[repType], r: 4 }}
								activeDot={{ r: 8, stroke: '#f3f4f6', strokeWidth: 2 }}
								name={REPETITION_LABELS[repType]}
								connectNulls
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</div>
		</Panel>
	);
}
