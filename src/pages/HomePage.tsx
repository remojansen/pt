import { AbbottWorldMarathonMajorsPanel } from '../components/AbbottWorldMarathonMajorsPanel';
import { DietConsistencyPanel } from '../components/DietConsistencyPanel';
import { RunningPaceEvolutionPanel } from '../components/RunningPaceEvolutionPanel';
import { StrengthEvolutionPanel } from '../components/StrengthEvolutionPanel';
import { TodaysTrainingSessionPanel } from '../components/TodaysTrainingSessionPanel';
import { TrainingConsistencyPanel } from '../components/TrainingConsistencyPanel';
import { VolumePlanPanel } from '../components/VolumePlanPanel';
import { WeightEvolutionPanel } from '../components/WeightEvolutionPanel';

export function HomePage() {
	return (
		<div className="min-h-screen bg-gray-950 py-8 px-4">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<TodaysTrainingSessionPanel />
					<VolumePlanPanel />
					<TrainingConsistencyPanel />
					<DietConsistencyPanel />
					<RunningPaceEvolutionPanel />
					<WeightEvolutionPanel />
					<StrengthEvolutionPanel />
					<AbbottWorldMarathonMajorsPanel />
				</div>
			</div>
		</div>
	);
}
