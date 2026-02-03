import { useMemo, useState } from 'react';
import {
	ActivityType,
	type ActivityTypeKey,
	type Schedule,
	useUserData,
} from '../hooks/useUserData';
import { Button } from './Button';
import { Highlight } from './Highlight';
import { HighlightGroup } from './HighlightGroup';
import { Panel } from './Panel';

const DAYS_OF_WEEK = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
] as const;

const ACTIVITY_LABELS: Record<ActivityTypeKey, string> = {
	[ActivityType.RoadRun]: 'Road Run',
	[ActivityType.TreadmillRun]: 'Treadmill',
	[ActivityType.PoolSwim]: 'Pool Swim',
	[ActivityType.SeaSwim]: 'Sea Swim',
	[ActivityType.RoadCycle]: 'Road Cycle',
	[ActivityType.IndoorCycle]: 'Indoor Cycle',
	[ActivityType.StrengthTrainingLegs]: 'Legs',
	[ActivityType.StrengthTrainingArms]: 'Arms',
	[ActivityType.StrengthTrainingCore]: 'Core',
	[ActivityType.StrengthTrainingShoulders]: 'Shoulders',
	[ActivityType.StrengthTrainingBack]: 'Back',
	[ActivityType.StrengthTrainingChest]: 'Chest',
};

function getDayKey(date: Date): keyof Schedule {
	const dayIndex = date.getDay();
	return DAYS_OF_WEEK[dayIndex] as keyof Schedule;
}

interface DayData {
	date: Date;
	dateStr: string;
	dayKey: keyof Schedule;
}

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
			return 1000; // Large number to get all data
	}
}

export function TrainingConsistencyPanel() {
	const { userProfile, activities, isLoading } = useUserData();
	const [selectedRange, setSelectedRange] = useState<TimeRange>('1month');
	const [isCalculating, setIsCalculating] = useState(false);

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

	const activitiesMap = useMemo(() => {
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

	const streaks = useMemo(() => {
		setIsCalculating(true);
		let currentStreak = 0;
		let longestStreak = 0;
		let tempStreak = 0;
		let streakBroken = false;

		// Iterate from most recent to oldest
		for (let i = selectedDays.length - 1; i >= 0; i--) {
			const day = selectedDays[i];
			const scheduledForDay = userProfile.schedule[day.dayKey];

			// Skip days with no scheduled activities (rest days don't break streak)
			if (scheduledForDay.length === 0) {
				continue;
			}

			const completedActivities = activitiesMap.get(day.dateStr);
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

		setIsCalculating(false);
		return { currentStreak, longestStreak };
	}, [selectedDays, userProfile.schedule, activitiesMap]);

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

	const activityStats = useMemo(() => {
		return scheduledActivityTypes.map((activityType) => {
			let scheduled = 0;
			let completed = 0;

			for (const day of selectedDays) {
				const isScheduled =
					userProfile.schedule[day.dayKey].includes(activityType);
				if (isScheduled) {
					scheduled++;
					const completedActivities = activitiesMap.get(day.dateStr);
					if (completedActivities?.has(activityType)) {
						completed++;
					}
				}
			}

			const missed = scheduled - completed;
			const consistency = scheduled > 0 ? (completed / scheduled) * 100 : 0;

			return {
				activityType,
				label: ACTIVITY_LABELS[activityType],
				completed,
				missed,
				consistency,
			};
		});
	}, [
		scheduledActivityTypes,
		selectedDays,
		userProfile.schedule,
		activitiesMap,
	]);

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
			<Panel title="Training Consistency" headerActions={timeRangeButtons}>
				<div className="h-64 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (scheduledActivityTypes.length === 0) {
		return (
			<Panel title="Training Consistency" headerActions={timeRangeButtons}>
				<div className="h-64 flex items-center justify-center text-gray-400">
					Set up your training schedule in Settings to track consistency
				</div>
			</Panel>
		);
	}

	if (isCalculating) {
		return (
			<Panel title="Training Consistency" headerActions={timeRangeButtons}>
				<div className="h-64 flex items-center justify-center text-gray-400">
					Calculating...
				</div>
			</Panel>
		);
	}

	return (
		<Panel title="Training Consistency" headerActions={timeRangeButtons}>
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
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead>
						<tr className="border-b border-gray-700">
							<th className="text-left text-sm font-medium text-gray-400 pb-3 pr-4">
								Activity
							</th>
							<th className="text-center text-sm font-medium text-gray-400 pb-3 px-4">
								Completed
							</th>
							<th className="text-center text-sm font-medium text-gray-400 pb-3 px-4">
								Missed
							</th>
							<th className="text-right text-sm font-medium text-gray-400 pb-3 pl-4">
								Consistency
							</th>
						</tr>
					</thead>
					<tbody>
						{activityStats.map((stat) => (
							<tr
								key={stat.activityType}
								className="border-b border-gray-700/50"
							>
								<td className="py-3 pr-4 text-sm text-gray-300">
									{stat.label}
								</td>
								<td className="py-3 px-4 text-center text-sm text-green-400">
									{stat.completed}
								</td>
								<td className="py-3 px-4 text-center text-sm text-red-400">
									{stat.missed}
								</td>
								<td className="py-3 pl-4 text-right text-sm font-medium text-white">
									{stat.consistency.toFixed(1)}%
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Panel>
	);
}
