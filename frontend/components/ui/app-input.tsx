import { TextInput, TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SpacingScale } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUiStyles } from '@/hooks/use-ui-styles';

interface AppInputProps extends TextInputProps {
  label?: string;
  multiline?: boolean;
}

export function AppInput({
  label,
  multiline,
  style,
  testID,
  accessibilityLabel,
  accessible,
  ...rest
}: AppInputProps) {
  const theme = useTheme();
  const ui = useUiStyles();

  return (
    <View style={{ gap: SpacingScale.xxs }}>
      {label ? <ThemedText type="captionBold">{label}</ThemedText> : null}
      <TextInput
        testID={testID}
        accessibilityLabel={accessibilityLabel ?? testID}
        accessible={accessible ?? Boolean(testID)}
        placeholderTextColor={theme.muted}
        multiline={multiline}
        style={[ui.input, multiline && ui.inputMultiline, style]}
        {...rest}
      />
    </View>
  );
}
