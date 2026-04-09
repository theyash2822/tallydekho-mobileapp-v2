import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../constants';
import { AppText } from './Text';

interface Props {
  title: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
  centerComponent?: React.ReactNode;
}

export const Header: React.FC<Props> = ({
  title,
  showBack = true,
  rightComponent,
  centerComponent,
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppText style={styles.backIcon}>←</AppText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        {centerComponent ?? (
          <AppText variant="h3" style={styles.title} numberOfLines={1}>
            {title}
          </AppText>
        )}
      </View>

      <View style={styles.right}>{rightComponent ?? null}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDefault,
    paddingHorizontal: Spacing.base,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
  backBtn: {
    padding: 4,
  },
  backIcon: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
  title: {
    fontSize: Typography.md,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
});
