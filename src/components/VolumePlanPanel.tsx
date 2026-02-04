import { useMemo } from 'react';
import {
	Bar,
	ComposedChart,
	Legend,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import {
	generateTrainingPlan,
	getWeeklyRunningStats,
	type WeeklyVolumePlan,
} from '../data/volume';
import { useUserData } from '../hooks/useUserData';
import { Highlight } from './Highlight';
import { HighlightGroup } from './HighlightGroup';
import { Panel } from './Panel';

interface ChartDataPoint {
	weekLabel: string;
	weeklyVolumeKm: number;
	longRunKm: number;
	isCutbackWeek: boolean;
	isTaperWeek: boolean;
	isPeakWeek: boolean;
	isCurrentWeek: boolean;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: Array<{
		payload: ChartDataPoint;
		dataKey: string;
		color: string;
		name: string;
		value: number;
	}>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;

	const data = payload[0].payload;

	let weekType = '';
	if (data.isPeakWeek) weekType = '🏔️ Peak Week';
	else if (data.isTaperWeek) weekType = '⚡ Taper Week';
	else if (data.isCutbackWeek) weekType = '🔄 Cutback Week';
	else weekType = '📈 Build Week';

	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
			<p className="text-gray-300 text-sm mb-1">
				{data.weekLabel}
				{data.isCurrentWeek && (
					<span className="ml-2 text-purple-400">(Current)</span>
				)}
			</p>
			<p className="text-xs text-gray-400 mb-2">{weekType}</p>
			<p className="text-white">
				Weekly Volume:{' '}
				<span className="text-purple-400 font-semibold">
					{data.weeklyVolumeKm} km
				</span>
			</p>
			<p className="text-white">
				Long Run:{' '}
				<span className="text-blue-400 font-semibold">{data.longRunKm} km</span>
			</p>
		</div>
	);
}

function getBarColor(data: WeeklyVolumePlan): string {
	if (data.isCurrentWeek) return '#a855f7'; // purple-500
	if (data.isPeakWeek) return '#22c55e'; // green-500
	if (data.isTaperWeek) return '#eab308'; // yellow-500
	if (data.isCutbackWeek) return '#3b82f6'; // blue-500
	return '#6b7280'; // gray-500
}

export function VolumePlanPanel() {
	const { userProfile, activities, isLoading } = useUserData();

	const lastWeekStats = useMemo(() => {
		const lastWeekStart = new Date();
		lastWeekStart.setDate(lastWeekStart.getDate() - 7);
		return getWeeklyRunningStats(activities, lastWeekStart);
	}, [activities]);

	const trainingPlan = useMemo(() => {
		if (!userProfile.raceGoal || !userProfile.raceDate) return null;
		return generateTrainingPlan(
			new Date(),
			userProfile.raceGoal,
			userProfile.raceDate,
			lastWeekStats.totalDistanceKm,
		);
	}, [
		userProfile.raceGoal,
		userProfile.raceDate,
		lastWeekStats.totalDistanceKm,
	]);

	const chartData: ChartDataPoint[] = useMemo(() => {
		if (!trainingPlan) return [];
		return trainingPlan.map((week) => ({
			weekLabel: week.weekLabel,
			weeklyVolumeKm: week.weeklyVolumeKm,
			longRunKm: week.longRunKm,
			isCutbackWeek: week.isCutbackWeek,
			isTaperWeek: week.isTaperWeek,
			isPeakWeek: week.isPeakWeek,
			isCurrentWeek: week.isCurrentWeek,
		}));
	}, [trainingPlan]);

	const summaryStats = useMemo(() => {
		if (!trainingPlan || trainingPlan.length === 0) return null;

		const peakWeek = trainingPlan.find((w) => w.isPeakWeek);
		const currentWeek = trainingPlan.find((w) => w.isCurrentWeek);
		const totalVolume = trainingPlan.reduce(
			(sum, w) => sum + w.weeklyVolumeKm,
			0,
		);

		return {
			weeksRemaining: trainingPlan.length,
			peakVolumeKm: peakWeek?.weeklyVolumeKm ?? 0,
			currentVolumeKm: currentWeek?.weeklyVolumeKm ?? 0,
			totalPlanVolumeKm: Math.round(totalVolume),
			peakLongRunKm: peakWeek?.longRunKm ?? 0,
		};
	}, [trainingPlan]);

	if (isLoading) {
		return (
			<Panel title="Volume Training Plan" dataTour="volume-plan">
				<div className="h-64 flex items-center justify-center text-gray-400">
					Loading...
				</div>
			</Panel>
		);
	}

	if (!userProfile.raceGoal || !userProfile.raceDate) {
		return (
			<Panel title="Volume Training Plan" dataTour="volume-plan">
				<div className="h-64 flex items-center justify-center text-gray-400">
					<div className="text-center">
						<p className="mb-2">No race goal configured</p>
						<p className="text-sm">
							Set a race goal and date in Settings to see your training plan
						</p>
					</div>
				</div>
			</Panel>
		);
	}

	if (!trainingPlan || trainingPlan.length === 0) {
		return (
			<Panel title="Volume Training Plan" dataTour="volume-plan">
				<div className="h-64 flex items-center justify-center text-gray-400">
					<div className="text-center">
						<p className="mb-2">Race date is in the past</p>
						<p className="text-sm">Update your race date to see a new plan</p>
					</div>
				</div>
			</Panel>
		);
	}

	return (
		<Panel title="Volume Training Plan" dataTour="volume-plan">
			{summaryStats && (
				<HighlightGroup>
					<Highlight
						value={`${summaryStats.weeksRemaining} weeks`}
						label="Until Race"
					/>
					<Highlight
						value={`${summaryStats.currentVolumeKm} km`}
						label="This Week Target"
					/>
					<Highlight
						value={`${summaryStats.peakVolumeKm} km`}
						label="Peak Week Volume"
					/>
					<Highlight
						value={`${summaryStats.peakLongRunKm} km`}
						label="Peak Long Run"
					/>
					<Highlight
						value={`${summaryStats.totalPlanVolumeKm} km`}
						label="Total Plan Volume"
					/>
				</HighlightGroup>
			)}

			<div className="mt-4 flex flex-wrap gap-3 text-xs">
				<div className="flex items-center gap-1">
					<div className="w-3 h-3 rounded bg-purple-500" />
					<span className="text-gray-400">Current</span>
				</div>
				<div className="flex items-center gap-1">
					<div className="w-3 h-3 rounded bg-gray-500" />
					<span className="text-gray-400">Build</span>
				</div>
				<div className="flex items-center gap-1">
					<div className="w-3 h-3 rounded bg-blue-500" />
					<span className="text-gray-400">Cutback</span>
				</div>
				<div className="flex items-center gap-1">
					<div className="w-3 h-3 rounded bg-green-500" />
					<span className="text-gray-400">Peak</span>
				</div>
				<div className="flex items-center gap-1">
					<div className="w-3 h-3 rounded bg-yellow-500" />
					<span className="text-gray-400">Taper</span>
				</div>
			</div>

			<div className="h-80 min-w-0 w-full mt-4">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={chartData}
						margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
					>
						<XAxis
							dataKey="weekLabel"
							tick={{ fill: '#9ca3af', fontSize: 11 }}
							tickLine={{ stroke: '#4b5563' }}
							axisLine={{ stroke: '#4b5563' }}
							interval={chartData.length > 12 ? 1 : 0}
							angle={chartData.length > 8 ? -45 : 0}
							textAnchor={chartData.length > 8 ? 'end' : 'middle'}
							height={chartData.length > 8 ? 60 : 30}
						/>
						<YAxis
							yAxisId="volume"
							tick={{ fill: '#9ca3af', fontSize: 12 }}
							tickLine={{ stroke: '#4b5563' }}
							axisLine={{ stroke: '#4b5563' }}
							label={{
								value: 'km',
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
						<Bar
							yAxisId="volume"
							dataKey="weeklyVolumeKm"
							name="Weekly Volume"
							radius={[4, 4, 0, 0]}
							fill="#6b7280"
							// Dynamic fill based on week type
							// biome-ignore lint/suspicious/noExplicitAny: recharts types
							shape={(props: any) => {
								const { x, y, width, height, payload } = props;
								const fill = getBarColor(payload);
								return (
									<rect
										x={x}
										y={y}
										width={width}
										height={height}
										fill={fill}
										rx={4}
										ry={4}
									/>
								);
							}}
						/>
						<Line
							yAxisId="volume"
							type="monotone"
							dataKey="longRunKm"
							name="Long Run"
							stroke="#3b82f6"
							strokeWidth={3}
							dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#1e3a5f' }}
							activeDot={{ r: 6, stroke: '#f3f4f6', strokeWidth: 2 }}
						/>
					</ComposedChart>
				</ResponsiveContainer>
			</div>
		</Panel>
	);
}
