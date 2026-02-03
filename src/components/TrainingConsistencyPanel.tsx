import { useMemo } from 'react';
import {
	ActivityType,
	type ActivityTypeKey,
	type Schedule,
	useUserData,
} from '../hooks/useUserData';
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

export function TrainingConsistencyPanel() {
	const { userProfile, activities, isLoading } =
		useUserData();

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
				dayKey: getDayKey(date),
			});
		}
		return days;
	}, []);

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
		let currentStreak = 0;
		let longestStreak = 0;
		let tempStreak = 0;
		let streakBroken = false;

		// Iterate from most recent to oldest
		for (let i = last30Days.length - 1; i >= 0; i--) {
			const day = last30Days[i];
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

		return { currentStreak, longestStreak };
	}, [last30Days, userProfile.schedule, activitiesMap]);

	const last30DaysStats = useMemo(() => {
		const dateStrSet = new Set(last30Days.map((d) => d.dateStr));
		const last30DaysActivities = activities.filter((a) =>
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

		const distanceRunKm = last30DaysActivities
			.filter((a) => runTypes.includes(a.type))
			.reduce((sum, a) => sum + ('distanceInKm' in a ? a.distanceInKm : 0), 0);

		const distanceCycledKm = last30DaysActivities
			.filter((a) => cycleTypes.includes(a.type))
			.reduce((sum, a) => sum + ('distanceInKm' in a ? a.distanceInKm : 0), 0);

		const exerciseMinutes = Math.round(
			last30DaysActivities.reduce((sum, a) => sum + a.durationInSeconds, 0) /
				60,
		);

		return { distanceRunKm, distanceCycledKm, exerciseMinutes };
	}, [activities, last30Days]);

	const activityStats = useMemo(() => {
		return scheduledActivityTypes.map((activityType) => {
			let scheduled = 0;
			let completed = 0;

			for (const day of last30Days) {
				const isScheduled = userProfile.schedule[day.dayKey].includes(activityType);
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
	}, [scheduledActivityTypes, last30Days, userProfile.schedule, activitiesMap]);

	if (isLoading) {
		return (
			<Panel title="Training Consistency">
				<div className="h-64 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (scheduledActivityTypes.length === 0) {
		return (
			<Panel title="Training Consistency">
				<div className="h-64 flex items-center justify-center text-gray-400">
					Set up your training schedule in Settings to track consistency
				</div>
			</Panel>
		);
	}

	return (
		<Panel title="Training Consistency">
			<div className="flex flex-wrap gap-6 mb-6">
				<div className="flex items-center gap-3">
					<div className="text-3xl">🔥</div>
					<div>
						<div className="text-2xl font-bold text-white">
							{streaks.currentStreak}
						</div>
						<div className="text-xs text-gray-400">Current Streak</div>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-3xl">🏆</div>
					<div>
						<div className="text-2xl font-bold text-white">
							{streaks.longestStreak}
						</div>
						<div className="text-xs text-gray-400">Longest Streak</div>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-3xl">🏃</div>
					<div>
						<div className="text-2xl font-bold text-white">
							{last30DaysStats.distanceRunKm.toFixed(1)} km
						</div>
						<div className="text-xs text-gray-400">Distance Run </div>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-3xl">🚴</div>
					<div>
						<div className="text-2xl font-bold text-white">
							{last30DaysStats.distanceCycledKm.toFixed(1)} km
						</div>
						<div className="text-xs text-gray-400">Distance Cycled </div>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-3xl">⏱️</div>
					<div>
						<div className="text-2xl font-bold text-white">
							{last30DaysStats.exerciseMinutes} min
						</div>
						<div className="text-xs text-gray-400">Exercise Minutes </div>
					</div>
				</div>
			</div>
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
							<tr key={stat.activityType} className="border-b border-gray-700/50">
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
