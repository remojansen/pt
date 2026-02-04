import { useEffect, useMemo, useState } from 'react';
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import {
	type Activity,
	ActivityType,
	type Cardio,
	type RaceGoal,
	useUserData,
} from '../hooks/useUserData';
import { Highlight } from './Highlight';
import { HighlightGroup } from './HighlightGroup';
import { Panel } from './Panel';
import {
	getDaysForTimeRange,
	TimeframeFilter,
	type TimeRange,
} from './TimeframeFilter';

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

function getRaceDistanceKm(raceGoal: RaceGoal): number {
	switch (raceGoal) {
		case '10K':
			return 10;
		case 'HalfMarathon':
			return 21.0975;
		case 'FullMarathon':
			return 42.195;
	}
}

function parseRaceTimeToMinutes(raceTimeGoal: string): number | null {
	// Format: H:MM:SS or HH:MM:SS
	const parts = raceTimeGoal.split(':');
	if (parts.length !== 3) return null;

	const hours = Number.parseInt(parts[0], 10);
	const minutes = Number.parseInt(parts[1], 10);
	const seconds = Number.parseInt(parts[2], 10);

	if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
		return null;
	}

	return hours * 60 + minutes + seconds / 60;
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
	const { activityCount, isLoading, userProfile, loadAllUserActivities } =
		useUserData();
	const [allActivities, setAllActivities] = useState<Activity[]>([]);
	const [selectedRange, setSelectedRange] = useState<TimeRange>('1month');

	// Load all activities for charting (beyond default pagination)
	// Re-run when activityCount changes (new activity added/deleted)
	// biome-ignore lint/correctness/useExhaustiveDependencies: activityCount triggers reload when data changes
	useEffect(() => {
		loadAllUserActivities().then(setAllActivities);
	}, [loadAllUserActivities, activityCount]);

	const avgPaceLast30Days = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const thirtyDaysAgo = new Date(today);
		thirtyDaysAgo.setDate(today.getDate() - 30);

		const recentRunningActivities = allActivities.filter(
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
	}, [allActivities]);

	const chartData = useMemo(() => {
		// Filter by time range
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const numDays = getDaysForTimeRange(selectedRange);
		const cutoffDate = new Date(today);
		cutoffDate.setDate(today.getDate() - numDays);

		// Filter running activities
		const runningActivities = allActivities.filter(
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
		return data.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
	}, [allActivities, selectedRange]);

	const targetPace = useMemo(() => {
		if (!userProfile.raceGoal || !userProfile.raceTimeGoal) return null;
		const distanceKm = getRaceDistanceKm(userProfile.raceGoal);
		const totalMinutes = parseRaceTimeToMinutes(userProfile.raceTimeGoal);
		if (totalMinutes === null) return null;
		return totalMinutes / distanceKm;
	}, [userProfile.raceGoal, userProfile.raceTimeGoal]);

	const timeRangeFilter = (
		<TimeframeFilter
			value={selectedRange}
			onChange={setSelectedRange}
			disabled={isLoading}
		/>
	);

	if (isLoading) {
		return (
			<Panel
				title="Running Evolution"
				headerActions={timeRangeFilter}
				dataTour="pace-evolution"
			>
				<div className="h-64 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (chartData.length === 0) {
		return (
			<Panel
				title="Running Evolution"
				headerActions={timeRangeFilter}
				dataTour="pace-evolution"
			>
				<HighlightGroup>
					<Highlight value="N/A" label="Average pace (km)" />
					<Highlight
						value={
							targetPace !== null ? `${formatPace(targetPace)} min` : 'N/A'
						}
						label="Target Pace (km)"
					/>
					<Highlight value="N/A" label="Projected 10K" />
					<Highlight value="N/A" label="Projected 1/2 Marathon" />
					<Highlight value="N/A" label="Projected Full Marathon" />
				</HighlightGroup>
				<div className="h-64 flex items-center justify-center text-gray-400">
					No running activities yet
				</div>
			</Panel>
		);
	}

	return (
		<Panel
			title="Running Evolution"
			headerActions={timeRangeFilter}
			dataTour="pace-evolution"
		>
			{avgPaceLast30Days !== null && (
				<HighlightGroup>
					<Highlight
						value={`${formatPace(avgPaceLast30Days)} min`}
						label="Average pace (km)"
					/>
					<Highlight
						value={
							targetPace !== null ? `${formatPace(targetPace)} min` : 'N/A'
						}
						label="Target Pace (km)"
					/>
					<Highlight
						value={formatTime(avgPaceLast30Days * 10)}
						label="Projected 10K"
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
							domain={[2 + 50 / 60, 8]}
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
						{targetPace !== null && (
							<ReferenceLine
								y={targetPace}
								stroke="#f59e0b"
								strokeWidth={2}
								strokeDasharray="8 4"
								label={{
									value: `Target: ${formatPace(targetPace)}`,
									fill: '#f59e0b',
									fontSize: 12,
									position: 'right',
								}}
							/>
						)}
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
