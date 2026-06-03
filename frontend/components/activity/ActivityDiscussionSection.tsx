import { View } from 'react-native';

import { ActivitySection } from '@/components/activity/ActivitySection';
import { SoundLevelTable } from '@/components/activity/SoundLevelTable';
import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_CATALOG } from '@/constants/activityCatalog';
import { ActivityId } from '@/constants/activities';

interface ActivityDiscussionSectionProps {
  activityId: ActivityId;
  showSoundTable?: boolean;
}

export function ActivityDiscussionSection({
  activityId,
  showSoundTable = false,
}: ActivityDiscussionSectionProps) {
  const discussion = ACTIVITY_CATALOG[activityId].discussion;

  return (
    <ActivitySection title="Discussion">
      <ThemedText type="body">{discussion}</ThemedText>
      {showSoundTable ? <SoundLevelTable /> : null}
    </ActivitySection>
  );
}
