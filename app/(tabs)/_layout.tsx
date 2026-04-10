import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';

const TAB_BAR_ICON_SIZE = 18;

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={TAB_BAR_ICON_SIZE} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.tint,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { backgroundColor: theme.colors.background },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
        headerShadowVisible: false,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.analyze'),
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: t('tabs.info'),
          tabBarIcon: ({ color }) => <TabBarIcon name="info" color={color} />,
        }}
      />
    </Tabs>
  );
}
