import { Image, View } from 'react-native';

import { ActivitySection } from '@/components/activity/ActivitySection';
import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_CATALOG } from '@/constants/activityCatalog';
import { ActivityId } from '@/constants/activities';
import { useActivityStyles } from '@/hooks/use-activity-styles';

interface ActivityOverviewPanelProps {
  activityId: ActivityId;
}

export function ActivityOverviewPanel({ activityId }: ActivityOverviewPanelProps) {
  const content = ACTIVITY_CATALOG[activityId];
  const activityStyles = useActivityStyles();

  return (
    <View style={activityStyles.sectionRoot}>
      <ActivitySection title="Overview">
        <ThemedText type="body">{content.overview}</ThemedText>
      </ActivitySection>

      <ActivitySection title="Materials / Equipment">
        {content.materials.map((item) => (
          <ThemedText key={item} type="body">
            • {item}
          </ThemedText>
        ))}
      </ActivitySection>

      <ActivitySection title="Instructions">
        {content.instructions.map((step, index) => (
          <ThemedText key={step} type="body">
            {content.instructions.length > 1 ? `${index + 1}. ${step}` : step}
          </ThemedText>
        ))}
      </ActivitySection>

      <ActivitySection title="Diagram">
        <Image
          source={content.diagramImage}
          style={activityStyles.instructionImage}
          resizeMode="contain"
          accessibilityLabel={`${content.label} instruction diagram`}
        />
      </ActivitySection>
    </View>
  );
}
