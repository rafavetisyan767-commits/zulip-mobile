/* @flow strict-local */
import React, { useContext } from 'react';
import type { Node } from 'react';
import { View } from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import type { RouteProp, RouteParamsOf } from '../react-navigation';
import { getUnreadHuddlesTotal, getUnreadPmsTotal } from '../selectors';
import { useSelector } from '../react-redux';
import type { AppNavigationMethods, AppNavigationProp } from '../nav/AppNavigator';
import { bottomTabNavigatorConfig } from '../styles/tabs';
import PmConversationsScreen from '../pm-conversations/PmConversationsScreen';
import { IconPeople } from '../common/Icons';
import OwnAvatar from '../common/OwnAvatar';
import ProfileScreen from '../account-info/ProfileScreen';
import styles, { BRAND_COLOR, ThemeContext } from '../styles';

export type MainTabsNavigatorParamList = {|
  +'pm-conversations': RouteParamsOf<typeof PmConversationsScreen>,
  +profile: RouteParamsOf<typeof ProfileScreen>,
|};

export type MainTabsNavigationProp<
  +RouteName: $Keys<MainTabsNavigatorParamList> = $Keys<MainTabsNavigatorParamList>,
> =
  BottomTabNavigationProp<MainTabsNavigatorParamList, RouteName> &
    AppNavigationMethods;

const Tab = createBottomTabNavigator<
  MainTabsNavigatorParamList,
  MainTabsNavigatorParamList,
  MainTabsNavigationProp<>,
>();

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'main-tabs'>,
  route: RouteProp<'main-tabs', void>,
|}>;

export default function MainTabsScreen(props: Props): Node {
  const { backgroundColor } = useContext(ThemeContext);
  const unreadPmsCount = useSelector(getUnreadHuddlesTotal) + useSelector(getUnreadPmsTotal);

  return (
    <View style={[styles.flexed, { backgroundColor }]}>
      <Tab.Navigator {...bottomTabNavigatorConfig()} lazy={false} backBehavior="none">
        <Tab.Screen
          name="pm-conversations"
          component={PmConversationsScreen}
          options={{
            tabBarLabel: 'Messages',
            tabBarIcon: ({ color }) => <IconPeople size={24} color={color} />,
            tabBarBadge: unreadPmsCount > 0 ? unreadPmsCount : undefined,
            tabBarBadgeStyle: {
              color: 'white',
              backgroundColor: BRAND_COLOR,
            },
          }}
        />
        <Tab.Screen
          name="profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => <OwnAvatar size={24} />,
          }}
        />
      </Tab.Navigator>
    </View>
  );
}
