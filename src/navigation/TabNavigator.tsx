import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants';
import { AppText } from '../components/common/Text';
import type { TabParamList } from '../types';

// Tab Screens
import HomeScreen from '../screens/dashboard/HomeScreen';
import LedgerScreen from '../screens/ledger/LedgerScreen';
import CreateScreen from '../screens/create/CreateScreen';
import StocksScreen from '../screens/stocks/StocksScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, string> = {
  Home:    '⌂',
  Ledger:  '☰',
  Create:  '+',
  Stocks:  '◫',
  Reports: '↗',
};

function CreateTabButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.createBtn} activeOpacity={0.85}>
      <AppText style={styles.createBtnText}>+</AppText>
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.brandPrimary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabel: ({ focused, color }) => (
          <AppText style={{ fontSize: 10, color, fontWeight: focused ? Typography.weightSemibold : Typography.weightRegular }}>
            {route.name}
          </AppText>
        ),
        tabBarIcon: ({ color }) => (
          <AppText style={{ fontSize: 22, color }}>{TAB_ICONS[route.name]}</AppText>
        ),
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Ledger"  component={LedgerScreen} />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          tabBarButton: (props) => <CreateTabButton onPress={props.onPress as (() => void) | undefined} />,
        }}
      />
      <Tab.Screen name="Stocks"  component={StocksScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  createBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  createBtnText: {
    fontSize: 28,
    color: Colors.white,
    fontWeight: '300',
    lineHeight: 32,
  },
});
