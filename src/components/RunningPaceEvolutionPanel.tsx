import { useMemo, useState } from 'react';
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { ActivityType, type Cardio, useUserData } from '../hooks/useUserData';
import { Button } from './Button';
import { Highlight } from './Highlight';
import { HighlightGroup } from './HighlightGroup';
import { Panel } from './Panel';

type TimeRange = '1month' | '3months' | '6months' | '1year' | 'all';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
	'1month': '1 Month',
	'3months': '3 Months',
	'6months': '1/2 Year',
	'1year': '1 Year',
	all: 'All',
};

function getDaysForTimeRange(range: TimeRange): number {
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

interface ChartDataPoint {
	date: string;
	formattedDate: string;
	roadRunPace: number | null;
	treadmillRunPace: number | null;
	avgPace: number | null;
}

function calculatePace(
	distanceInKm: number,
	durationInSeconds: number,
): number {
	// Pace in min/km
	const durationInMinutes = durationInSeconds / 60;
	return durationInMinutes / distanceInKm;
}

function formatPace(paceMinPerKm: number): string {
	const minutes = Math.floor(paceMinPerKm);
	const seconds = Math.round((paceMinPerKm - minutes) * 60);
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatTime(totalMinutes: number): string {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = Math.floor(totalMinutes % 60);
	const seconds = Math.round((totalMinutes - Math.floor(totalMinutes)) * 60);
	return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: Array<{
		payload: ChartDataPoint;
		dataKey: string;
		color: string;
		name: string;
		value: number | null;
	}>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;

	const data = payload[0].payload;

	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
			<p className="text-gray-300 text-sm mb-2">{data.formattedDate}</p>
			{data.roadRunPace !== null && (
				<p className="text-white">
					Road Run:{' '}
					<span className="text-blue-400">
						{formatPace(data.roadRunPace)} min/km
					</span>
				</p>
			)}
			{data.treadmillRunPace !== null && (
				<p className="text-white">
					Treadmill:{' '}
					<span className="text-green-400">
						{formatPace(data.treadmillRunPace)} min/km
					</span>
				</p>
			)}
			{data.avgPace !== null && (
				<p className="text-white">
					Average:{' '}
					<span className="text-purple-400">
						{formatPace(data.avgPace)} min/km
					</span>
				</p>
			)}
		</div>
	);
}

export function RunningPaceEvolutionPanel() {
	const { activities, isLoading } = useUserData();
	const [selectedRange, setSelectedRange] = useState<TimeRange>('1month');
	const [isCalculating, setIsCalculating] = useState(false);

	const avgPaceLast30Days = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const thirtyDaysAgo = new Date(today);
		thirtyDaysAgo.setDate(today.getDate() - 30);

		const recentRunningActivities = activities.filter(
			(a): a is Cardio =>
				(a.type === ActivityType.RoadRun ||
					a.type === ActivityType.TreadmillRun) &&
				new Date(a.date) >= thirtyDaysAgo &&
				a.distanceInKm > 0 &&
				a.durationInSeconds > 0,
		);

		if (recentRunningActivities.length === 0) return null;

		const totalPace = recentRunningActivities.reduce(
			(sum, a) => sum + calculatePace(a.distanceInKm, a.durationInSeconds),
			0,
		);

		return totalPace / recentRunningActivities.length;
	}, [activities]);

	const chartData = useMemo(() => {
		setIsCalculating(true);
		// Filter by time range
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const numDays = getDaysForTimeRange(selectedRange);
		const cutoffDate = new Date(today);
		cutoffDate.setDate(today.getDate() - numDays);

		// Filter running activities
		const runningActivities = activities.filter(
			(a): a is Cardio =>
				(a.type === ActivityType.RoadRun ||
					a.type === ActivityType.TreadmillRun) &&
				new Date(a.date) >= cutoffDate,
		);

		if (runningActivities.length === 0) return [];

		// Group activities by date
		const activitiesByDate = new Map<
			string,
			{ roadRun: number[]; treadmill: number[] }
		>();

		for (const activity of runningActivities) {
			if (activity.distanceInKm <= 0 || activity.durationInSeconds <= 0)
				continue;

			const pace = calculatePace(
				activity.distanceInKm,
				activity.durationInSeconds,
			);
			const dateKey = activity.date;

			if (!activitiesByDate.has(dateKey)) {
				activitiesByDate.set(dateKey, { roadRun: [], treadmill: [] });
			}

			const dateData = activitiesByDate.get(dateKey);
			if (!dateData) continue;

			if (activity.type === ActivityType.RoadRun) {
				dateData.roadRun.push(pace);
			} else {
				dateData.treadmill.push(pace);
			}
		}

		// Convert to chart data
		const data: ChartDataPoint[] = [];
		for (const [date, paces] of activitiesByDate) {
			const roadRunPace =
				paces.roadRun.length > 0
					? paces.roadRun.reduce((a, b) => a + b, 0) / paces.roadRun.length
					: null;
			const treadmillRunPace =
				paces.treadmill.length > 0
					? paces.treadmill.reduce((a, b) => a + b, 0) / paces.treadmill.length
					: null;

			const allPaces = [...paces.roadRun, ...paces.treadmill];
			const avgPace =
				allPaces.length > 0
					? allPaces.reduce((a, b) => a + b, 0) / allPaces.length
					: null;

			data.push({
				date,
				formattedDate: new Date(date).toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
				}),
				roadRunPace,
				treadmillRunPace,
				avgPace,
			});
		}

		// Sort by date ascending
		const sortedData = data.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
		setIsCalculating(false);
		return sortedData;
	}, [activities, selectedRange]);

	const timeRangeButtons = (
		<div className="flex gap-2">
			{(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
				<Button
					key={range}
					variant={selectedRange === range ? 'primary' : 'secondary'}
					color="blue"
					onClick={() => setSelectedRange(range)}
					disabled={isLoading || isCalculating}
				>
					{TIME_RANGE_LABELS[range]}
				</Button>
			))}
		</div>
	);

	if (isLoading) {
		return (
			<Panel title="Running Pace Evolution" headerActions={timeRangeButtons}>
				<div className="h-64 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (isCalculating) {
		return (
			<Panel title="Running Pace Evolution" headerActions={timeRangeButtons}>
				<div className="h-64 flex items-center justify-center text-gray-400">
					Calculating...
				</div>
			</Panel>
		);
	}

	if (chartData.length === 0) {
		return (
			<Panel title="Running Pace Evolution" headerActions={timeRangeButtons}>
				<div className="h-64 flex items-center justify-center text-gray-400">
					No running activities yet
				</div>
			</Panel>
		);
	}

	return (
		<Panel title="Running Pace Evolution" headerActions={timeRangeButtons}>
			{avgPaceLast30Days !== null && (
				<HighlightGroup>
					<Highlight
						value={`${formatPace(avgPaceLast30Days)} min`}
						label="Average pace (km)"
					/>
					<Highlight
						value={formatTime(avgPaceLast30Days * 21.0975)}
						label="Projected 1/2 Marathon"
					/>
					<Highlight
						value={formatTime(avgPaceLast30Days * 42.195)}
						label="Projected Full Marathon"
					/>
				</HighlightGroup>
			)}
			<div className="h-80 min-w-0 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart
						data={chartData}
						margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
						<XAxis
							dataKey="formattedDate"
							tick={{ fill: '#9ca3af', fontSize: 12 }}
							tickLine={{ stroke: '#4b5563' }}
							axisLine={{ stroke: '#4b5563' }}
						/>
						<YAxis
							tick={{ fill: '#9ca3af', fontSize: 12 }}
							tickLine={{ stroke: '#4b5563' }}
							axisLine={{ stroke: '#4b5563' }}
							reversed
							tickFormatter={(value) => formatPace(value)}
							label={{
								value: 'Pace (min/km)',
								angle: -90,
								position: 'insideLeft',
								fill: '#9ca3af',
								fontSize: 12,
							}}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Legend
							wrapperStyle={{ color: '#9ca3af' }}
							formatter={(value) => (
								<span className="text-gray-300">{value}</span>
							)}
						/>
						<Line
							type="monotone"
							dataKey="roadRunPace"
							stroke="#3b82f6"
							strokeWidth={2}
							dot={{ fill: '#3b82f6', r: 4 }}
							activeDot={{ r: 8, stroke: '#f3f4f6', strokeWidth: 2 }}
							name="Road Run"
							connectNulls
						/>
						<Line
							type="monotone"
							dataKey="treadmillRunPace"
							stroke="#22c55e"
							strokeWidth={2}
							dot={{ fill: '#22c55e', r: 4 }}
							activeDot={{ r: 8, stroke: '#f3f4f6', strokeWidth: 2 }}
							name="Treadmill Run"
							connectNulls
						/>
						<Line
							type="monotone"
							dataKey="avgPace"
							stroke="#a855f7"
							strokeWidth={2}
							strokeDasharray="5 5"
							dot={{ fill: '#a855f7', r: 4 }}
							activeDot={{ r: 8, stroke: '#f3f4f6', strokeWidth: 2 }}
							name="Avg Pace"
							connectNulls
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</Panel>
	);
}
