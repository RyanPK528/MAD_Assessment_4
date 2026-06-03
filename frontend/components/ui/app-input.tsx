import { TextInput, TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SpacingScale } from '@/constants/theme';import { useTheme } from '@/hooks/use-theme';
import { useUiStyles } from '@/hooks/use-ui-styles';

interface AppInputProps extends TextInputProps {
  label?: string;
  multiline?: boolean;
}

export function AppInput({ label, multiline, style, ...rest }: AppInputProps) {
  const theme = useTheme();
  const ui = useUiStyles();

  return (
    <View style={{ gap: SpacingScale.xxs }}>
      {label ? <ThemedText type="captionBold">{label}</ThemedText> : null}
      <TextInput
        placeholderTextColor={theme.muted}
        multiline={multiline}
        style={[ui.input, multiline && ui.inputMultiline, style]}
        {...rest}
      />
    </View>
  );
}
