

// Configuration
const START_DATE = new Date('2025-08-04'); // 6 months ago from Feb 4, 2026
const END_DATE = new Date();
const STARTING_WEIGHT = 98;
const CURRENT_WEIGHT = 69;
const STARTING_BODY_FAT = 20;
const CURRENT_BODY_FAT = 15;

// User profile
const userProfile = {
	name: 'John Doe',
	heightCm: 180,
	dateOfBirth: '1990-02-15', // 36 years old
	sex: 'male',
	targetWeightKg: 68,
	targetWeightLossPerWeekKg: 0.5,
	strengthTrainingRepetitions: 12,
	strengthTrainingSets: 3,
	raceGoal: 'FullMarathon',
	raceTimeGoal: '03:30:00',
	raceDate: '2026-04-15',
	schedule: {
		monday: ['RoadRun', 'StrengthTrainingLegs'],
		tuesday: ['RoadRun'],
		wednesday: ['StrengthTrainingChest', 'StrengthTrainingBack'],
		thursday: ['RoadRun'],
		friday: ['StrengthTrainingArms', 'StrengthTrainingShoulders'],
		saturday: ['RoadRun'],
		sunday: ['RoadRun'],
	},
	calorieReminderEnabled: true,
	weightReminderEnabled: true,
};

// Types
type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
type EffortLevel = 'easy' | 'moderate' | 'hard' | 'race';
type StrengthActivityType = 'StrengthTrainingLegs' | 'StrengthTrainingArms' | 'StrengthTrainingChest' | 'StrengthTrainingBack' | 'StrengthTrainingShoulders' | 'StrengthTrainingCore';

interface Exercise {
	type: string;
	baseWeight: number;
}

// Helper functions
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

function getDayOfWeek(date: Date): DayOfWeek {
	const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	return days[date.getDay()];
}

// Linear interpolation with some noise
function interpolate(start: number, end: number, progress: number, noiseAmount = 0): number {
	const base = start + (end - start) * progress;
	const noise = (Math.random() - 0.5) * 2 * noiseAmount;
	return base + noise;
}

// Calculate pace in seconds per km based on progress (improving over time)
function calculatePace(progress: number, effort: EffortLevel): number {
	// Starting pace: ~6:30/km (390 sec), ending pace: ~5:00/km (300 sec) for easy runs
	const basePaces: Record<EffortLevel, { start: number; end: number }> = {
		easy: { start: 390, end: 320 },
		moderate: { start: 360, end: 290 },
		hard: { start: 330, end: 270 },
		race: { start: 310, end: 260 },
	};
	const paceRange = basePaces[effort] || basePaces.easy;
	return interpolate(paceRange.start, paceRange.end, progress, 10);
}

// Generate strength training repetitions
function generateRepetitions(activityType: StrengthActivityType, progress: number) {
	const exercisesByType: Record<StrengthActivityType, Exercise[]> = {
		StrengthTrainingLegs: [
			{ type: 'BarbellSquats', baseWeight: 40 },
			{ type: 'LegExtension', baseWeight: 30 },
			{ type: 'LyingLegCurl', baseWeight: 25 },
			{ type: 'CableHipAdduction', baseWeight: 20 },
		],
		StrengthTrainingArms: [
			{ type: 'BicepCurl', baseWeight: 10 },
			{ type: 'CableTricepPushdown', baseWeight: 25 },
			{ type: 'HammerCurls', baseWeight: 10 },
		],
		StrengthTrainingChest: [
			{ type: 'DumbbellBenchPress', baseWeight: 20 },
			{ type: 'Flys', baseWeight: 12 },
			{ type: 'InclineDumbbellPress', baseWeight: 18 },
		],
		StrengthTrainingBack: [
			{ type: 'CableLatPulldown', baseWeight: 45 },
			{ type: 'CableRow', baseWeight: 40 },
			{ type: 'BackExtension', baseWeight: 10 },
		],
		StrengthTrainingShoulders: [
			{ type: 'ShoulderPress', baseWeight: 12 },
			{ type: 'LateralRaise', baseWeight: 8 },
			{ type: 'FrontRaise', baseWeight: 8 },
		],
		StrengthTrainingCore: [
			{ type: 'CableCrunch', baseWeight: 30 },
			{ type: 'HangingKneeRaise', baseWeight: 0 },
			{ type: 'Crunches', baseWeight: 0 },
		],
	};

	const exercises: Exercise[] = exercisesByType[activityType] || [];
	return exercises.map((ex: Exercise) => ({
		type: ex.type,
		count: 12,
		series: 3,
		// Weight increases by 20-40% over 6 months
		weightKg: Math.round(ex.baseWeight * (1 + progress * 0.3) * 10) / 10,
	}));
}

// Generate activities
function generateActivities() {
	const activities: Array<{
		id: string;
		date: string;
		type: string;
		distanceInKm?: number;
		durationInSeconds: number;
		effort?: EffortLevel;
		repetitions?: Array<{ type: string; count: number; series: number; weightKg: number }>;
	}> = [];
	let currentDate = new Date(START_DATE);

	while (currentDate <= END_DATE) {
		const dayOfWeek = getDayOfWeek(currentDate);
		const scheduledActivities = userProfile.schedule[dayOfWeek];
		const progress = (currentDate.getTime() - START_DATE.getTime()) / (END_DATE.getTime() - START_DATE.getTime());
		const dateStr = formatDate(currentDate);

		// 85% chance of completing scheduled activities (doing the right thing most days)
		const willTrain = Math.random() < 0.85;

		if (willTrain && scheduledActivities.length > 0) {
			for (const activityType of scheduledActivities) {
				const isCardio = ['RoadRun', 'TreadmillRun', 'PoolSwim', 'SeaSwim', 'RoadCycle', 'IndoorCycle'].includes(activityType);

				if (isCardio) {
					// Determine effort type based on day
					let effort: EffortLevel = 'easy';
					if (dayOfWeek === 'tuesday' || dayOfWeek === 'thursday') {
						effort = Math.random() < 0.5 ? 'moderate' : 'hard';
					} else if (dayOfWeek === 'saturday') {
						effort = 'moderate'; // Long run day
					}

					// Distance varies by day and increases over time
					let baseDistance: number;
					if (dayOfWeek === 'saturday') {
						// Long run: starts at 15km, builds to 30km
						baseDistance = interpolate(15, 30, progress, 2);
					} else if (effort === 'hard') {
						// Tempo/interval: 8-12km
						baseDistance = interpolate(8, 12, progress, 1);
					} else {
						// Easy runs: 6-10km
						baseDistance = interpolate(6, 10, progress, 1);
					}

					const distance = Math.round(baseDistance * 10) / 10;
					const paceSecondsPerKm = calculatePace(progress, effort);
					const durationSeconds = Math.round(distance * paceSecondsPerKm);

					activities.push({
						id: generateId(),
						date: dateStr,
						type: activityType,
						distanceInKm: distance,
						durationInSeconds: durationSeconds,
						effort: effort,
					});
				} else {
					// Strength training
					const durationMinutes = 45 + Math.floor(Math.random() * 15); // 45-60 min
					activities.push({
						id: generateId(),
						date: dateStr,
						type: activityType,
						durationInSeconds: durationMinutes * 60,
						repetitions: generateRepetitions(activityType as StrengthActivityType, progress),
					});
				}
			}
		}

		currentDate = addDays(currentDate, 1);
	}

	return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // newest first
}

// Generate stats entries (weight and body fat)
function generateStatsEntries() {
	const entries: Array<{ id: string; date: string; weightKg: number; bodyFatPercentage: number }> = [];
	let currentDate = new Date(START_DATE);

	while (currentDate <= END_DATE) {
		const progress = (currentDate.getTime() - START_DATE.getTime()) / (END_DATE.getTime() - START_DATE.getTime());
		const dateStr = formatDate(currentDate);

		// 90% chance of logging weight (doing the right thing most days)
		if (Math.random() < 0.9) {
			// Weight loss follows a curve - faster at start, slower at end
			const weightProgress = Math.pow(progress, 0.8); // Slightly more weight lost early
			const weight = interpolate(STARTING_WEIGHT, CURRENT_WEIGHT, weightProgress, 0.3);
			const bodyFat = interpolate(STARTING_BODY_FAT, CURRENT_BODY_FAT, weightProgress, 0.5);

			entries.push({
				id: generateId(),
				date: dateStr,
				weightKg: Math.round(weight * 10) / 10,
				bodyFatPercentage: Math.round(bodyFat * 10) / 10,
			});
		}

		currentDate = addDays(currentDate, 1);
	}

	return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // newest first
}

// Generate diet entries
function generateDietEntries() {
	const entries: Array<{ id: string; date: string; calories: number }> = [];
	let currentDate = new Date(START_DATE);

	// Daily limit is calculated using Mifflin-St Jeor: ~1856 kcal for current stats
	// Target slightly under to ensure most days are compliant
	const dailyLimit = 1856;
	const targetCalories = 1700; // aim under limit

	while (currentDate <= END_DATE) {
		const dateStr = formatDate(currentDate);
		const dayOfWeek = getDayOfWeek(currentDate);

		// 92% chance of logging calories
		if (Math.random() < 0.92) {
			// 85% of days are under limit (doing the right thing most days)
			let calories: number;
			if (Math.random() < 0.85) {
				// Good day - under limit (1500-1850 range)
				calories = targetCalories + (Math.random() - 0.3) * 300; // mostly -100 to +150
			} else {
				// Occasional slip - over limit
				calories = dailyLimit + Math.random() * 400 + 50; // +50 to +450 over limit
			}

			// Slightly higher on long run days (Saturday) - still try to stay under
			if (dayOfWeek === 'saturday') {
				calories += 100;
			}

			entries.push({
				id: generateId(),
				date: dateStr,
				calories: Math.round(calories),
			});
		}

		currentDate = addDays(currentDate, 1);
	}

	return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // newest first
}

// Generate the backup file
export function generateBackup() {
	const activities = generateActivities();
	const statsEntries = generateStatsEntries();
	const dietEntries = generateDietEntries();

	const backup = {
		version: 1,
		lastModified: new Date().toISOString(),
		data: {
			userProfile,
			activities,
			statsEntries,
			dietEntries,
		},
	};
	return backup;
}
