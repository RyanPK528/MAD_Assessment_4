import { ComponentType } from 'react';

import { GenericAttemptResults } from '@/components/activity/attempt-details/GenericAttemptResults';
import {
  EarthquakeAttemptResults,
  HandFanAttemptResults,
} from '@/components/activity/attempt-details/DesignActivityAttemptResults';
import {
  BreathingTrainerAttemptResults,
  ReactionBoardAttemptResults,
} from '@/components/activity/attempt-details/HealthActivityAttemptResults';
import { HumanPerformanceAttemptResults } from '@/components/activity/attempt-details/HumanPerformanceAttemptResults';
import { ParachuteDropAttemptResults } from '@/components/activity/attempt-details/ParachuteDropAttemptResults';
import { SoundPollutionAttemptResults } from '@/components/activity/attempt-details/SoundPollutionAttemptResults';
import { ActivityId } from '@/constants/activities';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

type AttemptResultsComponent = ComponentType<{ attempt: ActivityAttemptRecord }>;

export const ATTEMPT_RESULT_RENDERERS: Record<ActivityId, AttemptResultsComponent> = {
  'parachute-drop': ParachuteDropAttemptResults,
  'sound-pollution': SoundPollutionAttemptResults,
  'hand-fan': HandFanAttemptResults,
  'earthquake-structure': EarthquakeAttemptResults,
  'human-performance': HumanPerformanceAttemptResults,
  'reaction-board': ReactionBoardAttemptResults,
  'breathing-trainer': BreathingTrainerAttemptResults,
};

export function getAttemptResultsRenderer(activityId: ActivityId): AttemptResultsComponent {
  return ATTEMPT_RESULT_RENDERERS[activityId] ?? GenericAttemptResults;
}
