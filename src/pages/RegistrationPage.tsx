import { useState } from 'react';
import { Button } from '../components/Button';
import { UserProfileForm } from '../components/UserProfileForm';
import { type UserProfile, useUserData } from '../hooks/useUserData';

export function RegistrationPage() {
	const { userProfile, setUserProfile, addStatsEntry } = useUserData();
	const [localUserProfile, setLocalUserProfile] =
		useState<UserProfile>(userProfile);
	const [weightKg, setWeightKg] = useState<number | null>(null);

	const isFormComplete =
		localUserProfile.heightCm !== null &&
		localUserProfile.dateOfBirth !== null &&
		localUserProfile.sex !== null &&
		weightKg !== null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isFormComplete && weightKg !== null) {
			setUserProfile(localUserProfile);
			// Create initial stats entry with the weight
			await addStatsEntry({
				id: crypto.randomUUID(),
				date: new Date().toISOString().split('T')[0],
				weightKg,
				bodyFatPercentage: null,
			});
		}
	};

	return (
		<div className="min-h-screen bg-gray-950 flex items-center justify-center py-8 px-4">
			<div className="bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900 rounded-full mb-4">
						<span className="text-3xl">💪</span>
					</div>
					<h1 className="text-3xl font-bold text-white mb-2">
						Welcome to Personal Trainer
					</h1>
					<p className="text-gray-400">
						Let's set up your profile to get started
					</p>
				</div>

				<div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
					<div className="flex items-start gap-3">
						<span className="text-xl">🔒</span>
						<div>
							<p className="text-sm text-gray-300 font-medium mb-1">
								Your privacy is protected
							</p>
							<p className="text-xs text-gray-400">
								Your information stays on your device only. Nothing is sent to
								the internet or stored on any external server. Your data belongs
								to you and you alone.
							</p>
						</div>
					</div>
				</div>

				<form onSubmit={handleSubmit}>
					<UserProfileForm
						userProfile={localUserProfile}
						onChange={setLocalUserProfile}
						weightKg={weightKg}
						onWeightChange={setWeightKg}
					/>

					<Button
						type="submit"
						variant="primary"
						color="purple"
						size="lg"
						fullWidth
						disabled={!isFormComplete}
						className="mt-8"
					>
						Get Started
					</Button>
				</form>
			</div>
		</div>
	);
}
