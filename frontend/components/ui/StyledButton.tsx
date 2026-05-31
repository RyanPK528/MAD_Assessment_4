// components/ui/StyledButton.tsx
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  onPress: () => void;
  text: string;
  width?: number | string;
  fontSize?: number;
  marginTop?: number;
  marginBottom?: number;
  isLoading?: boolean;
  isDisabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
};

export default function StyledButton({
  onPress,
  text,
  width = 200,
  fontSize = 16,
  marginTop = 0,
  marginBottom = 0,
  isLoading = false,
  isDisabled = false,
  variant = 'primary',
}: Props) {
  const theme = useAppTheme();

  const bgColor =
    variant === 'primary'
      ? theme.primary
      : variant === 'outline'
        ? 'transparent'
        : 'transparent';

  const borderColor =
    variant === 'outline' ? theme.primary : 'transparent';

  const textColor =
    variant === 'primary' ? '#FFFFFF' : theme.primary;

  return (
    <View style={[styles.wrapper, { marginTop, marginBottom }]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled || isLoading}
        activeOpacity={0.82}
        style={[
          styles.button,
          {
            width: width as number,
            backgroundColor: bgColor,
            borderColor,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text style={[styles.text, { fontSize, color: textColor }]}>
            {text}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  button: {
    borderRadius: 50,
    borderWidth: 2,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.3,
  },
});
