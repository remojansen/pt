import { TrainingConsistencyPanel } from '../components/TrainingConsistencyPanel';
import { RunningPaceEvolutionPanel } from '../components/RunningPaceEvolutionPanel';
import { StrengthEvolutionPanel } from '../components/StrengthEvolutionPanel';
import { TodaysTrainingSessionPanel } from '../components/TodaysTrainingSessionPanel';
import { WeightEvolutionPanel } from '../components/WeightEvolutionPanel';
import { DietConsistencyPanel } from '../components/DietConsistencyPanel';

export function HomePage() {
	return (
		<div className="min-h-screen bg-gray-900 py-8 px-4">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 gap-6">
					<TodaysTrainingSessionPanel />
					<TrainingConsistencyPanel />
					<DietConsistencyPanel />
					<RunningPaceEvolutionPanel />
					<WeightEvolutionPanel />
					<StrengthEvolutionPanel />
				</div>
			</div>
		</div>
	);
}
