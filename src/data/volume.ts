import type { Activity, RaceGoal } from '../hooks/useUserData';
import { ActivityType } from '../hooks/useUserData';

/** Race goal distances in kilometers */
export const RACE_DISTANCES: Record<RaceGoal, number> = {
	'10K': 10,
	HalfMarathon: 21.0975,
	FullMarathon: 42.195,
};

/** Runner experience level based on race time goal */
export type RunnerLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Peak weekly volume (km) by race goal and runner level
 * Based on common training plan recommendations:
 * - Beginner: "to-finish" or first-time runners (e.g., Hal Higdon Novice)
 * - Intermediate: Moderate time goals (e.g., 3:30-4:30 marathon, Pfitzinger 18/55)
 * - Advanced: PR hunting, competitive runners (e.g., sub-3:15 marathon)
 */
const PEAK_VOLUMES_BY_LEVEL: Record<RaceGoal, Record<RunnerLevel, number>> = {
	'10K': {
		beginner: 35, // Comfortable finish focus
		intermediate: 50, // Time improvement focus
		advanced: 65, // Competitive racing
	},
	HalfMarathon: {
		beginner: 50, // ~45-55 km peak
		intermediate: 65, // ~55-75 km peak
		advanced: 80, // ~70-90 km peak
	},
	FullMarathon: {
		beginner: 65, // 55-70 km peak (Hal Higdon Novice style)
		intermediate: 85, // 70-95 km peak (Pfitzinger 18/55 style)
		advanced: 105, // 90-110+ km peak (High mileage plans)
	},
};

/**
 * Race time thresholds (in minutes) for determining runner level
 * Times slower than the threshold = beginner for that cutoff
 * Times faster than the threshold = next level up
 */
const LEVEL_TIME_THRESHOLDS: Record<
	RaceGoal,
	{ beginnerMax: number; intermediateMax: number }
> = {
	'10K': {
		beginnerMax: 55, // Slower than 55 min = beginner
		intermediateMax: 45, // 45-55 min = intermediate, faster than 45 = advanced
	},
	HalfMarathon: {
		beginnerMax: 120, // Slower than 2:00 = beginner
		intermediateMax: 95, // 1:35-2:00 = intermediate, faster than 1:35 = advanced
	},
	FullMarathon: {
		beginnerMax: 270, // Slower than 4:30 = beginner
		intermediateMax: 210, // 3:30-4:30 = intermediate, faster than 3:30 = advanced
	},
};

/**
 * Parses a race time string (H:MM:SS or HH:MM:SS) to total minutes
 */
export function parseRaceTimeToMinutes(raceTimeGoal: string): number | null {
	const parts = raceTimeGoal.split(':');
	if (parts.length !== 3) return null;

	const hours = Number.parseInt(parts[0], 10);
	const minutes = Number.parseInt(parts[1], 10);
	const seconds = Number.parseInt(parts[2], 10);

	if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
		return null;
	}

	return hours * 60 + minutes + seconds / 60;
}

/**
 * Determines runner level based on race time goal
 * @param raceGoal - The race distance type
 * @param raceTimeGoal - The target race time in H:MM:SS format
 * @returns The runner level, or 'beginner' as default if time can't be parsed
 */
export function determineRunnerLevel(
	raceGoal: RaceGoal,
	raceTimeGoal: string | null,
): RunnerLevel {
	if (!raceTimeGoal) return 'beginner';

	const timeInMinutes = parseRaceTimeToMinutes(raceTimeGoal);
	if (timeInMinutes === null) return 'beginner';

	const thresholds = LEVEL_TIME_THRESHOLDS[raceGoal];

	if (timeInMinutes >= thresholds.beginnerMax) {
		return 'beginner';
	}
	if (timeInMinutes >= thresholds.intermediateMax) {
		return 'intermediate';
	}
	return 'advanced';
}

/**
 * Gets the peak weekly volume based on race goal and runner level
 */
export function getPeakVolumeForLevel(
	raceGoal: RaceGoal,
	raceTimeGoal: string | null,
): number {
	const level = determineRunnerLevel(raceGoal, raceTimeGoal);
	return PEAK_VOLUMES_BY_LEVEL[raceGoal][level];
}

/** Minimum sensible weekly volume in km */
const MIN_WEEKLY_VOLUME = 10;

/** Maximum recommended weekly volume increase (10% rule) */
const MAX_VOLUME_INCREASE_RATIO = 0.1;

/** Long run as percentage of goal distance at peak */
const PEAK_LONG_RUN_RATIO = 0.75;

/** Long run as percentage of weekly volume (typical guidance) */
const LONG_RUN_WEEKLY_RATIO = 0.3;

/** Weeks before race when peak occurs */
const WEEKS_BEFORE_RACE_FOR_PEAK = 2;

/** Taper reduction percentages for final weeks */
const TAPER_REDUCTIONS = [0.25, 0.4]; // Week -1: 25% reduction, Race week: 40% reduction

export interface VolumeRecommendation {
	/** Recommended total weekly distance in km */
	weeklyVolumeKm: number;
	/** Recommended longest run distance in km */
	longRunKm: number;
	/** Number of weeks until race */
	weeksUntilRace: number;
	/** Current training week number (1-based) */
	currentWeek: number;
	/** Total weeks in training plan */
	totalWeeks: number;
	/** Whether this is a cutback week */
	isCutbackWeek: boolean;
	/** Whether this is a taper week (final 2 weeks) */
	isTaperWeek: boolean;
	/** Peak week number in the plan */
	peakWeek: number;
	/** Last week's actual volume (from activity data) */
	lastWeekVolumeKm: number;
	/** Last week's longest run (from activity data) */
	lastWeekLongRunKm: number;
	/** Target peak weekly volume */
	peakVolumeKm: number;
}

export interface WeeklyVolumePlan {
	weekNumber: number;
	weekLabel: string;
	weeklyVolumeKm: number;
	longRunKm: number;
	isCutbackWeek: boolean;
	isTaperWeek: boolean;
	isPeakWeek: boolean;
	isCurrentWeek: boolean;
	weekStartDate: Date;
}

export interface WeeklyStats {
	totalDistanceKm: number;
	longestRunKm: number;
	runCount: number;
}

/**
 * Gets the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	// Adjust so Monday = 0, Sunday = 6
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Calculates the number of weeks between two dates (using week boundaries)
 */
export function getWeeksBetween(startDate: Date, endDate: Date): number {
	const startWeek = getWeekStart(startDate);
	const endWeek = getWeekStart(endDate);
	const diffMs = endWeek.getTime() - startWeek.getTime();
	return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Checks if an activity is a running activity (indoor or outdoor)
 */
export function isRunningActivity(activity: Activity): boolean {
	return (
		activity.type === ActivityType.RoadRun ||
		activity.type === ActivityType.TreadmillRun
	);
}

/**
 * Gets running stats for a specific week
 */
export function getWeeklyRunningStats(
	activities: Activity[],
	weekStartDate: Date,
): WeeklyStats {
	const weekStart = getWeekStart(weekStartDate);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	let totalDistanceKm = 0;
	let longestRunKm = 0;
	let runCount = 0;

	for (const activity of activities) {
		if (!isRunningActivity(activity)) continue;

		const activityDate = new Date(activity.date);
		if (activityDate >= weekStart && activityDate < weekEnd) {
			// Type guard: running activities are Cardio type with distanceInKm
			if ('distanceInKm' in activity) {
				totalDistanceKm += activity.distanceInKm;
				longestRunKm = Math.max(longestRunKm, activity.distanceInKm);
				runCount++;
			}
		}
	}

	return {
		totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
		longestRunKm: Math.round(longestRunKm * 100) / 100,
		runCount,
	};
}

/**
 * Determines if a given week in the training cycle is a cutback week
 * Using the "3 weeks up, 1 week down" pattern
 */
export function isCutbackWeek(weekNumber: number, peakWeek: number): boolean {
	// No cutback during taper (last 2 weeks) or at peak
	if (weekNumber >= peakWeek) return false;
	// Every 4th week is a cutback week (weeks 4, 8, 12, etc.)
	return weekNumber > 0 && weekNumber % 4 === 0;
}

/**
 * Calculates the theoretical volume for a given week in an ideal progression
 * This builds up to peak volume using ~10% increases with cutback weeks
 */
export function calculateIdealWeekVolume(
	weekNumber: number,
	peakWeek: number,
	peakVolumeKm: number,
	startingVolumeKm: number,
): number {
	if (weekNumber <= 0) return startingVolumeKm;

	// Taper phase (after peak)
	if (weekNumber > peakWeek) {
		const weeksAfterPeak = weekNumber - peakWeek;
		if (weeksAfterPeak <= TAPER_REDUCTIONS.length) {
			const reduction = TAPER_REDUCTIONS[weeksAfterPeak - 1];
			return Math.round(peakVolumeKm * (1 - reduction) * 10) / 10;
		}
		return peakVolumeKm * 0.5; // Fallback for unexpected weeks
	}

	// Peak week
	if (weekNumber === peakWeek) {
		return peakVolumeKm;
	}

	// Build-up phase
	// Calculate how much we need to grow from start to peak
	const weeksToGrow = peakWeek - 1; // Weeks available for progression (excluding week 1)
	const cutbackWeeks = Math.floor((peakWeek - 1) / 4); // Number of cutback weeks
	const progressionWeeks = weeksToGrow - cutbackWeeks; // Actual progression weeks

	if (progressionWeeks <= 0) return startingVolumeKm;

	// Calculate the weekly growth rate needed to reach peak
	// Using compound growth: peak = start * (1 + rate)^progressionWeeks
	const growthRate =
		(peakVolumeKm / startingVolumeKm) ** (1 / progressionWeeks) - 1;
	// Cap growth rate at 10%
	const cappedGrowthRate = Math.min(growthRate, MAX_VOLUME_INCREASE_RATIO);

	// Count progression weeks up to current week
	let progressionCount = 0;
	for (let w = 2; w <= weekNumber; w++) {
		if (!isCutbackWeek(w, peakWeek)) {
			progressionCount++;
		}
	}

	// Calculate volume based on progression count
	let volume = startingVolumeKm * (1 + cappedGrowthRate) ** progressionCount;

	// Apply cutback if this is a cutback week (reduce to ~week 1 level or 75% of previous)
	if (isCutbackWeek(weekNumber, peakWeek)) {
		// Cutback to roughly 75% of what would be the previous week's volume
		volume = volume * 0.75;
	}

	return Math.round(volume * 10) / 10;
}

/**
 * Main function to calculate recommended weekly volume
 *
 * @param today - Current date
 * @param raceGoalDistance - Race goal type ('10K', 'HalfMarathon', 'FullMarathon')
 * @param raceGoalDate - Target race date (ISO string or Date)
 * @param activities - Array of user activities
 * @param raceTimeGoal - Optional target race time (H:MM:SS format) to determine training level
 * @returns Volume recommendation with weekly targets and training status
 */
export function calculateVolumeRecommendation(
	today: Date,
	raceGoalDistance: RaceGoal,
	raceGoalDate: Date | string,
	activities: Activity[],
	raceTimeGoal: string | null = null,
): VolumeRecommendation | null {
	const raceDate =
		typeof raceGoalDate === 'string' ? new Date(raceGoalDate) : raceGoalDate;

	// Calculate weeks until race
	const weeksUntilRace = getWeeksBetween(today, raceDate);

	// If race is in the past, return null
	if (weeksUntilRace < 0) {
		return null;
	}

	// Get race distance and peak volume targets based on runner level
	const raceDistanceKm = RACE_DISTANCES[raceGoalDistance];
	const peakVolumeKm = getPeakVolumeForLevel(raceGoalDistance, raceTimeGoal);
	const peakLongRunKm =
		Math.round(raceDistanceKm * PEAK_LONG_RUN_RATIO * 10) / 10;

	// Calculate total weeks in plan and peak week
	// Assume training started when there was enough time for a reasonable build-up
	// or use the earliest activity date if available
	const totalWeeks = weeksUntilRace + 1; // +1 because current week counts
	const peakWeek = Math.max(1, totalWeeks - WEEKS_BEFORE_RACE_FOR_PEAK);
	const currentWeek = totalWeeks - weeksUntilRace;

	// Get last week's stats
	const lastWeekStart = new Date(today);
	lastWeekStart.setDate(lastWeekStart.getDate() - 7);
	const lastWeekStats = getWeeklyRunningStats(activities, lastWeekStart);

	// Determine if this is a cutback or taper week
	const isCurrentCutbackWeek = isCutbackWeek(currentWeek, peakWeek);
	const isTaperWeek = currentWeek > peakWeek;

	// Calculate recommended volume
	let weeklyVolumeKm: number;

	// Determine starting baseline
	const baselineVolume =
		lastWeekStats.totalDistanceKm > 0
			? lastWeekStats.totalDistanceKm
			: MIN_WEEKLY_VOLUME;

	if (isTaperWeek) {
		// Taper phase: reduce from peak
		const weeksAfterPeak = currentWeek - peakWeek;
		if (weeksAfterPeak <= TAPER_REDUCTIONS.length) {
			const reduction = TAPER_REDUCTIONS[weeksAfterPeak - 1];
			weeklyVolumeKm = peakVolumeKm * (1 - reduction);
		} else {
			weeklyVolumeKm = peakVolumeKm * 0.5;
		}
	} else if (currentWeek === peakWeek) {
		// Peak week
		weeklyVolumeKm = peakVolumeKm;
	} else if (isCurrentCutbackWeek) {
		// Cutback week: reduce to 75% of last week
		weeklyVolumeKm = baselineVolume * 0.75;
	} else {
		// Build-up week: apply 10% rule
		const targetWithIncrease = baselineVolume * (1 + MAX_VOLUME_INCREASE_RATIO);

		// Calculate ideal volume for this week in the progression
		const idealVolume = calculateIdealWeekVolume(
			currentWeek,
			peakWeek,
			peakVolumeKm,
			MIN_WEEKLY_VOLUME,
		);

		// Use the more conservative of: 10% increase or ideal progression
		// This prevents over-reaching if coming back from low volume
		weeklyVolumeKm = Math.min(targetWithIncrease, idealVolume);

		// But don't recommend less than minimum
		weeklyVolumeKm = Math.max(weeklyVolumeKm, MIN_WEEKLY_VOLUME);

		// And don't exceed peak volume during build-up
		weeklyVolumeKm = Math.min(weeklyVolumeKm, peakVolumeKm);
	}

	// Calculate long run recommendation
	let longRunKm: number;
	if (currentWeek === peakWeek) {
		longRunKm = peakLongRunKm;
	} else if (isTaperWeek) {
		// Shorter long runs during taper
		const weeksAfterPeak = currentWeek - peakWeek;
		const taperRatio = weeksAfterPeak === 1 ? 0.6 : 0.5;
		longRunKm = peakLongRunKm * taperRatio;
	} else {
		// Long run is typically 25-30% of weekly volume
		longRunKm = weeklyVolumeKm * LONG_RUN_WEEKLY_RATIO;

		// Apply 10% rule to long run as well
		if (lastWeekStats.longestRunKm > 0) {
			const maxLongRun =
				lastWeekStats.longestRunKm * (1 + MAX_VOLUME_INCREASE_RATIO);
			longRunKm = Math.min(longRunKm, maxLongRun);
		}

		// Don't exceed peak long run during build-up
		longRunKm = Math.min(longRunKm, peakLongRunKm);
	}

	return {
		weeklyVolumeKm: Math.round(weeklyVolumeKm * 10) / 10,
		longRunKm: Math.round(longRunKm * 10) / 10,
		weeksUntilRace,
		currentWeek,
		totalWeeks,
		isCutbackWeek: isCurrentCutbackWeek,
		isTaperWeek,
		peakWeek,
		lastWeekVolumeKm: lastWeekStats.totalDistanceKm,
		lastWeekLongRunKm: lastWeekStats.longestRunKm,
		peakVolumeKm,
	};
}

/**
 * Generates the full training plan from current week to race week
 *
 * @param today - Current date
 * @param raceGoalDistance - Race goal type ('10K', 'HalfMarathon', 'FullMarathon')
 * @param raceGoalDate - Target race date (ISO string or Date)
 * @param startingVolumeKm - Starting weekly volume (from last week's actual or minimum)
 * @param planStartDate - Optional date to start the plan display from (defaults to today)
 * @param raceTimeGoal - Optional target race time (H:MM:SS format) to determine training level
 * @returns Array of weekly volume plans from planStartDate to race week
 */
export function generateTrainingPlan(
	today: Date,
	raceGoalDistance: RaceGoal,
	raceGoalDate: Date | string,
	startingVolumeKm: number = MIN_WEEKLY_VOLUME,
	planStartDate?: Date,
	raceTimeGoal: string | null = null,
): WeeklyVolumePlan[] | null {
	const raceDate =
		typeof raceGoalDate === 'string' ? new Date(raceGoalDate) : raceGoalDate;

	// Calculate weeks until race
	const weeksUntilRace = getWeeksBetween(today, raceDate);

	// If race is in the past, return null
	if (weeksUntilRace < 0) {
		return null;
	}

	// Get race distance and peak volume targets based on runner level
	const raceDistanceKm = RACE_DISTANCES[raceGoalDistance];
	const peakVolumeKm = getPeakVolumeForLevel(raceGoalDistance, raceTimeGoal);
	const peakLongRunKm =
		Math.round(raceDistanceKm * PEAK_LONG_RUN_RATIO * 10) / 10;

	// Calculate total weeks in plan and peak week
	const totalWeeks = weeksUntilRace + 1; // +1 because current week counts
	const peakWeek = Math.max(1, totalWeeks - WEEKS_BEFORE_RACE_FOR_PEAK);
	const currentWeek = totalWeeks - weeksUntilRace;

	// Determine the starting week for the plan display
	const displayStartDate = planStartDate || today;
	const weeksFromDisplayStartToRace = getWeeksBetween(
		displayStartDate,
		raceDate,
	);
	const displayStartWeek = Math.max(
		1,
		totalWeeks - weeksFromDisplayStartToRace,
	);

	const baseStartVolume = Math.max(startingVolumeKm, MIN_WEEKLY_VOLUME);
	const plan: WeeklyVolumePlan[] = [];

	for (let week = displayStartWeek; week <= totalWeeks; week++) {
		const weeksFromCurrent = week - currentWeek;
		const weekStartDate = new Date(today);
		weekStartDate.setDate(weekStartDate.getDate() + weeksFromCurrent * 7);
		const weekStart = getWeekStart(weekStartDate);

		const isWeekCutback = isCutbackWeek(week, peakWeek);
		const isWeekTaper = week > peakWeek;
		const isWeekPeak = week === peakWeek;
		const isWeekCurrent = week === currentWeek;

		// Calculate volume using ideal progression
		const weeklyVolumeKm = calculateIdealWeekVolume(
			week,
			peakWeek,
			peakVolumeKm,
			baseStartVolume,
		);

		// Calculate long run
		let longRunKm: number;
		if (isWeekPeak) {
			longRunKm = peakLongRunKm;
		} else if (isWeekTaper) {
			const weeksAfterPeak = week - peakWeek;
			const taperRatio = weeksAfterPeak === 1 ? 0.6 : 0.5;
			longRunKm = peakLongRunKm * taperRatio;
		} else {
			longRunKm = weeklyVolumeKm * LONG_RUN_WEEKLY_RATIO;
			longRunKm = Math.min(longRunKm, peakLongRunKm);
		}

		// Format week label
		const weekLabel = week === totalWeeks ? 'Race' : `W${week}`;

		plan.push({
			weekNumber: week,
			weekLabel,
			weeklyVolumeKm: Math.round(weeklyVolumeKm * 10) / 10,
			longRunKm: Math.round(longRunKm * 10) / 10,
			isCutbackWeek: isWeekCutback,
			isTaperWeek: isWeekTaper,
			isPeakWeek: isWeekPeak,
			isCurrentWeek: isWeekCurrent,
			weekStartDate: weekStart,
		});
	}

	return plan;
}
