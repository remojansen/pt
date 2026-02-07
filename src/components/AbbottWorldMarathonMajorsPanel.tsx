import { type MarathonMajor, useUserData } from '../hooks/useUserData';
import { Panel } from './Panel';

export function AbbottWorldMarathonMajorsPanel() {
	const { userProfile } = useUserData();

	if (!userProfile.starChaser) {
		return null;
	}

	const completedMajors = userProfile.completedMajors ?? [];
	const completedCount = completedMajors.length;

	const cities: { name: MarathonMajor; label: string; angle: number }[] = [
		{ name: 'tokyo', label: 'TOKYO', angle: 0 },
		{ name: 'ny', label: 'NEW YORK', angle: 51.4 },
		{ name: 'chicago', label: 'CHICAGO', angle: 102.8 },
		{ name: 'berlin', label: 'BERLIN', angle: 154.2 },
		{ name: 'london', label: 'LONDON', angle: 205.6 },
		{ name: 'boston', label: 'BOSTON', angle: 257 },
		{ name: 'sydney', label: 'SYDNEY', angle: 308.4 },
	];

	const radius = 120; // Distance from center

	return (
		<Panel title={`Abbott World Marathon Majors (${completedCount}/7)`}>
			<div className="relative w-80 h-80 mx-auto">
				{/* Center Abbott logo */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
					<img
						src={`${import.meta.env.BASE_URL}img/majors/abbott.png`}
						alt="abbott logo"
						className="w-28"
					/>
				</div>

				{/* City circles arranged in a circle */}
				{cities.map((city) => {
					const angleRad = (city.angle - 90) * (Math.PI / 180);
					const x = Math.cos(angleRad) * radius;
					const y = Math.sin(angleRad) * radius;
					const isCompleted = completedMajors.includes(city.name);

					return (
						<div
							key={city.name}
							className="absolute w-20 h-20 top-1/2 left-1/2 flex items-center justify-center"
							style={{
								transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
							}}
						>
							<div
								className="absolute inset-0 border-4 border-white shadow-inner rounded-full bg-cover bg-center"
								style={{
									backgroundImage: `url(${import.meta.env.BASE_URL}img/majors/${city.name}.png)`,
									filter: isCompleted ? 'none' : 'grayscale(100%)',
									opacity: isCompleted ? 1 : 0.5,
								}}
							/>
							<span className="relative text-white text-[8px] font-bold text-center leading-tight drop-shadow-md z-10">
								{!isCompleted && city.label}
							</span>
						</div>
					);
				})}
			</div>
		</Panel>
	);
}
