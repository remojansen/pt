import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Panel } from '../components/Panel';
import {
	type Activity,
	ActivityType,
	type ActivityTypeKey,
	type Cardio,
	type DietEntry,
	type Strength,
	type UserStatsEntry,
	useUserData,
} from '../hooks/useUserData';

const ACTIVITY_LABELS: Record<ActivityTypeKey, string> = {
	[ActivityType.RoadRun]: 'Road Run',
	[ActivityType.TreadmillRun]: 'Treadmill Run',
	[ActivityType.PoolSwim]: 'Pool Swim',
	[ActivityType.SeaSwim]: 'Sea Swim',
	[ActivityType.RoadCycle]: 'Road Cycle',
	[ActivityType.IndoorCycle]: 'Indoor Cycle',
	[ActivityType.StrengthTrainingLegs]: 'Strength - Legs',
	[ActivityType.StrengthTrainingArms]: 'Strength - Arms',
	[ActivityType.StrengthTrainingCore]: 'Strength - Core',
	[ActivityType.StrengthTrainingShoulders]: 'Strength - Shoulders',
	[ActivityType.StrengthTrainingBack]: 'Strength - Back',
	[ActivityType.StrengthTrainingChest]: 'Strength - Chest',
};

function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Activities Table
function ActivitiesTable() {
	const { loadAllUserActivities, updateActivities, deleteActivity } =
		useUserData();

	const [activities, setActivities] = useState<Activity[]>([]);
	const [loading, setLoading] = useState(true);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'date', desc: true },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState('');

	// Edit modal state
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
	const [editForm, setEditForm] = useState({
		date: '',
		durationMinutes: '',
		durationSeconds: '',
		distanceKm: '',
	});

	// Delete confirmation state
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deletingActivity, setDeletingActivity] = useState<Activity | null>(
		null,
	);

	useEffect(() => {
		loadAllUserActivities().then((data) => {
			setActivities(data);
			setLoading(false);
		});
	}, [loadAllUserActivities]);

	const openEditModal = useCallback((activity: Activity) => {
		setEditingActivity(activity);
		const isCardio = 'distanceInKm' in activity;
		setEditForm({
			date: activity.date,
			durationMinutes: Math.floor(activity.durationInSeconds / 60).toString(),
			durationSeconds: (activity.durationInSeconds % 60).toString(),
			distanceKm: isCardio ? (activity as Cardio).distanceInKm.toString() : '',
		});
		setEditModalOpen(true);
	}, []);

	const handleSaveEdit = async () => {
		if (!editingActivity) return;

		const durationInSeconds =
			(parseInt(editForm.durationMinutes, 10) || 0) * 60 +
			(parseInt(editForm.durationSeconds, 10) || 0);

		const isCardio = 'distanceInKm' in editingActivity;
		let updatedActivity: Activity;

		if (isCardio) {
			updatedActivity = {
				...editingActivity,
				date: editForm.date,
				durationInSeconds,
				distanceInKm: parseFloat(editForm.distanceKm) || 0,
			} as Cardio;
		} else {
			updatedActivity = {
				...editingActivity,
				date: editForm.date,
				durationInSeconds,
			} as Strength;
		}

		const updatedActivities = activities.map((a) =>
			a.id === editingActivity.id ? updatedActivity : a,
		);
		await updateActivities(updatedActivities);
		setActivities(updatedActivities);
		setEditModalOpen(false);
		setEditingActivity(null);
	};

	const openDeleteModal = useCallback((activity: Activity) => {
		setDeletingActivity(activity);
		setDeleteModalOpen(true);
	}, []);

	const handleConfirmDelete = async () => {
		if (!deletingActivity) return;
		await deleteActivity(deletingActivity.id);
		setActivities((prev) => prev.filter((a) => a.id !== deletingActivity.id));
		setDeleteModalOpen(false);
		setDeletingActivity(null);
	};

	const columns = useMemo<ColumnDef<Activity>[]>(
		() => [
			{
				accessorKey: 'date',
				header: 'Date',
				cell: (info) => info.getValue(),
			},
			{
				accessorKey: 'type',
				header: 'Type',
				cell: (info) =>
					ACTIVITY_LABELS[info.getValue() as ActivityTypeKey] ||
					info.getValue(),
			},
			{
				id: 'duration',
				header: 'Duration',
				accessorFn: (row) => formatDuration(row.durationInSeconds),
			},
			{
				id: 'distance',
				header: 'Distance (km)',
				accessorFn: (row) => {
					if ('distanceInKm' in row) {
						return (row as Cardio).distanceInKm.toFixed(2);
					}
					return '-';
				},
			},
			{
				id: 'actions',
				header: 'Actions',
				cell: ({ row }) => (
					<div className="flex gap-2">
						<Button
							variant="ghost"
							color="purple"
							size="sm"
							onClick={() => openEditModal(row.original)}
						>
							Edit
						</Button>
						<Button
							variant="ghost"
							color="gray"
							size="sm"
							onClick={() => openDeleteModal(row.original)}
						>
							Delete
						</Button>
					</div>
				),
			},
		],
		[openEditModal, openDeleteModal],
	);

	const table = useReactTable({
		data: activities,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	});

	if (loading) {
		return (
			<Panel title="Activities">
				<div className="text-gray-400 text-center py-8">
					Loading activities...
				</div>
			</Panel>
		);
	}

	return (
		<>
			<Panel
				title="Activities"
				headerActions={
					<span className="text-sm text-gray-400">
						{activities.length} total
					</span>
				}
			>
				<div className="space-y-4">
					<input
						type="text"
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
						placeholder="Search activities..."
						className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
					/>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr key={headerGroup.id} className="border-b border-gray-800">
										{headerGroup.headers.map((header) => (
											<th
												key={header.id}
												className="px-4 py-3 text-left text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
												onClick={header.column.getToggleSortingHandler()}
											>
												<div className="flex items-center gap-1">
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{{
														asc: ' ↑',
														desc: ' ↓',
													}[header.column.getIsSorted() as string] ?? null}
												</div>
											</th>
										))}
									</tr>
								))}
							</thead>
							<tbody>
								{table.getRowModel().rows.length === 0 ? (
									<tr>
										<td
											colSpan={columns.length}
											className="px-4 py-8 text-center text-gray-500"
										>
											No activities found
										</td>
									</tr>
								) : (
									table.getRowModel().rows.map((row) => (
										<tr
											key={row.id}
											className="border-b border-gray-800 hover:bg-gray-800/50"
										>
											{row.getVisibleCells().map((cell) => (
												<td
													key={cell.id}
													className="px-4 py-3 text-sm text-gray-300"
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</td>
											))}
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					<div className="flex items-center justify-between">
						<div className="text-sm text-gray-400">
							Page {table.getState().pagination.pageIndex + 1} of{' '}
							{table.getPageCount()}
						</div>
						<div className="flex gap-2">
							<Button
								variant="ghost"
								color="gray"
								size="sm"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								Previous
							</Button>
							<Button
								variant="ghost"
								color="gray"
								size="sm"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</Panel>

			{/* Edit Modal */}
			<Modal
				isOpen={editModalOpen}
				onClose={() => setEditModalOpen(false)}
				title="Edit Activity"
				primaryAction={{ label: 'Save', onClick: handleSaveEdit }}
				secondaryAction={{
					label: 'Cancel',
					onClick: () => setEditModalOpen(false),
				}}
			>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="activity-edit-date"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Date
						</label>
						<input
							id="activity-edit-date"
							type="date"
							value={editForm.date}
							onChange={(e) =>
								setEditForm({ ...editForm, date: e.target.value })
							}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="activity-edit-minutes"
								className="block text-sm font-medium text-gray-300 mb-1"
							>
								Minutes
							</label>
							<input
								id="activity-edit-minutes"
								type="number"
								min="0"
								value={editForm.durationMinutes}
								onChange={(e) =>
									setEditForm({ ...editForm, durationMinutes: e.target.value })
								}
								className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
							/>
						</div>
						<div>
							<label
								htmlFor="activity-edit-seconds"
								className="block text-sm font-medium text-gray-300 mb-1"
							>
								Seconds
							</label>
							<input
								id="activity-edit-seconds"
								type="number"
								min="0"
								max="59"
								value={editForm.durationSeconds}
								onChange={(e) =>
									setEditForm({ ...editForm, durationSeconds: e.target.value })
								}
								className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
							/>
						</div>
					</div>
					{editingActivity && 'distanceInKm' in editingActivity && (
						<div>
							<label
								htmlFor="activity-edit-distance"
								className="block text-sm font-medium text-gray-300 mb-1"
							>
								Distance (km)
							</label>
							<input
								id="activity-edit-distance"
								type="number"
								step="0.01"
								min="0"
								value={editForm.distanceKm}
								onChange={(e) =>
									setEditForm({ ...editForm, distanceKm: e.target.value })
								}
								className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
							/>
						</div>
					)}
				</div>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={deleteModalOpen}
				onClose={() => setDeleteModalOpen(false)}
				title="Delete Activity"
				primaryAction={{ label: 'Delete', onClick: handleConfirmDelete }}
				secondaryAction={{
					label: 'Cancel',
					onClick: () => setDeleteModalOpen(false),
				}}
			>
				<p className="text-gray-300">
					Are you sure you want to delete this activity? This action cannot be
					undone.
				</p>
			</Modal>
		</>
	);
}

// Stats Table (Weight entries)
function StatsTable() {
	const { loadAllUserStatsEntries, updateStatsEntries, deleteStatsEntry } =
		useUserData();

	const [stats, setStats] = useState<UserStatsEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'date', desc: true },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState('');

	// Edit modal state
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editingEntry, setEditingEntry] = useState<UserStatsEntry | null>(null);
	const [editForm, setEditForm] = useState({
		date: '',
		weightKg: '',
		bodyFatPercentage: '',
	});

	// Delete confirmation state
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deletingEntry, setDeletingEntry] = useState<UserStatsEntry | null>(
		null,
	);

	useEffect(() => {
		loadAllUserStatsEntries().then((data) => {
			setStats(data);
			setLoading(false);
		});
	}, [loadAllUserStatsEntries]);

	const openEditModal = useCallback((entry: UserStatsEntry) => {
		setEditingEntry(entry);
		setEditForm({
			date: entry.date,
			weightKg: entry.weightKg.toString(),
			bodyFatPercentage: entry.bodyFatPercentage?.toString() || '',
		});
		setEditModalOpen(true);
	}, []);

	const handleSaveEdit = async () => {
		if (!editingEntry) return;

		const updatedEntry: UserStatsEntry = {
			...editingEntry,
			date: editForm.date,
			weightKg: parseFloat(editForm.weightKg) || 0,
			bodyFatPercentage: editForm.bodyFatPercentage
				? parseFloat(editForm.bodyFatPercentage)
				: null,
		};

		const updatedStats = stats.map((s) =>
			s.id === editingEntry.id ? updatedEntry : s,
		);
		await updateStatsEntries(updatedStats);
		setStats(updatedStats);
		setEditModalOpen(false);
		setEditingEntry(null);
	};

	const openDeleteModal = useCallback((entry: UserStatsEntry) => {
		setDeletingEntry(entry);
		setDeleteModalOpen(true);
	}, []);

	const handleConfirmDelete = async () => {
		if (!deletingEntry) return;
		await deleteStatsEntry(deletingEntry.id);
		setStats((prev) => prev.filter((s) => s.id !== deletingEntry.id));
		setDeleteModalOpen(false);
		setDeletingEntry(null);
	};

	const columns = useMemo<ColumnDef<UserStatsEntry>[]>(
		() => [
			{
				accessorKey: 'date',
				header: 'Date',
				cell: (info) => info.getValue(),
			},
			{
				accessorKey: 'weightKg',
				header: 'Weight (kg)',
				cell: (info) => (info.getValue() as number).toFixed(1),
			},
			{
				accessorKey: 'bodyFatPercentage',
				header: 'Body Fat (%)',
				cell: (info) => {
					const value = info.getValue() as number | null;
					return value !== null ? value.toFixed(1) : '-';
				},
			},
			{
				id: 'actions',
				header: 'Actions',
				cell: ({ row }) => (
					<div className="flex gap-2">
						<Button
							variant="ghost"
							color="purple"
							size="sm"
							onClick={() => openEditModal(row.original)}
						>
							Edit
						</Button>
						<Button
							variant="ghost"
							color="gray"
							size="sm"
							onClick={() => openDeleteModal(row.original)}
						>
							Delete
						</Button>
					</div>
				),
			},
		],
		[openEditModal, openDeleteModal],
	);

	const table = useReactTable({
		data: stats,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	});

	if (loading) {
		return (
			<Panel title="Weight Log">
				<div className="text-gray-400 text-center py-8">
					Loading weight entries...
				</div>
			</Panel>
		);
	}

	return (
		<>
			<Panel
				title="Weight Log"
				headerActions={
					<span className="text-sm text-gray-400">{stats.length} total</span>
				}
			>
				<div className="space-y-4">
					<input
						type="text"
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
						placeholder="Search weight entries..."
						className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
					/>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr key={headerGroup.id} className="border-b border-gray-800">
										{headerGroup.headers.map((header) => (
											<th
												key={header.id}
												className="px-4 py-3 text-left text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
												onClick={header.column.getToggleSortingHandler()}
											>
												<div className="flex items-center gap-1">
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{{
														asc: ' ↑',
														desc: ' ↓',
													}[header.column.getIsSorted() as string] ?? null}
												</div>
											</th>
										))}
									</tr>
								))}
							</thead>
							<tbody>
								{table.getRowModel().rows.length === 0 ? (
									<tr>
										<td
											colSpan={columns.length}
											className="px-4 py-8 text-center text-gray-500"
										>
											No weight entries found
										</td>
									</tr>
								) : (
									table.getRowModel().rows.map((row) => (
										<tr
											key={row.id}
											className="border-b border-gray-800 hover:bg-gray-800/50"
										>
											{row.getVisibleCells().map((cell) => (
												<td
													key={cell.id}
													className="px-4 py-3 text-sm text-gray-300"
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</td>
											))}
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					<div className="flex items-center justify-between">
						<div className="text-sm text-gray-400">
							Page {table.getState().pagination.pageIndex + 1} of{' '}
							{table.getPageCount()}
						</div>
						<div className="flex gap-2">
							<Button
								variant="ghost"
								color="gray"
								size="sm"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								Previous
							</Button>
							<Button
								variant="ghost"
								color="gray"
								size="sm"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</Panel>

			{/* Edit Modal */}
			<Modal
				isOpen={editModalOpen}
				onClose={() => setEditModalOpen(false)}
				title="Edit Weight Entry"
				primaryAction={{ label: 'Save', onClick: handleSaveEdit }}
				secondaryAction={{
					label: 'Cancel',
					onClick: () => setEditModalOpen(false),
				}}
			>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="stats-edit-date"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Date
						</label>
						<input
							id="stats-edit-date"
							type="date"
							value={editForm.date}
							onChange={(e) =>
								setEditForm({ ...editForm, date: e.target.value })
							}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
						/>
					</div>
					<div>
						<label
							htmlFor="stats-edit-weight"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Weight (kg)
						</label>
						<input
							id="stats-edit-weight"
							type="number"
							step="0.1"
							min="0"
							value={editForm.weightKg}
							onChange={(e) =>
								setEditForm({ ...editForm, weightKg: e.target.value })
							}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
						/>
					</div>
					<div>
						<label
							htmlFor="stats-edit-bodyfat"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Body Fat (%)
						</label>
						<input
							id="stats-edit-bodyfat"
							type="number"
							step="0.1"
							min="0"
							max="100"
							value={editForm.bodyFatPercentage}
							onChange={(e) =>
								setEditForm({ ...editForm, bodyFatPercentage: e.target.value })
							}
							placeholder="Optional"
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
						/>
					</div>
				</div>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={deleteModalOpen}
				onClose={() => setDeleteModalOpen(false)}
				title="Delete Weight Entry"
				primaryAction={{ label: 'Delete', onClick: handleConfirmDelete }}
				secondaryAction={{
					label: 'Cancel',
					onClick: () => setDeleteModalOpen(false),
				}}
			>
				<p className="text-gray-300">
					Are you sure you want to delete this weight entry? This action cannot
					be undone.
				</p>
			</Modal>
		</>
	);
}

// Meals Table (Diet entries)
function MealsTable() {
	const { loadAllUserDietEntries, updateDietEntries, deleteDietEntry } =
		useUserData();

	const [meals, setMeals] = useState<DietEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'date', desc: true },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState('');

	// Edit modal state
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editingEntry, setEditingEntry] = useState<DietEntry | null>(null);
	const [editForm, setEditForm] = useState({
		date: '',
		calories: '',
	});

	// Delete confirmation state
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deletingEntry, setDeletingEntry] = useState<DietEntry | null>(null);

	useEffect(() => {
		loadAllUserDietEntries().then((data) => {
			setMeals(data);
			setLoading(false);
		});
	}, [loadAllUserDietEntries]);

	const openEditModal = useCallback((entry: DietEntry) => {
		setEditingEntry(entry);
		setEditForm({
			date: entry.date,
			calories: entry.calories.toString(),
		});
		setEditModalOpen(true);
	}, []);

	const handleSaveEdit = async () => {
		if (!editingEntry) return;

		const updatedEntry: DietEntry = {
			...editingEntry,
			date: editForm.date,
			calories: parseInt(editForm.calories, 10) || 0,
		};

		const updatedMeals = meals.map((m) =>
			m.id === editingEntry.id ? updatedEntry : m,
		);
		await updateDietEntries(updatedMeals);
		setMeals(updatedMeals);
		setEditModalOpen(false);
		setEditingEntry(null);
	};

	const openDeleteModal = useCallback((entry: DietEntry) => {
		setDeletingEntry(entry);
		setDeleteModalOpen(true);
	}, []);

	const handleConfirmDelete = async () => {
		if (!deletingEntry) return;
		await deleteDietEntry(deletingEntry.id);
		setMeals((prev) => prev.filter((m) => m.id !== deletingEntry.id));
		setDeleteModalOpen(false);
		setDeletingEntry(null);
	};

	const columns = useMemo<ColumnDef<DietEntry>[]>(
		() => [
			{
				accessorKey: 'date',
				header: 'Date',
				cell: (info) => info.getValue(),
			},
			{
				accessorKey: 'calories',
				header: 'Calories (kcal)',
				cell: (info) => (info.getValue() as number).toLocaleString(),
			},
			{
				id: 'actions',
				header: 'Actions',
				cell: ({ row }) => (
					<div className="flex gap-2">
						<Button
							variant="ghost"
							color="purple"
							size="sm"
							onClick={() => openEditModal(row.original)}
						>
							Edit
						</Button>
						<Button
							variant="ghost"
							color="gray"
							size="sm"
							onClick={() => openDeleteModal(row.original)}
						>
							Delete
						</Button>
					</div>
				),
			},
		],
		[openEditModal, openDeleteModal],
	);

	const table = useReactTable({
		data: meals,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	});

	if (loading) {
		return (
			<Panel title="Meals Log">
				<div className="text-gray-400 text-center py-8">
					Loading meal entries...
				</div>
			</Panel>
		);
	}

	return (
		<>
			<Panel
				title="Meals Log"
				headerActions={
					<span className="text-sm text-gray-400">{meals.length} total</span>
				}
			>
				<div className="space-y-4">
					<input
						type="text"
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
						placeholder="Search meal entries..."
						className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
					/>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr key={headerGroup.id} className="border-b border-gray-800">
										{headerGroup.headers.map((header) => (
											<th
												key={header.id}
												className="px-4 py-3 text-left text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
												onClick={header.column.getToggleSortingHandler()}
											>
												<div className="flex items-center gap-1">
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{{
														asc: ' ↑',
														desc: ' ↓',
													}[header.column.getIsSorted() as string] ?? null}
												</div>
											</th>
										))}
									</tr>
								))}
							</thead>
							<tbody>
								{table.getRowModel().rows.length === 0 ? (
									<tr>
										<td
											colSpan={columns.length}
											className="px-4 py-8 text-center text-gray-500"
										>
											No meal entries found
										</td>
									</tr>
								) : (
									table.getRowModel().rows.map((row) => (
										<tr
											key={row.id}
											className="border-b border-gray-800 hover:bg-gray-800/50"
										>
											{row.getVisibleCells().map((cell) => (
												<td
													key={cell.id}
													className="px-4 py-3 text-sm text-gray-300"
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</td>
											))}
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					<div className="flex items-center justify-between">
						<div className="text-sm text-gray-400">
							Page {table.getState().pagination.pageIndex + 1} of{' '}
							{table.getPageCount()}
						</div>
						<div className="flex gap-2">
							<Button
								variant="ghost"
								color="gray"
								size="sm"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								Previous
							</Button>
							<Button
								variant="ghost"
								color="gray"
								size="sm"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</Panel>

			{/* Edit Modal */}
			<Modal
				isOpen={editModalOpen}
				onClose={() => setEditModalOpen(false)}
				title="Edit Meal Entry"
				primaryAction={{ label: 'Save', onClick: handleSaveEdit }}
				secondaryAction={{
					label: 'Cancel',
					onClick: () => setEditModalOpen(false),
				}}
			>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="meal-edit-date"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Date
						</label>
						<input
							id="meal-edit-date"
							type="date"
							value={editForm.date}
							onChange={(e) =>
								setEditForm({ ...editForm, date: e.target.value })
							}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
						/>
					</div>
					<div>
						<label
							htmlFor="meal-edit-calories"
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Calories (kcal)
						</label>
						<input
							id="meal-edit-calories"
							type="number"
							min="0"
							value={editForm.calories}
							onChange={(e) =>
								setEditForm({ ...editForm, calories: e.target.value })
							}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
						/>
					</div>
				</div>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={deleteModalOpen}
				onClose={() => setDeleteModalOpen(false)}
				title="Delete Meal Entry"
				primaryAction={{ label: 'Delete', onClick: handleConfirmDelete }}
				secondaryAction={{
					label: 'Cancel',
					onClick: () => setDeleteModalOpen(false),
				}}
			>
				<p className="text-gray-300">
					Are you sure you want to delete this meal entry? This action cannot be
					undone.
				</p>
			</Modal>
		</>
	);
}

export function LogPage() {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gray-950 py-8 px-4">
			<div className="max-w-5xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold text-white">Data Log</h1>
					<Button variant="ghost" color="gray" onClick={() => navigate('/')}>
						← Back to Home
					</Button>
				</div>

				<div className="space-y-6">
					<ActivitiesTable />
					<StatsTable />
					<MealsTable />
				</div>
			</div>
		</div>
	);
}
