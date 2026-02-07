import type {
	MarathonMajor,
	RaceGoal,
	UserProfile,
} from '../hooks/useUserData';
import { Button } from './Button';

const RACE_GOAL_LABELS: Record<RaceGoal, string> = {
	'10K': '10K',
	HalfMarathon: '1/2 Marathon',
	FullMarathon: 'Full Marathon',
};

const MARATHON_MAJORS: { key: MarathonMajor; label: string }[] = [
	{ key: 'tokyo', label: 'Tokyo' },
	{ key: 'boston', label: 'Boston' },
	{ key: 'london', label: 'London' },
	{ key: 'berlin', label: 'Berlin' },
	{ key: 'chicago', label: 'Chicago' },
	{ key: 'ny', label: 'New York' },
	{ key: 'sydney', label: 'Sydney' },
];

interface UserProfileFormProps {
	userProfile: UserProfile;
	onChange: (userProfile: UserProfile) => void;
	weightKg?: number | null;
	onWeightChange?: (weightKg: number | null) => void;
}

export function UserProfileForm({
	userProfile,
	onChange,
	weightKg,
	onWeightChange,
}: UserProfileFormProps) {
	return (
		<div className="space-y-6">
			<div>
				<label
					htmlFor="name"
					className="block text-sm font-medium text-gray-300 mb-2"
				>
					Name
				</label>
				<input
					type="text"
					id="name"
					value={userProfile.name ?? ''}
					onChange={(e) =>
						onChange({
							...userProfile,
							name: e.target.value || null,
						})
					}
					className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-white placeholder-gray-400"
					placeholder="Your name"
				/>
			</div>

			<div>
				<label
					htmlFor="heightCm"
					className="block text-sm font-medium text-gray-300 mb-2"
				>
					Height (cm)
				</label>
				<input
					type="number"
					id="heightCm"
					value={userProfile.heightCm ?? ''}
					onChange={(e) =>
						onChange({
							...userProfile,
							heightCm: e.target.value ? Number(e.target.value) : null,
						})
					}
					className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-white placeholder-gray-400"
					placeholder="175"
					min="50"
					max="250"
				/>
			</div>

			{onWeightChange !== undefined && (
				<div>
					<label
						htmlFor="weightKg"
						className="block text-sm font-medium text-gray-300 mb-2"
					>
						Weight (kg) - {new Date().toLocaleDateString('en-GB')}
					</label>
					<input
						type="number"
						id="weightKg"
						value={weightKg ?? ''}
						onChange={(e) =>
							onWeightChange(e.target.value ? Number(e.target.value) : null)
						}
						className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-white placeholder-gray-400"
						placeholder="70"
						min="20"
						max="300"
						step="0.1"
					/>
				</div>
			)}

			<div>
				<label
					htmlFor="targetWeightKg"
					className="block text-sm font-medium text-gray-300 mb-2"
				>
					Target Weight (kg)
				</label>
				<input
					type="number"
					id="targetWeightKg"
					value={userProfile.targetWeightKg ?? ''}
					onChange={(e) =>
						onChange({
							...userProfile,
							targetWeightKg: e.target.value ? Number(e.target.value) : null,
						})
					}
					className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-white placeholder-gray-400"
					placeholder="65"
					min="20"
					max="300"
					step="0.1"
				/>
			</div>

			<div>
				<span className="block text-sm font-medium text-gray-300 mb-2">
					Target Weight Loss per Week (kg)
				</span>
				<div className="flex gap-2">
					{[0.25, 0.5, 0.75, 1].map((value) => (
						<Button
							key={value}
							color="purple"
							size="md"
							active={userProfile.targetWeightLossPerWeekKg === value}
							onClick={() =>
								onChange({ ...userProfile, targetWeightLossPerWeekKg: value })
							}
							className="flex-1"
						>
							{value}
						</Button>
					))}
				</div>
			</div>

			<div>
				<label
					htmlFor="dateOfBirth"
					className="block text-sm font-medium text-gray-300 mb-2"
				>
					Date of Birth
				</label>
				<input
					type="date"
					id="dateOfBirth"
					value={userProfile.dateOfBirth ?? ''}
					onChange={(e) =>
						onChange({
							...userProfile,
							dateOfBirth: e.target.value || null,
						})
					}
					className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-white"
				/>
			</div>

			<div>
				<span className="block text-sm font-medium text-gray-300 mb-2">
					Sex
				</span>
				<div className="flex gap-4">
					<Button
						color="purple"
						size="md"
						active={userProfile.sex === 'male'}
						onClick={() => onChange({ ...userProfile, sex: 'male' })}
						className="flex-1"
					>
						Male
					</Button>
					<Button
						color="purple"
						size="md"
						active={userProfile.sex === 'female'}
						onClick={() => onChange({ ...userProfile, sex: 'female' })}
						className="flex-1"
					>
						Female
					</Button>
				</div>
			</div>

			<div>
				<span className="block text-sm font-medium text-gray-300 mb-2">
					Race Distance Goal
				</span>
				<div className="flex gap-4">
					{(['10K', 'HalfMarathon', 'FullMarathon'] as const).map((goal) => (
						<Button
							key={goal}
							color="purple"
							size="md"
							active={userProfile.raceGoal === goal}
							onClick={() => onChange({ ...userProfile, raceGoal: goal })}
							className="flex-1"
						>
							{RACE_GOAL_LABELS[goal]}
						</Button>
					))}
				</div>
			</div>

			<div>
				<label
					htmlFor="raceTimeGoal"
					className="block text-sm font-medium text-gray-300 mb-2"
				>
					Race Time Goal
				</label>
				<input
					type="text"
					id="raceTimeGoal"
					value={userProfile.raceTimeGoal ?? ''}
					onChange={(e) =>
						onChange({
							...userProfile,
							raceTimeGoal: e.target.value || null,
						})
					}
					className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-white placeholder-gray-400"
					placeholder="2:59:59"
				/>
			</div>

			<div>
				<label
					htmlFor="raceDate"
					className="block text-sm font-medium text-gray-300 mb-2"
				>
					Race Date
				</label>
				<input
					type="date"
					id="raceDate"
					value={userProfile.raceDate ?? ''}
					onChange={(e) =>
						onChange({
							...userProfile,
							raceDate: e.target.value || null,
						})
					}
					className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-white"
				/>
			</div>

			<div>
				<label
					htmlFor="strengthTrainingRepetitions"
					className="block text-sm font-medium text-gray-300 mb-2"
				>
					Number of Repetitions (Strength Training)
				</label>
				<input
					type="number"
					id="strengthTrainingRepetitions"
					value={userProfile.strengthTrainingRepetitions ?? ''}
					onChange={(e) =>
						onChange({
							...userProfile,
							strengthTrainingRepetitions: e.target.value
								? Number(e.target.value)
								: null,
						})
					}
					className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-white placeholder-gray-400"
					placeholder="12"
					min="1"
					max="100"
				/>
			</div>

			<div>
				<label
					htmlFor="strengthTrainingSets"
					className="block text-sm font-medium text-gray-300 mb-2"
				>
					Number of Sets (Strength Training)
				</label>
				<input
					type="number"
					id="strengthTrainingSets"
					value={userProfile.strengthTrainingSets ?? ''}
					onChange={(e) =>
						onChange({
							...userProfile,
							strengthTrainingSets: e.target.value
								? Number(e.target.value)
								: null,
						})
					}
					className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-white placeholder-gray-400"
					placeholder="3"
					min="1"
					max="20"
				/>
			</div>

			<div>
				<span className="block text-sm font-medium text-gray-300 mb-2">
					Star Chaser (Abbott World Marathon Majors)
				</span>
				<div className="flex gap-4 mb-4">
					<Button
						color="purple"
						size="md"
						active={userProfile.starChaser === true}
						onClick={() =>
							onChange({
								...userProfile,
								starChaser: true,
								completedMajors: userProfile.completedMajors ?? [],
							})
						}
						className="flex-1"
					>
						Yes
					</Button>
					<Button
						color="purple"
						size="md"
						active={
							userProfile.starChaser === false ||
							userProfile.starChaser === undefined
						}
						onClick={() => onChange({ ...userProfile, starChaser: false })}
						className="flex-1"
					>
						No
					</Button>
				</div>
				{userProfile.starChaser && (
					<div className="flex flex-wrap gap-2">
						{MARATHON_MAJORS.map((major) => {
							const isCompleted =
								userProfile.completedMajors?.includes(major.key) ?? false;
							return (
								<Button
									key={major.key}
									color={isCompleted ? 'green' : 'gray'}
									size="md"
									active={isCompleted}
									onClick={() => {
										const currentMajors = userProfile.completedMajors ?? [];
										const newMajors = isCompleted
											? currentMajors.filter((m) => m !== major.key)
											: [...currentMajors, major.key];
										onChange({ ...userProfile, completedMajors: newMajors });
									}}
								>
									{major.label}
								</Button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
