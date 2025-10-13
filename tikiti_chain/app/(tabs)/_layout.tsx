import "../../global.css";
import { Tabs } from "expo-router";
import CustomTab from "@/components/CustomTab";
import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
export default function RootLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTab {...props} />}
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.primary.black,
          height: 98,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused, color, size }) => {
            return (
              <Ionicons
                name="home-outline"
                size={24}
                color={focused ? colors.primary.black : colors.primary.white}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarLabel: "Map",
          tabBarIcon: ({ focused, color, size }) => {
            return (
              <Ionicons
                name="map-outline"
                size={24}
                color={focused ? colors.primary.black : colors.primary.white}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          tabBarLabel: "Favourites",
          tabBarIcon: ({ focused, color, size }) => {
            return (
              <Ionicons
                name="heart-outline"
                size={24}
                color={focused ? colors.primary.black : colors.primary.white}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused, color, size }) => {
            return (
              <Ionicons
                name="person-outline"
                size={24}
                color={focused ? colors.primary.black : colors.primary.white}
              />
            );
          },
        }}
      />
    </Tabs>
  );
}
