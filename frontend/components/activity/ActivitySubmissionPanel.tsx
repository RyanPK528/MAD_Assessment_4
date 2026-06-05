import { View } from 'react-native';

import { ActivityDiscussionSection } from '@/components/activity/ActivityDiscussionSection';
import { ActivitySection } from '@/components/activity/ActivitySection';
import { AttemptList } from '@/components/activity/AttemptList';
import { ActivityId } from '@/constants/activities';
import { useActivityStyles } from '@/hooks/use-activity-styles';

interface ActivitySubmissionPanelProps {
  activityId: ActivityId;
  showSoundTable?: boolean;
  refreshKey?: number;
}

export function ActivitySubmissionPanel({
  activityId,
  showSoundTable = false,
  refreshKey = 0,
}: ActivitySubmissionPanelProps) {
  const activityStyles = useActivityStyles();

  return (
    <View style={activityStyles.sectionRoot}>
      <ActivityDiscussionSection activityId={activityId} showSoundTable={showSoundTable} />

      <ActivitySection title="Submitted Attempts">
        <AttemptList activityId={activityId} refreshKey={refreshKey} />
      </ActivitySection>
    </View>
  );
}
