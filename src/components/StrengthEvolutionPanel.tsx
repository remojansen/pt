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
import { Button } from './Button';
import { Highlight } from './Highlight';
import { HighlightGroup } from './HighlightGroup';
import { Panel } from './Panel';

type TimeRange = '1month' | '3months' | '6months' | '1year' | 'all';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
	'1month': '1 Month',
	'3months': '3 Months',
	'6months': '1/2 Year',
	'1year': '1 Year',
	all: 'All',
};

function getDaysForTimeRange(range: TimeRange): number {
	switch (range) {
		case '1month':
			return 30;
		case '3months':
			return 90;
		case '6months':
			return 180;
		case '1year':
			return 365;
		case 'all':
			return 10000; // Large number to get all data
	}
}

const REPETITION_LABELS: Record<RepetitionKey, string> = {
	[RepetitionType.BicepCurl]: 'Bicep Curl',
	[RepetitionType.CableTricepPushdown]: 'Cable Tricep Pushdown',
	[RepetitionType.FrontRaise]: 'Front Raise',
	[RepetitionType.LateralRaise]: 'Lateral Raise',
	[RepetitionType.ShoulderPress]: 'Shoulder Press',
};

const REPETITION_COLORS: Record<RepetitionKey, string> = {
	[RepetitionType.BicepCurl]: '#3b82f6', // blue
	[RepetitionType.CableTricepPushdown]: '#22c55e', // green
	[RepetitionType.FrontRaise]: '#f59e0b', // amber
	[RepetitionType.LateralRaise]: '#a855f7', // purple
	[RepetitionType.ShoulderPress]: '#ec4899', // pink
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
	const [isCalculating, setIsCalculating] = useState(false);

	const chartData = useMemo(() => {
		setIsCalculating(true);
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
		const sortedData = data.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
		setIsCalculating(false);
		return sortedData;
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

	const timeRangeButtons = (
		<div className="flex gap-2">
			{(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
				<Button
					key={range}
					variant={selectedRange === range ? 'primary' : 'secondary'}
					color="blue"
					onClick={() => setSelectedRange(range)}
					disabled={isLoading || isCalculating}
				>
					{TIME_RANGE_LABELS[range]}
				</Button>
			))}
		</div>
	);

	if (isLoading) {
		return (
			<Panel title="Strength Evolution" headerActions={timeRangeButtons}>
				<div className="h-64 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (isCalculating) {
		return (
			<Panel title="Strength Evolution" headerActions={timeRangeButtons}>
				<div className="h-64 flex items-center justify-center text-gray-400">
					Calculating...
				</div>
			</Panel>
		);
	}

	if (chartData.length === 0) {
		return (
			<Panel title="Strength Evolution" headerActions={timeRangeButtons}>
				<div className="h-64 flex items-center justify-center text-gray-400">
					No strength training activities yet
				</div>
			</Panel>
		);
	}

	return (
		<Panel title="Strength Evolution" headerActions={timeRangeButtons}>
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
