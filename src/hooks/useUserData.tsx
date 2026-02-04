import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import type { EffortType } from '../data/effort';
import {
	deleteActivity as deleteActivityFromDB,
	deleteDietEntry as deleteDietEntryFromDB,
	deleteStatsEntry as deleteStatsEntryFromDB,
	getActivityCount,
	getDietEntryCount,
	getStatsEntryCount,
	loadActivities,
	loadAllActivities,
	loadAllDietEntries,
	loadAllStatsEntries,
	loadDietEntries,
	loadDietEntryByDate,
	loadStatsEntries,
	loadStatsEntryByDate,
	loadUserProfile,
	saveActivities,
	saveActivity,
	saveDietEntries,
	saveDietEntry,
	saveStatsEntries,
	saveStatsEntry,
	saveUserProfile,
} from './db';
import { updateLocalModified } from './useBackup';

export type RaceGoal = '10K' | 'HalfMarathon' | 'FullMarathon';

export interface UserProfile {
	name: string | null;
	heightCm: number | null;
	dateOfBirth: string | null;
	sex: 'male' | 'female' | null;
	targetWeightKg: number | null;
	targetWeightLossPerWeekKg: number | null;
	strengthTrainingRepetitions: number | null;
	strengthTrainingSets: number | null;
	raceGoal: RaceGoal | null;
	raceTimeGoal: string | null;
	raceDate: string | null;
	schedule: Schedule;
}

export const ActivityType = {
	RoadRun: 'RoadRun',
	TreadmillRun: 'TreadmillRun',
	PoolSwim: 'PoolSwim',
	SeaSwim: 'SeaSwim',
	RoadCycle: 'RoadCycle',
	IndoorCycle: 'IndoorCycle',
	StrengthTrainingLegs: 'StrengthTrainingLegs',
	StrengthTrainingArms: 'StrengthTrainingArms',
	StrengthTrainingCore: 'StrengthTrainingCore',
	StrengthTrainingShoulders: 'StrengthTrainingShoulders',
	StrengthTrainingBack: 'StrengthTrainingBack',
	StrengthTrainingChest: 'StrengthTrainingChest',
} as const;

export type ActivityTypeKey = (typeof ActivityType)[keyof typeof ActivityType];

export interface Schedule {
	monday: ActivityTypeKey[];
	tuesday: ActivityTypeKey[];
	wednesday: ActivityTypeKey[];
	thursday: ActivityTypeKey[];
	friday: ActivityTypeKey[];
	saturday: ActivityTypeKey[];
	sunday: ActivityTypeKey[];
}

interface BaseActivity {
	id: string;
	date: string;
	durationInSeconds: number;
}

export interface Cardio extends BaseActivity {
	type:
		| typeof ActivityType.RoadRun
		| typeof ActivityType.TreadmillRun
		| typeof ActivityType.PoolSwim
		| typeof ActivityType.SeaSwim
		| typeof ActivityType.RoadCycle
		| typeof ActivityType.IndoorCycle;
	distanceInKm: number;
	effort?: EffortType;
}

export const RepetitionType = {
	BicepCurl: 'BicepCurl',
	CableTricepPushdown: 'CableTricepPushdown',
	FrontRaise: 'FrontRaise',
	LateralRaise: 'LateralRaise',
	ShoulderPress: 'ShoulderPress',
	BackExtension: 'BackExtension',
	CableLatPulldown: 'CableLatPulldown',
	CableRow: 'CableRow',
	Shrugs: 'Shrugs',
	DumbbellBenchPress: 'DumbbellBenchPress',
	Flys: 'Flys',
	BarbellSquats: 'BarbellSquats',
	CableHipAdduction: 'CableHipAdduction',
	LegExtension: 'LegExtension',
	LyingLegCurl: 'LyingLegCurl',
	PullUps: 'PullUps',
	CableCrunch: 'CableCrunch',
	Crunches: 'Crunches',
	HangingKneeRaise: 'HangingKneeRaise',
	ReverseCrunches: 'ReverseCrunches',
	SitUps: 'SitUps',
	InclineDumbbellFly: 'InclineDumbbellFly',
	InclineDumbbellPress: 'InclineDumbbellPress',
	ConcentrationCurls: 'ConcentrationCurls',
	HammerCurls: 'HammerCurls',
	CableDonkeyKickback: 'CableDonkeyKickback',
	BandCalfRaise: 'BandCalfRaise',
	CableWristCurls: 'CableWristCurls',
} as const;

export type RepetitionKey =
	(typeof RepetitionType)[keyof typeof RepetitionType];

export function getRepetitionsForActivityType(
	activityType: ActivityTypeKey,
): RepetitionKey[] {
	switch (activityType) {
		case ActivityType.StrengthTrainingArms:
			return [
				RepetitionType.BicepCurl,
				RepetitionType.CableTricepPushdown,
				RepetitionType.ConcentrationCurls,
				RepetitionType.HammerCurls,
				RepetitionType.CableWristCurls,
			];
		case ActivityType.StrengthTrainingShoulders:
			return [
				RepetitionType.FrontRaise,
				RepetitionType.LateralRaise,
				RepetitionType.ShoulderPress,
				RepetitionType.Shrugs,
			];
		case ActivityType.StrengthTrainingBack:
			return [
				RepetitionType.BackExtension,
				RepetitionType.CableLatPulldown,
				RepetitionType.CableRow,
				RepetitionType.PullUps,
			];
		case ActivityType.StrengthTrainingChest:
			return [
				RepetitionType.DumbbellBenchPress,
				RepetitionType.Flys,
				RepetitionType.InclineDumbbellFly,
				RepetitionType.InclineDumbbellPress,
			];
		case ActivityType.StrengthTrainingLegs:
			return [
				RepetitionType.BarbellSquats,
				RepetitionType.CableHipAdduction,
				RepetitionType.LegExtension,
				RepetitionType.LyingLegCurl,
				RepetitionType.CableDonkeyKickback,
				RepetitionType.BandCalfRaise,
			];
		case ActivityType.StrengthTrainingCore:
			return [
				RepetitionType.CableCrunch,
				RepetitionType.Crunches,
				RepetitionType.HangingKneeRaise,
				RepetitionType.ReverseCrunches,
				RepetitionType.SitUps,
			];
		default:
			return [];
	}
}

export interface Repetition {
	type: RepetitionKey;
	count: number;
	series: number;
	weightKg: number;
}

export interface Strength extends BaseActivity {
	type:
		| typeof ActivityType.StrengthTrainingLegs
		| typeof ActivityType.StrengthTrainingArms
		| typeof ActivityType.StrengthTrainingCore
		| typeof ActivityType.StrengthTrainingChest
		| typeof ActivityType.StrengthTrainingShoulders
		| typeof ActivityType.StrengthTrainingBack;
	repetitions: Repetition[];
}

export type Activity = Cardio | Strength;

export interface UserStatsEntry {
	id: string;
	date: string;
	weightKg: number;
	bodyFatPercentage: number | null;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DietEntry {
	id: string;
	date: string;
	calories: number;
	mealType?: MealType;
}

interface UserData {
	// Loading state
	isLoading: boolean;

	// Registration state
	isRegistered: boolean;

	// User Profile
	userProfile: UserProfile;
	setUserProfile: (userProfile: UserProfile) => void;

	// Activities - paginated for large datasets
	activities: Activity[];
	activityCount: number;
	loadMoreActivities: (limit?: number) => Promise<void>;
	loadAllUserActivities: () => Promise<Activity[]>;
	addActivity: (activity: Activity) => Promise<void>;
	updateActivities: (activities: Activity[]) => Promise<void>;
	deleteActivity: (id: string) => Promise<void>;

	// Stats entries - paginated for large datasets
	statsEntries: UserStatsEntry[];
	statsEntryCount: number;
	loadMoreStatsEntries: (limit?: number) => Promise<void>;
	loadAllUserStatsEntries: () => Promise<UserStatsEntry[]>;
	addStatsEntry: (entry: UserStatsEntry) => Promise<void>;
	updateStatsEntries: (entries: UserStatsEntry[]) => Promise<void>;
	deleteStatsEntry: (id: string) => Promise<void>;

	// Diet entries - paginated for large datasets
	dietEntries: DietEntry[];
	dietEntryCount: number;
	loadMoreDietEntries: (limit?: number) => Promise<void>;
	loadAllUserDietEntries: () => Promise<DietEntry[]>;
	addDietEntry: (entry: DietEntry) => Promise<void>;
	updateDietEntries: (entries: DietEntry[]) => Promise<void>;
	deleteDietEntry: (id: string) => Promise<void>;
}

const DEFAULT_SCHEDULE: Schedule = {
	monday: [],
	tuesday: [],
	wednesday: [],
	thursday: [],
	friday: [],
	saturday: [],
	sunday: [],
};

const DEFAULT_USER_PROFILE: UserProfile = {
	name: null,
	heightCm: null,
	dateOfBirth: null,
	sex: null,
	targetWeightKg: null,
	targetWeightLossPerWeekKg: null,
	strengthTrainingRepetitions: null,
	strengthTrainingSets: null,
	raceGoal: null,
	raceTimeGoal: null,
	raceDate: null,
	schedule: DEFAULT_SCHEDULE,
};

const ACTIVITIES_PAGE_SIZE = 50;
const STATS_ENTRIES_PAGE_SIZE = 50;
const DIET_ENTRIES_PAGE_SIZE = 50;

const UserDataContext = createContext<UserData | undefined>(undefined);

interface UserDataProviderProps {
	children: ReactNode;
}

export function UserDataProvider({ children }: UserDataProviderProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [isRegistered, setIsRegistered] = useState(false);
	const [userProfile, setUserProfileState] =
		useState<UserProfile>(DEFAULT_USER_PROFILE);
	const [activities, setActivitiesState] = useState<Activity[]>([]);
	const [activityCount, setActivityCount] = useState(0);
	const [statsEntries, setStatsEntriesState] = useState<UserStatsEntry[]>([]);
	const [statsEntryCount, setStatsEntryCount] = useState(0);
	const [dietEntries, setDietEntriesState] = useState<DietEntry[]>([]);
	const [dietEntryCount, setDietEntryCount] = useState(0);

	// Check if user has completed registration (has profile data)
	const checkIsRegistered = useCallback((profile: UserProfile) => {
		return (
			profile.heightCm !== null &&
			profile.dateOfBirth !== null &&
			profile.sex !== null
		);
	}, []);

	// Load initial data from IndexedDB
	useEffect(() => {
		async function loadInitialData() {
			try {
				const [
					savedUserProfile,
					initialActivities,
					activityCountResult,
					initialStatsEntries,
					statsEntryCountResult,
					initialDietEntries,
					dietEntryCountResult,
				] = await Promise.all([
					loadUserProfile(),
					loadActivities(ACTIVITIES_PAGE_SIZE, 0),
					getActivityCount(),
					loadStatsEntries(STATS_ENTRIES_PAGE_SIZE, 0),
					getStatsEntryCount(),
					loadDietEntries(DIET_ENTRIES_PAGE_SIZE, 0),
					getDietEntryCount(),
				]);

				if (savedUserProfile) {
					setUserProfileState(savedUserProfile);
					setIsRegistered(checkIsRegistered(savedUserProfile));
				}
				setActivitiesState(initialActivities);
				setActivityCount(activityCountResult);
				setStatsEntriesState(initialStatsEntries);
				setStatsEntryCount(statsEntryCountResult);
				setDietEntriesState(initialDietEntries);
				setDietEntryCount(dietEntryCountResult);
			} catch (error) {
				console.error('Failed to load data from IndexedDB:', error);
			} finally {
				setIsLoading(false);
			}
		}

		loadInitialData();
	}, [checkIsRegistered]);

	// User Profile - persist to IndexedDB
	const setUserProfile = useCallback(
		(newUserProfile: UserProfile) => {
			setUserProfileState(newUserProfile);
			setIsRegistered(checkIsRegistered(newUserProfile));
			saveUserProfile(newUserProfile)
				.then(() => updateLocalModified())
				.catch((error) => {
					console.error('Failed to save user profile:', error);
				});
		},
		[checkIsRegistered],
	);

	// Load more stats entries (pagination)
	const loadMoreStatsEntries = useCallback(
		async (limit = STATS_ENTRIES_PAGE_SIZE) => {
			const moreEntries = await loadStatsEntries(limit, statsEntries.length);
			setStatsEntriesState((prev) => [...prev, ...moreEntries]);
		},
		[statsEntries.length],
	);

	// Load all stats entries (use sparingly for large datasets)
	const loadAllUserStatsEntries = useCallback(async () => {
		return loadAllStatsEntries();
	}, []);

	// Add single stats entry (or update if entry for date already exists)
	const addStatsEntry = useCallback(async (entry: UserStatsEntry) => {
		const existingEntry = await loadStatsEntryByDate(entry.date);
		if (existingEntry) {
			// Update existing entry, keeping the original id
			const updatedEntry = { ...entry, id: existingEntry.id };
			await saveStatsEntry(updatedEntry);
			setStatsEntriesState((prev) =>
				prev.map((e) => (e.id === existingEntry.id ? updatedEntry : e)),
			);
		} else {
			await saveStatsEntry(entry);
			setStatsEntriesState((prev) => [entry, ...prev]); // newest first
			setStatsEntryCount((prev) => prev + 1);
		}
		updateLocalModified();
	}, []);

	// Bulk update stats entries
	const updateStatsEntries = useCallback(
		async (newEntries: UserStatsEntry[]) => {
			await saveStatsEntries(newEntries);
			// Reload entries to ensure consistency
			const [reloadedEntries, count] = await Promise.all([
				loadStatsEntries(STATS_ENTRIES_PAGE_SIZE, 0),
				getStatsEntryCount(),
			]);
			setStatsEntriesState(reloadedEntries);
			setStatsEntryCount(count);
			updateLocalModified();
		},
		[],
	);

	// Delete stats entry
	const deleteStatsEntry = useCallback(async (id: string) => {
		await deleteStatsEntryFromDB(id);
		setStatsEntriesState((prev) => prev.filter((e) => e.id !== id));
		setStatsEntryCount((prev) => prev - 1);
		updateLocalModified();
	}, []);

	// Load more diet entries (pagination)
	const loadMoreDietEntries = useCallback(
		async (limit = DIET_ENTRIES_PAGE_SIZE) => {
			const moreEntries = await loadDietEntries(limit, dietEntries.length);
			setDietEntriesState((prev) => [...prev, ...moreEntries]);
		},
		[dietEntries.length],
	);

	// Load all diet entries (use sparingly for large datasets)
	const loadAllUserDietEntries = useCallback(async () => {
		return loadAllDietEntries();
	}, []);

	// Add single diet entry (adds calories to existing entry for same date)
	const addDietEntry = useCallback(async (entry: DietEntry) => {
		const existingEntry = await loadDietEntryByDate(entry.date);
		if (existingEntry) {
			// Add new calories to existing entry for the same date
			const updatedEntry = {
				...existingEntry,
				calories: existingEntry.calories + entry.calories,
			};
			await saveDietEntry(updatedEntry);
			setDietEntriesState((prev) => {
				const exists = prev.some((e) => e.id === existingEntry.id);
				if (exists) {
					return prev.map((e) =>
						e.id === existingEntry.id ? updatedEntry : e,
					);
				}
				// Entry exists in DB but not in paginated state - add it
				return [updatedEntry, ...prev];
			});
		} else {
			await saveDietEntry(entry);
			setDietEntriesState((prev) => [entry, ...prev]); // newest first
			setDietEntryCount((prev) => prev + 1);
		}
		updateLocalModified();
	}, []);

	// Bulk update diet entries
	const updateDietEntries = useCallback(async (newEntries: DietEntry[]) => {
		await saveDietEntries(newEntries);
		// Reload entries to ensure consistency
		const [reloadedEntries, count] = await Promise.all([
			loadDietEntries(DIET_ENTRIES_PAGE_SIZE, 0),
			getDietEntryCount(),
		]);
		setDietEntriesState(reloadedEntries);
		setDietEntryCount(count);
		updateLocalModified();
	}, []);

	// Delete diet entry
	const deleteDietEntry = useCallback(async (id: string) => {
		await deleteDietEntryFromDB(id);
		setDietEntriesState((prev) => prev.filter((e) => e.id !== id));
		setDietEntryCount((prev) => prev - 1);
		updateLocalModified();
	}, []);

	// Load more activities (pagination)
	const loadMoreActivities = useCallback(
		async (limit = ACTIVITIES_PAGE_SIZE) => {
			const moreActivities = await loadActivities(limit, activities.length);
			setActivitiesState((prev) => [...prev, ...moreActivities]);
		},
		[activities.length],
	);

	// Load all activities (use sparingly for large datasets)
	const loadAllUserActivities = useCallback(async () => {
		return loadAllActivities();
	}, []);

	// Add single activity
	const addActivity = useCallback(async (activity: Activity) => {
		await saveActivity(activity);
		setActivitiesState((prev) => [activity, ...prev]); // newest first
		setActivityCount((prev) => prev + 1);
		updateLocalModified();
	}, []);

	// Bulk update activities
	const updateActivities = useCallback(async (newActivities: Activity[]) => {
		await saveActivities(newActivities);
		// Reload activities to ensure consistency
		const [reloadedActivities, count] = await Promise.all([
			loadActivities(ACTIVITIES_PAGE_SIZE, 0),
			getActivityCount(),
		]);
		setActivitiesState(reloadedActivities);
		setActivityCount(count);
		updateLocalModified();
	}, []);

	// Delete activity
	const deleteActivity = useCallback(async (id: string) => {
		await deleteActivityFromDB(id);
		setActivitiesState((prev) => prev.filter((a) => a.id !== id));
		setActivityCount((prev) => prev - 1);
		updateLocalModified();
	}, []);

	return (
		<UserDataContext.Provider
			value={{
				isLoading,
				isRegistered,
				userProfile,
				setUserProfile,
				activities,
				activityCount,
				loadMoreActivities,
				loadAllUserActivities,
				addActivity,
				updateActivities,
				deleteActivity,
				statsEntries,
				statsEntryCount,
				loadMoreStatsEntries,
				loadAllUserStatsEntries,
				addStatsEntry,
				updateStatsEntries,
				deleteStatsEntry,
				dietEntries,
				dietEntryCount,
				loadMoreDietEntries,
				loadAllUserDietEntries,
				addDietEntry,
				updateDietEntries,
				deleteDietEntry,
			}}
		>
			{children}
		</UserDataContext.Provider>
	);
}

export function useUserData(): UserData {
	const context = useContext(UserDataContext);
	if (context === undefined) {
		throw new Error('useUserData must be used within a UserDataProvider');
	}
	return context;
}
