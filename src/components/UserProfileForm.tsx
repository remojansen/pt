import type { UserProfile } from '../hooks/useUserData';
import { Button } from './Button';

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
		</div>
	);
}
