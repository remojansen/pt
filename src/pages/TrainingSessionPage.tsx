import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Panel } from '../components/Panel';
import { type EffortType, effortZones } from '../data/effort';
import {
	calculateVolumeRecommendation,
	type VolumeRecommendation,
} from '../data/volume';
import {
	type Activity,
	ActivityType,
	type ActivityTypeKey,
	type Cardio,
	getRepetitionsForActivityType,
	type Repetition,
	type RepetitionKey,
	RepetitionType,
	type Schedule,
	type Strength,
	type UserProfile,
	useUserData,
} from '../hooks/useUserData';

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
	[ActivityType.TreadmillRun]: 'Treadmill Run',
	[ActivityType.PoolSwim]: 'Pool Swim',
	[ActivityType.SeaSwim]: 'Sea Swim',
	[ActivityType.RoadCycle]: 'Road Cycle',
	[ActivityType.IndoorCycle]: 'Indoor Cycle',
	[ActivityType.StrengthTrainingLegs]: 'Strength Training - Legs',
	[ActivityType.StrengthTrainingArms]: 'Strength Training - Arms',
	[ActivityType.StrengthTrainingCore]: 'Strength Training - Core',
	[ActivityType.StrengthTrainingShoulders]: 'Strength Training - Shoulders',
	[ActivityType.StrengthTrainingBack]: 'Strength Training - Back',
	[ActivityType.StrengthTrainingChest]: 'Strength Training - Chest',
};

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

const REPETITION_IMAGES: Record<RepetitionKey, string> = {
	[RepetitionType.BicepCurl]: `${import.meta.env.BASE_URL}img/repetition-type/BicepCurl.png`,
	[RepetitionType.CableTricepPushdown]: `${import.meta.env.BASE_URL}img/repetition-type/CableTricepPushdown.png`,
	[RepetitionType.FrontRaise]: `${import.meta.env.BASE_URL}img/repetition-type/FrontRaise.png`,
	[RepetitionType.LateralRaise]: `${import.meta.env.BASE_URL}img/repetition-type/LateralRaise.png`,
	[RepetitionType.ShoulderPress]: `${import.meta.env.BASE_URL}img/repetition-type/ShoulderPress.png`,
	[RepetitionType.BackExtension]: `${import.meta.env.BASE_URL}img/repetition-type/BackExtension.png`,
	[RepetitionType.CableLatPulldown]: `${import.meta.env.BASE_URL}img/repetition-type/CableLatPulldown.png`,
	[RepetitionType.CableRow]: `${import.meta.env.BASE_URL}img/repetition-type/CableRow.png`,
	[RepetitionType.Shrugs]: `${import.meta.env.BASE_URL}img/repetition-type/Shrugs.png`,
	[RepetitionType.DumbbellBenchPress]: `${import.meta.env.BASE_URL}img/repetition-type/DumbbellBenchPress.png`,
	[RepetitionType.Flys]: `${import.meta.env.BASE_URL}img/repetition-type/Flys.png`,
	[RepetitionType.BarbellSquats]: `${import.meta.env.BASE_URL}img/repetition-type/BarbellSquats.png`,
	[RepetitionType.CableHipAdduction]: `${import.meta.env.BASE_URL}img/repetition-type/CableHipAdduction.png`,
	[RepetitionType.LegExtension]: `${import.meta.env.BASE_URL}img/repetition-type/LegExtension.png`,
	[RepetitionType.LyingLegCurl]: `${import.meta.env.BASE_URL}img/repetition-type/LyingLegCurl.png`,
	[RepetitionType.PullUps]: `${import.meta.env.BASE_URL}img/repetition-type/PullUps.png`,
	[RepetitionType.CableCrunch]: `${import.meta.env.BASE_URL}img/repetition-type/CableCrunch.png`,
	[RepetitionType.Crunches]: `${import.meta.env.BASE_URL}img/repetition-type/Crunches.png`,
	[RepetitionType.HangingKneeRaise]: `${import.meta.env.BASE_URL}img/repetition-type/HangingKneeRaise.png`,
	[RepetitionType.ReverseCrunches]: `${import.meta.env.BASE_URL}img/repetition-type/ReverseCrunches.png`,
	[RepetitionType.SitUps]: `${import.meta.env.BASE_URL}img/repetition-type/SitUps.png`,
	[RepetitionType.InclineDumbbellFly]: `${import.meta.env.BASE_URL}img/repetition-type/InclineDumbbellFly.png`,
	[RepetitionType.InclineDumbbellPress]: `${import.meta.env.BASE_URL}img/repetition-type/InclineDumbbellPress.png`,
	[RepetitionType.ConcentrationCurls]: `${import.meta.env.BASE_URL}img/repetition-type/ConcentrationCurls.png`,
	[RepetitionType.HammerCurls]: `${import.meta.env.BASE_URL}img/repetition-type/HammerCurls.png`,
	[RepetitionType.CableDonkeyKickback]: `${import.meta.env.BASE_URL}img/repetition-type/CableDonkeyKickback.png`,
	[RepetitionType.BandCalfRaise]: `${import.meta.env.BASE_URL}img/repetition-type/BandCalfRaise.png`,
	[RepetitionType.CableWristCurls]: `${import.meta.env.BASE_URL}img/repetition-type/CableWristCurls.png`,
};

const CARDIO_TYPES: Set<ActivityTypeKey> = new Set([
	ActivityType.RoadRun,
	ActivityType.TreadmillRun,
	ActivityType.PoolSwim,
	ActivityType.SeaSwim,
	ActivityType.RoadCycle,
	ActivityType.IndoorCycle,
]);

const EFFORT_TYPES: EffortType[] = [
	'WarmUp',
	'FatBurn',
	'Aerobic',
	'Anaerobic',
	'VO2Max',
];

const EFFORT_LABELS: Record<EffortType, string> = {
	VO2Max: 'VO2 Max',
	Anaerobic: 'Anaerobic',
	Aerobic: 'Aerobic',
	FatBurn: 'Fat Burn',
	WarmUp: 'Warm Up',
};

function getAgeFromDOB(dob: string | null): number {
	if (!dob) return 30; // default age
	const birthDate = new Date(dob);
	const today = new Date();
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

function getClosestAge(age: number): number {
	const availableAges = [20, 25, 30, 35, 40, 45, 50, 55, 65, 70];
	return availableAges.reduce((prev, curr) =>
		Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev,
	);
}

function getEffortRangeLabel(effort: EffortType, dob: string | null): string {
	const age = getAgeFromDOB(dob);
	const closestAge = getClosestAge(age);
	const zone = effortZones.find(
		(z) => z.age === closestAge && z.effort === effort,
	);
	if (zone) {
		return `${EFFORT_LABELS[effort]} (${zone.heartRateMin}-${zone.heartRateMax})`;
	}
	return EFFORT_LABELS[effort];
}

function getTodayKey(): keyof Schedule {
	const dayIndex = new Date().getDay();
	return DAYS_OF_WEEK[dayIndex] as keyof Schedule;
}

function getTodayDateStr(): string {
	return new Date().toISOString().split('T')[0];
}

function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface CardioFormData {
	distanceKm: string;
	durationMinutes: string;
	durationSeconds: string;
	effort: EffortType | null;
}

interface CardioActivityPanelProps {
	activityType: ActivityTypeKey;
	onSave: (activity: Cardio) => void;
	isCompleted: boolean;
	userProfile: UserProfile;
	volumeRecommendation: VolumeRecommendation | null;
}

function CardioActivityPanel({
	activityType,
	onSave,
	isCompleted,
	userProfile,
	volumeRecommendation,
}: CardioActivityPanelProps) {
	const [formData, setFormData] = useState<CardioFormData>({
		distanceKm: '',
		durationMinutes: '',
		durationSeconds: '',
		effort: null,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const distanceInKm = parseFloat(formData.distanceKm) || 0;
		const durationInSeconds =
			(parseInt(formData.durationMinutes, 10) || 0) * 60 +
			(parseInt(formData.durationSeconds, 10) || 0);

		const activity: Cardio = {
			id: generateId(),
			date: getTodayDateStr(),
			type: activityType as Cardio['type'],
			distanceInKm,
			durationInSeconds,
			...(formData.effort && { effort: formData.effort }),
		};

		onSave(activity);
	};

	if (isCompleted) {
		return (
			<Panel title={ACTIVITY_LABELS[activityType]}>
				<div className="text-center py-4">
					<div className="text-4xl mb-2">✅</div>
					<p className="text-green-400 font-medium">Activity completed!</p>
				</div>
			</Panel>
		);
	}

	const isRunning =
		activityType === ActivityType.RoadRun ||
		activityType === ActivityType.TreadmillRun;

	return (
		<Panel title={ACTIVITY_LABELS[activityType]}>
			{isRunning && volumeRecommendation && (
				<div className="mb-4 p-4 bg-purple-900/30 border border-purple-700 rounded-lg">
					<h4 className="text-purple-300 font-medium mb-2 flex items-center gap-2">
						<span>📊</span> Volume Recommendation
					</h4>
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<span className="text-gray-400">Weekly target:</span>
							<span className="text-white font-semibold ml-2">
								{volumeRecommendation.weeklyVolumeKm} km
							</span>
						</div>
						<div>
							<span className="text-gray-400">Long run:</span>
							<span className="text-white font-semibold ml-2">
								{volumeRecommendation.longRunKm} km
							</span>
						</div>
						<div>
							<span className="text-gray-400">Last week:</span>
							<span className="text-white font-semibold ml-2">
								{volumeRecommendation.lastWeekVolumeKm} km
							</span>
						</div>
						<div>
							<span className="text-gray-400">Weeks to race:</span>
							<span className="text-white font-semibold ml-2">
								{volumeRecommendation.weeksUntilRace}
							</span>
						</div>
					</div>
					{volumeRecommendation.isTaperWeek && (
						<p className="mt-2 text-yellow-400 text-sm">
							⚡ Taper week - reduce volume to arrive fresh!
						</p>
					)}
					{volumeRecommendation.isCutbackWeek && (
						<p className="mt-2 text-blue-400 text-sm">
							🔄 Cutback week - recovery before next build phase
						</p>
					)}
					{volumeRecommendation.currentWeek ===
						volumeRecommendation.peakWeek && (
						<p className="mt-2 text-green-400 text-sm">
							🏔️ Peak week - your highest volume week!
						</p>
					)}
				</div>
			)}
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="distance"
						className="block text-sm font-medium text-gray-300 mb-1"
					>
						Distance (km)
					</label>
					<input
						id="distance"
						type="number"
						step="0.01"
						min="0"
						value={formData.distanceKm}
						onChange={(e) =>
							setFormData({ ...formData, distanceKm: e.target.value })
						}
						className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
						placeholder="e.g., 5.5"
						required
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="minutes"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Minutes
						</label>
						<input
							id="minutes"
							type="number"
							min="0"
							value={formData.durationMinutes}
							onChange={(e) =>
								setFormData({ ...formData, durationMinutes: e.target.value })
							}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
							placeholder="e.g., 30"
							required
						/>
					</div>
					<div>
						<label
							htmlFor="seconds"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Seconds
						</label>
						<input
							id="seconds"
							type="number"
							min="0"
							max="59"
							value={formData.durationSeconds}
							onChange={(e) =>
								setFormData({ ...formData, durationSeconds: e.target.value })
							}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
							placeholder="e.g., 45"
						/>
					</div>
				</div>{' '}
				<div>
					<span className="block text-sm font-medium text-gray-300 mb-2">
						Effort Level
					</span>
					<div className="flex gap-2 flex-wrap">
						{EFFORT_TYPES.map((effort) => (
							<button
								key={effort}
								type="button"
								onClick={() => setFormData({ ...formData, effort })}
								className={`px-4 py-2 rounded-lg font-medium transition-colors ${
									formData.effort === effort
										? 'bg-purple-600 text-white'
										: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
								}`}
							>
								{getEffortRangeLabel(effort, userProfile.dateOfBirth)}
							</button>
						))}
					</div>
				</div>{' '}
				<Button type="submit" variant="primary" color="purple" fullWidth>
					Save Activity
				</Button>
			</form>
		</Panel>
	);
}

interface StrengthActivityPanelProps {
	activityType: ActivityTypeKey;
	onSave: (activity: Strength) => void;
	isCompleted: boolean;
	userProfile: UserProfile;
}

function StrengthActivityPanel({
	activityType,
	onSave,
	isCompleted,
	userProfile,
}: StrengthActivityPanelProps) {
	const repetitionTypes = getRepetitionsForActivityType(activityType);
	const reps = userProfile.strengthTrainingRepetitions ?? 12;
	const sets = userProfile.strengthTrainingSets ?? 4;

	const [durationMinutes, setDurationMinutes] = useState('');
	const [weights, setWeights] = useState<Record<RepetitionKey, string>>(
		() =>
			Object.fromEntries(repetitionTypes.map((type) => [type, ''])) as Record<
				RepetitionKey,
				string
			>,
	);
	const [completedSeries, setCompletedSeries] = useState<
		Record<RepetitionKey, Set<number>>
	>(
		() =>
			Object.fromEntries(
				repetitionTypes.map((type) => [type, new Set<number>()]),
			) as Record<RepetitionKey, Set<number>>,
	);
	const [helpModalOpen, setHelpModalOpen] = useState(false);
	const [selectedRepetition, setSelectedRepetition] =
		useState<RepetitionKey | null>(null);

	const openHelp = (repType: RepetitionKey) => {
		setSelectedRepetition(repType);
		setHelpModalOpen(true);
	};

	const closeHelp = () => {
		setHelpModalOpen(false);
		setSelectedRepetition(null);
	};

	const toggleSeries = (repType: RepetitionKey, seriesIndex: number) => {
		setCompletedSeries((prev) => {
			const newSet = new Set(prev[repType]);
			if (newSet.has(seriesIndex)) {
				newSet.delete(seriesIndex);
			} else {
				newSet.add(seriesIndex);
			}
			return { ...prev, [repType]: newSet };
		});
	};

	const allSeriesCompleted = repetitionTypes.every(
		(type) => completedSeries[type]?.size === sets,
	);

	const allWeightsEntered = repetitionTypes.every(
		(type) => weights[type] && parseFloat(weights[type]) > 0,
	);

	const canSave =
		allSeriesCompleted && allWeightsEntered && durationMinutes !== '';

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSave) return;

		const durationInSeconds = (parseInt(durationMinutes, 10) || 0) * 60;

		const parsedRepetitions: Repetition[] = repetitionTypes.map((type) => ({
			type,
			weightKg: parseFloat(weights[type]) || 0,
			count: reps,
			series: sets,
		}));

		const activity: Strength = {
			id: generateId(),
			date: getTodayDateStr(),
			type: activityType as Strength['type'],
			durationInSeconds,
			repetitions: parsedRepetitions,
		};

		onSave(activity);
	};

	if (isCompleted) {
		return (
			<Panel title={ACTIVITY_LABELS[activityType]}>
				<div className="text-center py-4">
					<div className="text-4xl mb-2">✅</div>
					<p className="text-green-400 font-medium">Activity completed!</p>
				</div>
			</Panel>
		);
	}

	if (repetitionTypes.length === 0) {
		return (
			<Panel title={ACTIVITY_LABELS[activityType]}>
				<div className="text-center py-4">
					<p className="text-gray-400">
						No exercises configured for this activity type yet.
					</p>
				</div>
			</Panel>
		);
	}

	return (
		<Panel title={ACTIVITY_LABELS[activityType]}>
			<form onSubmit={handleSubmit} className="space-y-6">
				<div>
					<label
						htmlFor="strength-duration"
						className="block text-sm font-medium text-gray-300 mb-1"
					>
						Total Duration (minutes)
					</label>
					<input
						id="strength-duration"
						type="number"
						min="0"
						value={durationMinutes}
						onChange={(e) => setDurationMinutes(e.target.value)}
						className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
						placeholder="e.g., 45"
						required
					/>
				</div>

				{repetitionTypes.map((repType) => (
					<div key={repType} className="border border-gray-800 rounded-lg p-4">
						<div className="flex items-center justify-between mb-3">
							<h4 className="text-white font-medium">
								{REPETITION_LABELS[repType]}
							</h4>
							<Button
								variant="ghost"
								color="purple"
								size="sm"
								onClick={() => openHelp(repType)}
							>
								Help
							</Button>
						</div>
						<div className="mb-3">
							<label
								htmlFor={`weight-${repType}`}
								className="block text-xs font-medium text-gray-400 mb-1"
							>
								Weight (kg)
							</label>
							<input
								id={`weight-${repType}`}
								type="number"
								step="0.5"
								min="0"
								value={weights[repType] || ''}
								onChange={(e) =>
									setWeights((prev) => ({ ...prev, [repType]: e.target.value }))
								}
								className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
								placeholder="10"
							/>
						</div>
						<div>
							<span className="block text-xs font-medium text-gray-400 mb-2">
								{sets} Series ({reps} reps each)
							</span>
							<div className="flex gap-2 flex-wrap">
								{Array.from({ length: sets }, (_, i) => (
									<button
										key={`${repType}-${i}`}
										type="button"
										onClick={() => toggleSeries(repType, i)}
										className={`px-4 py-2 rounded-lg font-medium transition-colors ${
											completedSeries[repType]?.has(i)
												? 'bg-green-600 text-white'
												: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
										}`}
									>
										{reps}
									</button>
								))}
							</div>
							<span className="block text-xs text-gray-500 mt-1">
								{completedSeries[repType]?.size || 0} / {sets} completed
							</span>
						</div>
					</div>
				))}

				<Button
					type="submit"
					variant="primary"
					color="purple"
					fullWidth
					disabled={!canSave}
				>
					{canSave ? 'Save Activity' : 'Complete all series to save'}
				</Button>
			</form>
			{selectedRepetition && (
				<Modal
					isOpen={helpModalOpen}
					onClose={closeHelp}
					title={REPETITION_LABELS[selectedRepetition]}
					size="xl"
				>
					<img
						src={REPETITION_IMAGES[selectedRepetition]}
						alt={REPETITION_LABELS[selectedRepetition]}
						className="w-full rounded-lg"
					/>
				</Modal>
			)}
		</Panel>
	);
}

export function TrainingSessionPage() {
	const navigate = useNavigate();
	const { userProfile, activities, addActivity } = useUserData();

	const volumeRecommendation = useMemo(() => {
		if (!userProfile.raceGoal || !userProfile.raceDate) return null;
		return calculateVolumeRecommendation(
			new Date(),
			userProfile.raceGoal,
			userProfile.raceDate,
			activities,
			userProfile.raceTimeGoal,
		);
	}, [
		userProfile.raceGoal,
		userProfile.raceDate,
		userProfile.raceTimeGoal,
		activities,
	]);

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

	const handleSaveActivity = async (activity: Activity) => {
		await addActivity(activity);
	};

	const allCompleted = scheduledActivities.every((activity) =>
		completedActivities.has(activity),
	);

	return (
		<div className="min-h-screen bg-gray-950 py-8 px-4">
			<div className="max-w-3xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold text-white">
						Today's Training Session
					</h1>
					<Button variant="ghost" color="gray" onClick={() => navigate('/')}>
						← Back to Home
					</Button>
				</div>

				{scheduledActivities.length === 0 ? (
					<Panel title="No Training Scheduled">
						<div className="text-center py-6">
							<div className="text-4xl mb-4">🎉</div>
							<p className="text-gray-300">
								No training scheduled for today. Enjoy your rest day!
							</p>
						</div>
					</Panel>
				) : allCompleted ? (
					<Panel title="Session Complete">
						<div className="text-center py-6">
							<div className="text-5xl mb-4">🏆</div>
							<h2 className="text-xl font-semibold text-green-400 mb-2">
								Congratulations!
							</h2>
							<p className="text-gray-300 mb-4">
								You've completed all activities for today!
							</p>
							<Button
								variant="primary"
								color="purple"
								onClick={() => navigate('/')}
							>
								Return Home
							</Button>
						</div>
					</Panel>
				) : (
					<div className="space-y-6">
						{scheduledActivities.map((activityType) => {
							const isCompleted = completedActivities.has(activityType);
							const isCardio = CARDIO_TYPES.has(activityType);

							if (isCardio) {
								return (
									<CardioActivityPanel
										key={activityType}
										activityType={activityType}
										onSave={handleSaveActivity}
										isCompleted={isCompleted}
										userProfile={userProfile}
										volumeRecommendation={volumeRecommendation}
									/>
								);
							}

							return (
								<StrengthActivityPanel
									key={activityType}
									activityType={activityType}
									onSave={handleSaveActivity}
									isCompleted={isCompleted}
									userProfile={userProfile}
								/>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
