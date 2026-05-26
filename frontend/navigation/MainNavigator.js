import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PlaceholderScreen from '../screens/activities/PlaceholderScreen';
import { COLORS } from '../constants/colors';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

// Wraps Home + individual activity screens in a stack so
// tapping an activity card navigates without leaving the tab bar
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      {/* Sprint 2: replace PlaceholderScreen with real activity screens */}
      <HomeStack.Screen name="Activity1" component={PlaceholderScreen} initialParams={{ title: '🪂 Parachute Drop', activityId: 1 }} />
      <HomeStack.Screen name="Activity2" component={PlaceholderScreen} initialParams={{ title: '🔊 Sound Pollution Hunter', activityId: 2 }} />
      <HomeStack.Screen name="Activity3" component={PlaceholderScreen} initialParams={{ title: '💨 Hand Fan Challenge', activityId: 3 }} />
      <HomeStack.Screen name="Activity4" component={PlaceholderScreen} initialParams={{ title: '🏗️ Earthquake Structure', activityId: 4 }} />
      <HomeStack.Screen name="Activity5" component={PlaceholderScreen} initialParams={{ title: '🏃 Performance Lab', activityId: 5 }} />
      <HomeStack.Screen name="Activity6" component={PlaceholderScreen} initialParams={{ title: '⚡ Reaction Board', activityId: 6 }} />
      <HomeStack.Screen name="Activity7" component={PlaceholderScreen} initialParams={{ title: '🫁 Breathing Trainer', activityId: 7 }} />
    </HomeStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 62,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
