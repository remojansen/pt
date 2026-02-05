import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppTour } from './components/AppTour';
import { InstallPrompt } from './components/InstallPrompt';
import { Layout } from './components/Layout';
import { useBackup } from './hooks/useBackup';
import { TimeframeProvider } from './hooks/useTimeframe';
import { TourProvider } from './hooks/useTour';
import { useUserData } from './hooks/useUserData';
import { HomePage } from './pages/HomePage';
import { LogPage } from './pages/LogPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { SettingsPage } from './pages/SettingsPage';
import { TrainingSessionPage } from './pages/TrainingSessionPage';

function AutoBackupSync() {
	const [hasRestored, setHasRestored] = useState(false);
	const { hasFolderAccess, syncBackup, isLoading } = useBackup(() => {
		setHasRestored(true);
	});

	useEffect(() => {
		// Auto-sync when app loads and folder access is available
		if (hasFolderAccess && !isLoading) {
			syncBackup();
		}
	}, [hasFolderAccess, isLoading, syncBackup]);

	useEffect(() => {
		// Reload page if data was restored from backup
		if (hasRestored) {
			window.location.reload();
		}
	}, [hasRestored]);

	return null;
}

function App() {
	const { isLoading, isRegistered } = useUserData();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-gray-600">Loading...</div>
			</div>
		);
	}

	if (!isRegistered) {
		return <RegistrationPage />;
	}

	return (
		<TourProvider>
			<TimeframeProvider>
				<Layout>
					<AutoBackupSync />
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/log" element={<LogPage />} />
						<Route path="/settings" element={<SettingsPage />} />
						<Route path="/training-session" element={<TrainingSessionPage />} />
					</Routes>
					<InstallPrompt />
					<AppTour />
				</Layout>
			</TimeframeProvider>
		</TourProvider>
	);
}

export default App;
