# Race Buddy - Copilot Instructions

## Project Overview
React PWA for personal fitness tracking (running pace, strength training, weight, diet). Offline-first with IndexedDB storage and optional File System Access API backup.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (dark theme: `bg-gray-950`, `bg-gray-900`)
- **Data**: IndexedDB via `idb` library (see [src/hooks/db.ts](src/hooks/db.ts))
- **PWA**: `vite-plugin-pwa` with Workbox service worker
- **Routing**: react-router-dom
- **Charts**: recharts
- **Linting**: Biome (NOT ESLint/Prettier)

## Commands
```bash
npm run dev      # Start dev server
npm run build    # TypeScript check + Vite build
npm run check    # Biome lint + format check
npm run format   # Auto-fix lint/format issues
```

## Architecture

### Data Flow
`UserDataProvider` (React Context) → IndexedDB operations in [src/hooks/db.ts](src/hooks/db.ts)
- All data mutations go through context methods (`addActivity`, `updateStatsEntries`, etc.)
- Mutations call `updateLocalModified()` to track changes for backup sync
- Pagination built-in: `loadMoreActivities(limit)`, `loadAllUserActivities()` for large datasets

### Key Types ([src/hooks/useUserData.tsx](src/hooks/useUserData.tsx))
- `Activity` = `Cardio | Strength` (discriminated union on `type`)
- `ActivityType` const object: `RoadRun`, `TreadmillRun`, `PoolSwim`, `SeaSwim`, `RoadCycle`, `IndoorCycle`, `StrengthTrainingLegs`, `StrengthTrainingArms`, `StrengthTrainingCore`, `StrengthTrainingShoulders`, `StrengthTrainingBack`, `StrengthTrainingChest`
- `UserStatsEntry`: daily weight/body fat
- `DietEntry`: daily calorie intake

### Component Patterns
- **Layout**: `Panel` component for cards ([src/components/Panel.tsx](src/components/Panel.tsx))
- **Buttons**: Use `Button` with `variant` (primary/secondary/ghost), `color` (purple/blue/gray)
- **Forms**: Tailwind classes: `bg-gray-800 border-gray-700 rounded-lg focus:ring-purple-500`

## Code Conventions

### Biome Rules (see [biome.json](biome.json))
- Indent: **tabs** (not spaces)
- Quotes: **single** for JS, **double** for JSX attributes
- Imports: auto-organized on save

### File Organization
```
src/
  hooks/       # Data layer: db.ts, useUserData.tsx, useBackup.ts, usePWAInstall.tsx, useTour.tsx
  pages/       # Route components: HomePage, TrainingSessionPage, SettingsPage, RegistrationPage
  components/  # Reusable UI: Panel, Button, Modal, *Panel components
  data/        # Pure functions: pace calculations, BMI formulas, effort zones, volume planning
  types/       # TypeScript type definitions (e.g., file-system-access.d.ts)
```

### Naming
- Panel components: `*Panel.tsx` (e.g., `WeightEvolutionPanel.tsx`)
- Hooks: `use*.ts` / `use*.tsx`
- ID generation: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

## Build & Deploy
- **Vite config**: `root: 'src'`, outputs to project root (not `dist/`)
- **Base URL**: `/pt/` in production (GitHub Pages)
- **Deploy**: Push to `main` triggers GitHub Actions → builds → deploys to `gh-pages` branch

## Common Patterns

### Adding a new activity type
1. Add to `ActivityType` const object in [src/hooks/useUserData.tsx](src/hooks/useUserData.tsx)
2. Add label in `ACTIVITY_LABELS` map in [TrainingSessionPage.tsx](src/pages/TrainingSessionPage.tsx)
3. For strength: add exercises to `getRepetitionsForActivityType()`

### Creating a dashboard panel
```tsx
import { Panel } from '../components/Panel';
import { useUserData } from '../hooks/useUserData';

export function MyPanel() {
  const { activities } = useUserData();
  return (
    <Panel title="My Panel" headerActions={<Button>Action</Button>}>
      {/* content */}
    </Panel>
  );
}
```

### Database queries
```tsx
// Prefer indexed queries over loading all data
const entry = await loadStatsEntryByDate('2024-01-15');
const runActivities = await loadActivitiesByType('RoadRun');
```
