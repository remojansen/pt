import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useUserData } from './hooks/useUserData';
import { HomePage } from './pages/HomePage';
import { RegistrationPage } from './pages/RegistrationPage';
import { SettingsPage } from './pages/SettingsPage';
import { TrainingSessionPage } from './pages/TrainingSessionPage';

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
		<Layout>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/settings" element={<SettingsPage />} />
				<Route path="/training-session" element={<TrainingSessionPage />} />
			</Routes>
		</Layout>
	);
}

export default App;
