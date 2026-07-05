import { colors, spacing, typography } from '../../theme';

export default function Header() {
  return (
    <header
      style={{
        height: 60,
        background: colors.primary,
        color: colors.textWhite,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: spacing.lg,
        paddingRight: spacing.lg,
        fontWeight: typography.title.fontWeight,
        fontSize: typography.title.fontSize,
      }}
    >
      Gesso SMJ ERP
    </header>
  );
}