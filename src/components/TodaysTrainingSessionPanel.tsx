import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	ActivityType,
	type ActivityTypeKey,
	type Schedule,
	useUserData,
} from '../hooks/useUserData';
import { Button } from './Button';
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

function getTodayKey(): keyof Schedule {
	const dayIndex = new Date().getDay();
	return DAYS_OF_WEEK[dayIndex] as keyof Schedule;
}

function getTodayDateStr(): string {
	return new Date().toISOString().split('T')[0];
}

export function TodaysTrainingSessionPanel() {
	const navigate = useNavigate();
	const { userProfile, activities, isLoading } = useUserData();

	const todayKey = getTodayKey();
	const todayDateStr = getTodayDateStr();

	const scheduledActivities = useMemo(() => {
		return userProfile.schedule[todayKey];
	}, [userProfile.schedule, todayKey]);

	const completedActivities = useMemo(() => {
		const todaysActivities = activities.filter(
			(activity) => activity.date === todayDateStr,
		);
		return new Set(todaysActivities.map((a) => a.type));
	}, [activities, todayDateStr]);

	const isSessionComplete = useMemo(() => {
		if (scheduledActivities.length === 0) return true;
		return scheduledActivities.every((activity) =>
			completedActivities.has(activity),
		);
	}, [scheduledActivities, completedActivities]);

	const remainingActivities = useMemo(() => {
		return scheduledActivities.filter(
			(activity) => !completedActivities.has(activity),
		);
	}, [scheduledActivities, completedActivities]);

	const handleStartTraining = () => {
		navigate('/training-session');
	};

	if (isLoading) {
		return (
			<Panel title="Today's Training" dataTour="todays-training">
				<div className="h-32 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (scheduledActivities.length === 0) {
		return (
			<Panel title="Today's Training" dataTour="todays-training">
				<div className="text-center py-6">
					<div className="text-4xl mb-4">🎉</div>
					<p className="text-gray-300 text-lg">
						No training scheduled for today. Enjoy your rest day!
					</p>
				</div>
			</Panel>
		);
	}

	return (
		<Panel title="Today's Training" dataTour="todays-training">
			<div className="text-center py-4">
				{isSessionComplete ? (
					<>
						<div className="text-5xl mb-4">🏆</div>
						<h3 className="text-xl font-semibold text-green-400 mb-2">
							Congratulations!
						</h3>
						<p className="text-gray-300">
							You have completed today's training session.
						</p>
						<div className="mt-4 flex flex-wrap justify-center gap-2">
							{scheduledActivities.map((activity) => (
								<span
									key={activity}
									className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm"
								>
									{ACTIVITY_LABELS[activity]} ✓
								</span>
							))}
						</div>
					</>
				) : (
					<>
						<div className="text-5xl mb-4">💪</div>
						<h3 className="text-xl font-semibold text-white mb-2">
							Are you ready to start today's session?
						</h3>
						<p className="text-gray-400 mb-4">
							{remainingActivities.length === scheduledActivities.length
								? `You have ${scheduledActivities.length} ${scheduledActivities.length === 1 ? 'activity' : 'activities'} scheduled for today.`
								: `${completedActivities.size} of ${scheduledActivities.length} activities completed. Keep going!`}
						</p>
						<div className="mb-6 flex flex-wrap justify-center gap-2">
							{scheduledActivities.map((activity) => {
								const isCompleted = completedActivities.has(activity);
								return (
									<span
										key={activity}
										className={`px-3 py-1 rounded-full text-sm ${
											isCompleted
												? 'bg-green-600/20 text-green-400'
												: 'bg-gray-800 text-gray-300'
										}`}
									>
										{ACTIVITY_LABELS[activity]} {isCompleted && '✓'}
									</span>
								);
							})}
						</div>
						<Button
							variant="primary"
							color="purple"
							size="lg"
							onClick={handleStartTraining}
						>
							Start Training Now
						</Button>
					</>
				)}
			</div>
		</Panel>
	);
}
