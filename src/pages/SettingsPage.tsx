import { useCallback, useEffect, useState } from 'react';
import { BackupSettingsPanel } from '../components/BackupSettingsPanel';
import { Schedule } from '../components/Schedule';
import { UserProfileForm } from '../components/UserProfileForm';
import type { Schedule as ScheduleType } from '../hooks/useUserData';
import { useUserData } from '../hooks/useUserData';

export function SettingsPage() {
	const { userProfile, setUserProfile, statsEntries, addStatsEntry } =
		useUserData();

	// Get the most recent weight from stats entries
	const latestWeight =
		statsEntries.length > 0 ? statsEntries[0].weightKg : null;
	const [weightKg, setWeightKg] = useState<number | null>(latestWeight);

	// Sync local weight state when stats entries load
	useEffect(() => {
		if (statsEntries.length > 0) {
			setWeightKg(statsEntries[0].weightKg);
		}
	}, [statsEntries]);

	const handleWeightChange = async (newWeight: number | null) => {
		setWeightKg(newWeight);
		if (newWeight !== null) {
			// Add a new stats entry with the updated weight
			await addStatsEntry({
				id: crypto.randomUUID(),
				date: new Date().toISOString().split('T')[0],
				weightKg: newWeight,
				bodyFatPercentage:
					statsEntries.length > 0 ? statsEntries[0].bodyFatPercentage : null,
			});
		}
	};

	const handleScheduleChange = (newSchedule: ScheduleType) => {
		setUserProfile({
			...userProfile,
			schedule: newSchedule,
		});
	};

	// Reload page when data is restored from backup
	const handleDataRestored = useCallback(() => {
		window.location.reload();
	}, []);

	return (
		<div className="min-h-screen bg-gray-950 py-8">
			<div className="max-w-3xl mx-auto px-4">
				<div className="bg-gray-900 rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold text-white mb-4">
						User Profile
					</h2>
					<UserProfileForm
						userProfile={userProfile}
						onChange={setUserProfile}
						weightKg={weightKg}
						onWeightChange={handleWeightChange}
					/>
				</div>

				<div className="bg-gray-900 rounded-lg shadow p-6 mt-6">
					<h2 className="text-xl font-semibold text-white mb-4">
						Training Schedule
					</h2>
					<Schedule
						schedule={userProfile.schedule}
						onChange={handleScheduleChange}
					/>
				</div>

				<div className="bg-gray-900 rounded-lg shadow p-6 mt-6">
					<h2 className="text-xl font-semibold text-white mb-4">
						Backup & Sync
					</h2>
					<div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
						<div className="flex items-start gap-3">
							<span className="text-xl">💡</span>
							<p className="text-sm text-gray-400">
								<span className="text-gray-300 font-medium">Tip:</span> Your data
								is only stored on this device. Remember to back it up periodically
								using the cloud sync feature below.
							</p>
						</div>
					</div>
					<BackupSettingsPanel onDataRestored={handleDataRestored} />
				</div>
			</div>
		</div>
	);
}
