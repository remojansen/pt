import { useMemo, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import {
	type Activity,
	ActivityType,
	type ActivityTypeKey,
	type Schedule,
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

const DAYS_OF_WEEK = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
] as const;

function getDayKey(date: Date): keyof Schedule {
	const dayIndex = date.getDay();
	return DAYS_OF_WEEK[dayIndex] as keyof Schedule;
}

interface DayData {
	date: Date;
	dateStr: string;
	dayKey: keyof Schedule;
}

interface ChartDataPoint {
	date: string;
	formattedDate: string;
	minutes: number;
	allCompleted: boolean;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: Array<{
		payload: ChartDataPoint;
	}>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;

	const data = payload[0].payload;

	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
			<p className="text-gray-300 text-sm mb-2">{data.formattedDate}</p>
			<p className="text-white">
				Exercise: <span className="text-purple-400">{data.minutes} min</span>
			</p>
			<p className="text-white">
				Status:{' '}
				<span className={data.allCompleted ? 'text-green-400' : 'text-red-400'}>
					{data.allCompleted ? 'Plan completed' : 'Plan incomplete'}
				</span>
			</p>
		</div>
	);
}

export function TrainingConsistencyPanel() {
	const { userProfile, activities, isLoading } = useUserData();
	const [selectedRange, setSelectedRange] = useState<TimeRange>('1month');

	const selectedDays = useMemo(() => {
		const days: DayData[] = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const numDays = getDaysForTimeRange(selectedRange);

		for (let i = numDays - 1; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			days.push({
				date,
				dateStr: date.toISOString().split('T')[0],
				dayKey: getDayKey(date),
			});
		}
		return days;
	}, [selectedRange]);

	// Map: dateStr -> array of activities for that day
	const activitiesMap = useMemo(() => {
		const map = new Map<string, Activity[]>();
		for (const activity of activities) {
			const dateKey = activity.date;
			if (!map.has(dateKey)) {
				map.set(dateKey, []);
			}
			map.get(dateKey)?.push(activity);
		}
		return map;
	}, [activities]);

	// Map: dateStr -> set of completed activity types
	const completedTypesMap = useMemo(() => {
		const map = new Map<string, Set<ActivityTypeKey>>();
		for (const activity of activities) {
			const dateKey = activity.date;
			if (!map.has(dateKey)) {
				map.set(dateKey, new Set());
			}
			map.get(dateKey)?.add(activity.type);
		}
		return map;
	}, [activities]);

	const scheduledActivityTypes = useMemo(() => {
		const types = new Set<ActivityTypeKey>();
		const schedule = userProfile.schedule;
		for (const day of Object.values(schedule)) {
			for (const activity of day) {
				types.add(activity);
			}
		}
		return Array.from(types);
	}, [userProfile.schedule]);

	// Calculate streaks based on ALL available data, not filtered by time range
	const streaks = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const allDays: DayData[] = [];
		for (let i = 365; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			allDays.push({
				date,
				dateStr: date.toISOString().split('T')[0],
				dayKey: getDayKey(date),
			});
		}

		let currentStreak = 0;
		let longestStreak = 0;
		let tempStreak = 0;
		let streakBroken = false;

		for (let i = allDays.length - 1; i >= 0; i--) {
			const day = allDays[i];
			const scheduledForDay = userProfile.schedule[day.dayKey];

			if (scheduledForDay.length === 0) {
				continue;
			}

			const completedActivities = completedTypesMap.get(day.dateStr);
			const allCompleted =
				completedActivities &&
				scheduledForDay.every((activity) => completedActivities.has(activity));

			if (allCompleted) {
				tempStreak++;
				if (!streakBroken) {
					currentStreak = tempStreak;
				}
				longestStreak = Math.max(longestStreak, tempStreak);
			} else {
				streakBroken = true;
				tempStreak = 0;
			}
		}

		return { currentStreak, longestStreak };
	}, [userProfile.schedule, completedTypesMap]);

	const selectedDaysStats = useMemo(() => {
		const dateStrSet = new Set(selectedDays.map((d) => d.dateStr));
		const selectedDaysActivities = activities.filter((a) =>
			dateStrSet.has(a.date),
		);

		const runTypes: ActivityTypeKey[] = [
			ActivityType.RoadRun,
			ActivityType.TreadmillRun,
		];
		const cycleTypes: ActivityTypeKey[] = [
			ActivityType.RoadCycle,
			ActivityType.IndoorCycle,
		];

		const distanceRunKm = selectedDaysActivities
			.filter((a) => runTypes.includes(a.type))
			.reduce((sum, a) => sum + ('distanceInKm' in a ? a.distanceInKm : 0), 0);

		const distanceCycledKm = selectedDaysActivities
			.filter((a) => cycleTypes.includes(a.type))
			.reduce((sum, a) => sum + ('distanceInKm' in a ? a.distanceInKm : 0), 0);

		const exerciseMinutes = Math.round(
			selectedDaysActivities.reduce((sum, a) => sum + a.durationInSeconds, 0) /
				60,
		);

		return { distanceRunKm, distanceCycledKm, exerciseMinutes };
	}, [activities, selectedDays]);

	// Build chart data: minutes per day with completion status
	const chartData = useMemo(() => {
		return selectedDays.map((day) => {
			const dayActivities = activitiesMap.get(day.dateStr) || [];
			const totalMinutes = Math.round(
				dayActivities.reduce((sum, a) => sum + a.durationInSeconds, 0) / 60,
			);

			const scheduledForDay = userProfile.schedule[day.dayKey];
			const completedActivities = completedTypesMap.get(day.dateStr);

			// If no activities scheduled, consider it "completed" (rest day)
			// If activities scheduled, check if all were done
			const allCompleted =
				scheduledForDay.length === 0 ||
				(completedActivities !== undefined &&
					scheduledForDay.every((activity) =>
						completedActivities.has(activity),
					));

			return {
				date: day.dateStr,
				formattedDate: day.date.toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
				}),
				minutes: totalMinutes,
				allCompleted,
			};
		});
	}, [selectedDays, activitiesMap, completedTypesMap, userProfile.schedule]);

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
				title="Training Consistency"
				headerActions={timeRangeFilter}
				dataTour="training-consistency"
			>
				<div className="h-64 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (scheduledActivityTypes.length === 0) {
		return (
			<Panel
				title="Training Consistency"
				headerActions={timeRangeFilter}
				dataTour="training-consistency"
			>
				<div className="h-64 flex items-center justify-center text-gray-400">
					Set up your training schedule in Settings to track consistency
				</div>
			</Panel>
		);
	}

	return (
		<Panel
			title="Training Consistency"
			headerActions={timeRangeFilter}
			dataTour="training-consistency"
		>
			<HighlightGroup>
				<Highlight value={streaks.currentStreak} label="Current Streak" />
				<Highlight value={streaks.longestStreak} label="Longest Streak" />
				<Highlight
					value={`${selectedDaysStats.distanceRunKm.toFixed(1)} km`}
					label="Distance Run"
				/>
				<Highlight
					value={`${selectedDaysStats.distanceCycledKm.toFixed(1)} km`}
					label="Distance Cycled"
				/>
				<Highlight
					value={`${selectedDaysStats.exerciseMinutes} min`}
					label="Exercise Minutes"
				/>
			</HighlightGroup>
			<div className="h-80 min-w-0 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={chartData}
						margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
						<XAxis
							dataKey="formattedDate"
							tick={{ fill: '#9ca3af', fontSize: 12 }}
							tickLine={{ stroke: '#4b5563' }}
							axisLine={{ stroke: '#4b5563' }}
							interval="preserveStartEnd"
						/>
						<YAxis
							tick={{ fill: '#9ca3af', fontSize: 12 }}
							tickLine={{ stroke: '#4b5563' }}
							axisLine={{ stroke: '#4b5563' }}
							label={{
								value: 'Minutes',
								angle: -90,
								position: 'insideLeft',
								fill: '#9ca3af',
								fontSize: 12,
							}}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
							{chartData.map((entry) => (
								<Cell
									key={entry.date}
									fill={entry.allCompleted ? '#22c55e' : '#ef4444'}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>
			<div className="flex justify-center gap-6 mt-4 text-sm">
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded bg-green-500" />
					<span className="text-gray-400">Plan completed</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 rounded bg-red-500" />
					<span className="text-gray-400">Plan incomplete</span>
				</div>
			</div>
		</Panel>
	);
}
