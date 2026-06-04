import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  ActivityCategoryName,
  Radii,
  SpacingScale,
  ThemeMode,
  getCategoryBadgeColors,
} from '@/constants/theme';
import { useThemeContext } from '@/components/ThemeContext';

interface CategoryBadgeProps {
  category: ActivityCategoryName;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const { mode } = useThemeContext();
  const colors = getCategoryBadgeColors(category, mode as ThemeMode);

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingVertical: SpacingScale.xxs,
        paddingHorizontal: SpacingScale.sm,
        borderRadius: Radii.pill,
        borderWidth: 1,
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
    >
      <ThemedText type="captionBold" style={{ color: colors.text }}>
        {category}
      </ThemedText>
    </View>
  );
}
