import { ThemedText } from '@/components/themed-text';
import { useActivityStyles } from '@/hooks/use-activity-styles';

export function EmptyAttemptsMessage({ message }: { message: string }) {
  const activityStyles = useActivityStyles();
  return (
    <ThemedText type="small" style={activityStyles.emptyText}>
      {message}
    </ThemedText>
  );
}
