import Joyride, {
	ACTIONS,
	type CallBackProps,
	EVENTS,
	STATUS,
	type Step,
} from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTour } from '../hooks/useTour';

const tourSteps: Step[] = [
	{
		target: '[data-tour="navbar"]',
		content:
			'Welcome to Race Buddy! This is your personal fitness tracking app. Let me show you around.',
		placement: 'bottom',
		disableBeacon: true,
	},
	{
		target: '[data-tour="add-button"]',
		content:
			'Use this button to quickly log your weight or meals. Tracking these helps you monitor your overall fitness progress.',
		placement: 'bottom',
	},
	{
		target: '[data-tour="settings-link"]',
		content:
			'Access your settings here to configure your training schedule, update your profile, and manage data backups.',
		placement: 'bottom',
	},
	{
		target: '[data-tour="timeframe-filter"]',
		content:
			'Use this chart icon to change the time range for all charts. Select 1 month, 3 months, 6 months, or 1 year to see your progress over different periods.',
		placement: 'bottom',
	},
	{
		target: '[data-tour="todays-training"]',
		content:
			"This panel shows today's training session based on your schedule. When you're ready, click 'Start Training' to begin!",
		placement: 'bottom',
	},
	{
		target: '[data-tour="volume-plan"]',
		content:
			'Here you can see your weekly training volume plan and track your progress against your goals.',
		placement: 'bottom',
	},
	{
		target: '[data-tour="training-consistency"]',
		content:
			'Track your training consistency over time. The chart shows your daily exercise minutes, with green bars indicating completed training plans.',
		placement: 'top',
	},
	{
		target: '[data-tour="diet-consistency"]',
		content:
			'Monitor your diet consistency here. Log your meals to see how well you stick to your calorie targets.',
		placement: 'top',
	},
	{
		target: '[data-tour="pace-evolution"]',
		content:
			'Track your running pace improvement over time. This helps you see how your cardio fitness is progressing.',
		placement: 'top',
	},
	{
		target: '[data-tour="weight-evolution"]',
		content:
			'Monitor your weight and body composition changes. Log your weight regularly to see trends.',
		placement: 'top',
	},
	{
		target: '[data-tour="strength-evolution"]',
		content:
			"Track your strength training progress here. You'll see improvements in your exercises over time. That's the tour! Start tracking your fitness journey today.",
		placement: 'top',
	},
];

export function AppTour() {
	const { runTour, completeTour, stopTour } = useTour();
	const location = useLocation();
	const navigate = useNavigate();

	// Only run the tour on the home page
	const shouldRun = runTour && location.pathname === '/';

	// Navigate to home if tour is started from another page
	if (runTour && location.pathname !== '/') {
		navigate('/');
	}

	const handleJoyrideCallback = (data: CallBackProps) => {
		const { status, action, type } = data;

		// Tour completed or skipped
		if (
			status === STATUS.FINISHED ||
			status === STATUS.SKIPPED ||
			(action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER)
		) {
			completeTour();
		}

		// User closed the tour
		if (action === ACTIONS.CLOSE) {
			stopTour();
		}
	};

	return (
		<Joyride
			steps={tourSteps}
			run={shouldRun}
			continuous
			showProgress
			showSkipButton
			scrollToFirstStep
			disableOverlayClose
			callback={handleJoyrideCallback}
			locale={{
				back: 'Back',
				close: 'Close',
				last: 'Finish',
				next: 'Next',
				skip: 'Skip tour',
			}}
			styles={{
				options: {
					arrowColor: '#1f2937',
					backgroundColor: '#1f2937',
					overlayColor: 'rgba(0, 0, 0, 0.75)',
					primaryColor: '#a855f7',
					textColor: '#f3f4f6',
					zIndex: 10000,
				},
				tooltip: {
					borderRadius: '0.5rem',
					padding: '1rem',
				},
				tooltipContainer: {
					textAlign: 'left' as const,
				},
				tooltipTitle: {
					fontSize: '1.125rem',
					fontWeight: 600,
				},
				tooltipContent: {
					fontSize: '0.875rem',
					lineHeight: 1.6,
				},
				buttonNext: {
					backgroundColor: '#a855f7',
					borderRadius: '0.375rem',
					padding: '0.5rem 1rem',
					fontSize: '0.875rem',
				},
				buttonBack: {
					color: '#9ca3af',
					fontSize: '0.875rem',
				},
				buttonSkip: {
					color: '#6b7280',
					fontSize: '0.875rem',
				},
				spotlight: {
					borderRadius: '0.5rem',
				},
			}}
		/>
	);
}
