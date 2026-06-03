import { Platform, Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts, ThemeColor, Typography, TypographyVariant, getTypographyStyle } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: TypographyVariant | 'default' | 'title' | 'subtitle' | 'small' | 'smallBold' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

const legacyTypeMap: Record<string, TypographyVariant> = {
  default: 'bodyMedium',
  title: 'pageTitle',
  subtitle: 'sectionTitle',
  body: 'bodyMedium',
  small: 'caption',
  smallBold: 'captionBold',
  button: 'button',
  link: 'link',
  linkPrimary: 'link',
  code: 'code',
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const resolvedType = legacyTypeMap[type] ?? (type as TypographyVariant);
  const typographyStyle = getTypographyStyle(resolvedType);

  const linkStyle: TextStyle | undefined =
    type === 'link' || type === 'linkPrimary'
      ? { color: type === 'linkPrimary' ? theme.accent : theme.textSecondary }
      : undefined;

  const codeStyle: TextStyle | undefined =
    resolvedType === 'code'
      ? {
          fontFamily: Fonts?.mono,
          fontWeight: Platform.select({ android: '700' as const, default: '500' as const }),
        }
      : undefined;

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        typographyStyle,
        linkStyle,
        codeStyle,
        style,
      ]}
      {...rest}
    />
  );
}
