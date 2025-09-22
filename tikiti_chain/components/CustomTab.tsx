import { View } from "react-native";
import { PlatformPressable } from "@react-navigation/elements";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsKeyboardShown } from "@/hooks/general/keyboard";

const HIDDEN_ROUTES = ["+not-found", "_sitemap"];

function CustomTab({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const keyboardShown = useIsKeyboardShown();

  if (keyboardShown) return;

  return (
    <View
      style={{
        paddingBottom: insets.bottom + 8,
      }} // Adds safe area + 8px margin
      className="absolute bottom-0 left-0 right-0 items-center"
    >
      <View className="flex-row justify-between bg-primary-black h-[70px] px-2 w-[94%] items-center rounded-full">
        {state.routes
          .filter((route) => !HIDDEN_ROUTES.includes(route.name))
          .map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            const icon = options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? colors.primary.black : colors.primary.gray,
              size: 18,
            });

            return (
              <PlatformPressable
                className={`w-[56px] rounded-full ${
                  isFocused ? "bg-primary-white" : ""
                }  h-[56px] items-center justify-center gap-1`}
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
              >
                {icon}
                {isFocused && (
                  <MaterialCommunityIcons
                    name="checkbox-blank-circle"
                    size={4}
                    color={colors.primary.black}
                  />
                )}
              </PlatformPressable>
            );
          })}
      </View>
    </View>
  );
}

export default CustomTab;
