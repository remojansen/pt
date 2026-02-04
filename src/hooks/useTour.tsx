import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';

const TOUR_COMPLETED_KEY = 'race-buddy-tour-completed';

interface TourContextValue {
	hasSeenTour: boolean | null;
	runTour: boolean;
	startTour: () => void;
	stopTour: () => void;
	completeTour: () => void;
	resetTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
	const [hasSeenTour, setHasSeenTour] = useState<boolean | null>(null);
	const [runTour, setRunTour] = useState(false);

	useEffect(() => {
		const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
		setHasSeenTour(completed === 'true');
	}, []);

	useEffect(() => {
		// Auto-start tour for first-time visitors after a brief delay
		if (hasSeenTour === false) {
			const timer = setTimeout(() => {
				setRunTour(true);
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [hasSeenTour]);

	const completeTour = useCallback(() => {
		localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
		setHasSeenTour(true);
		setRunTour(false);
	}, []);

	const startTour = useCallback(() => {
		setRunTour(true);
	}, []);

	const stopTour = useCallback(() => {
		setRunTour(false);
	}, []);

	const resetTour = useCallback(() => {
		localStorage.removeItem(TOUR_COMPLETED_KEY);
		setHasSeenTour(false);
	}, []);

	return (
		<TourContext.Provider
			value={{
				hasSeenTour,
				runTour,
				startTour,
				stopTour,
				completeTour,
				resetTour,
			}}
		>
			{children}
		</TourContext.Provider>
	);
}

export function useTour() {
	const context = useContext(TourContext);
	if (!context) {
		throw new Error('useTour must be used within a TourProvider');
	}
	return context;
}
