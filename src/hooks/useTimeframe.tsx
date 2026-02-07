import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from 'react';

export type TimeRange = '1month' | '3months' | '6months' | '1year' | 'all';

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
	'1month': '1 Month',
	'3months': '3 Months',
	'6months': '1/2 Year',
	'1year': '1 Year',
	all: 'All',
};

export function getDaysForTimeRange(range: TimeRange): number {
	switch (range) {
		case '1month':
			return 30;
		case '3months':
			return 90;
		case '6months':
			return 180;
		case '1year':
			return 365;
		case 'all':
			return 10000; // Large number to get all data
	}
}

interface TimeframeContextType {
	timeRange: TimeRange;
	setTimeRange: (range: TimeRange) => void;
}

const TimeframeContext = createContext<TimeframeContextType | undefined>(
	undefined,
);

interface TimeframeProviderProps {
	children: ReactNode;
}

export function TimeframeProvider({ children }: TimeframeProviderProps) {
	const [timeRange, setTimeRangeState] = useState<TimeRange>('3months');

	const setTimeRange = useCallback((range: TimeRange) => {
		setTimeRangeState(range);
	}, []);

	return (
		<TimeframeContext.Provider value={{ timeRange, setTimeRange }}>
			{children}
		</TimeframeContext.Provider>
	);
}

export function useTimeframe(): TimeframeContextType {
	const context = useContext(TimeframeContext);
	if (context === undefined) {
		throw new Error('useTimeframe must be used within a TimeframeProvider');
	}
	return context;
}
