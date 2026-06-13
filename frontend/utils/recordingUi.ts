export type RecordingUiState = 'idle' | 'countdown' | 'recording' | 'processing' | 'completed';

export function isMonitoringPanelVisible(state: RecordingUiState): boolean {
  return state === 'countdown' || state === 'recording' || state === 'processing' || state === 'completed';
}

export function isSensorFeedActive(state: RecordingUiState): boolean {
  return state === 'recording';
}

/** @deprecated Use isMonitoringPanelVisible */
export function isLiveMonitoringActive(state: RecordingUiState): boolean {
  return isMonitoringPanelVisible(state);
}
