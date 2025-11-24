import Button from "@/components/ui/Button";
import ContainerIcon from "@/components/ui/ContainerIcon";
import Section from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useAuthContext } from "@/hooks/auth/use-auth-context";
import { useLogout } from "@/hooks/user/authHooks";
import { hexToRgba } from "@/utils/functions";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  StatusBar,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFollowersCount,
  useFollowingCount,
} from "@/hooks/interactions/useSocialConnections";
import { useUserBlockchainTickets } from "@/hooks/blockchain/useBlockchainEvents";
import { useRouter } from "expo-router";
import { useUserRole } from "@/hooks/auth/useUserRole";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function Profile() {
  const { profile } = useAuthContext();
  const { logOut, isLoggingOut } = useLogout();
  const { data: followersCount = 0 } = useFollowersCount(profile?.id);
  const { data: followingCount = 0 } = useFollowingCount();
  const { data: userTickets = [], isLoading: isLoadingTickets } =
    useUserBlockchainTickets();
  const router = useRouter();
  const { isAdminOrOrganizer, role } = useUserRole();

  if (isLoggingOut) return <LoadingScreen message="Logging out..." />;
  return (
    <SafeAreaView className="flex-1 bg-primary-white">
      <ScrollView
        className="flex-1 bg-primary-white gap-6"
        contentContainerClassName="gap-6 pb-20"
        showsVerticalScrollIndicator={false}
      >
        <StatusBar
          backgroundColor={colors.primary.white}
          barStyle={"dark-content"}
        />
        <View className="gap-3">
          <View className="flex-row items-center gap-4 px-4">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D",
              }}
              className="w-24 h-24 rounded-full"
            />
            <View className="flex-1">
              <Text variant="interExtraBold" className="text-2xl">
                {profile?.full_name ?? "User"}
              </Text>
              <Text variant="interMedium">{profile?.email}</Text>
              <View className="flex-row items-center gap-1">
                <ContainerIcon
                  icon="map-marker-outline"
                  iconType="MaterialCommunityIcons"
                  interactive={false}
                  iconSize={16}
                />
                <Text variant="caption">Nairobi, Kenya</Text>
              </View>
              <View className="flex-row items-center gap-4 mt-2">
                <TouchableOpacity>
                  <Text variant="interMedium" className="text-sm">
                    <Text variant="interBold">{followersCount}</Text> followers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text variant="interMedium" className="text-sm">
                    <Text variant="interBold">{followingCount}</Text> following
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <ContainerIcon
              icon="log-out-outline"
              iconType="Ionicons"
              className="p-3"
              iconSize={30}
              iconColor={colors.secondary.red}
              handleClick={logOut}
            />
          </View>
          <View className="px-4 gap-2">
            <TouchableOpacity
              className="bg-primary-light_gray border border-black py-3 rounded-xl flex-row items-center justify-between px-4"
              onPress={() => router.push("/(tabs)/profile/wallet-setup")}
            >
              <View className="flex-row items-center gap-3">
                <ContainerIcon
                  icon="wallet-outline"
                  iconType="Ionicons"
                  className="bg-white p-2"
                  iconSize={20}
                  interactive={false}
                />
                <Text variant="interBold">My Wallet</Text>
              </View>
              <ContainerIcon
                icon="chevron-forward"
                iconType="Ionicons"
                iconSize={20}
                interactive={false}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-primary-light_gray border border-black py-3 rounded-xl flex-row items-center justify-between px-4"
              onPress={() => router.push("/(tabs)/profile/preferences")}
            >
              <View className="flex-row items-center gap-3">
                <ContainerIcon
                  icon="heart-outline"
                  iconType="Ionicons"
                  className="bg-white p-2"
                  iconSize={20}
                  interactive={false}
                />
                <Text variant="interBold">My Interests & Preferences</Text>
              </View>
              <ContainerIcon
                icon="chevron-forward"
                iconType="Ionicons"
                iconSize={20}
                interactive={false}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-primary-black border border-primary-black py-3 rounded-xl flex-row items-center justify-between px-4"
              onPress={() => router.push("/events/marketplace")}
            >
              <View className="flex-row items-center gap-3">
                <ContainerIcon
                  icon="storefront-outline"
                  iconType="Ionicons"
                  className="bg-white/20 p-2"
                  iconColor={colors.primary.white}
                  iconSize={20}
                  interactive={false}
                />
                <Text variant="interBold" className="text-white">
                  Browse Ticket Marketplace
                </Text>
              </View>
              <ContainerIcon
                icon="chevron-forward"
                iconType="Ionicons"
                iconColor={colors.primary.white}
                iconSize={20}
                interactive={false}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin/Organizer Section */}
        {isAdminOrOrganizer && (
          <View className="px-4">
            <View className="border-2 border-primary-black rounded-2xl p-4 gap-3">
              <View className="flex-row items-center gap-3">
                <ContainerIcon
                  icon="shield-checkmark"
                  iconType="Ionicons"
                  className="bg-primary-black p-2"
                  iconColor={colors.primary.white}
                  iconSize={24}
                  interactive={false}
                />
                <View className="flex-1">
                  <Text variant="interBold" className="text-lg">
                    {role === "admin" ? "Admin Panel" : "Organizer Panel"}
                  </Text>
                  <Text variant="interMedium" className="text-xs text-gray-600">
                    Manage events and verify tickets
                  </Text>
                </View>
              </View>

              <View className="gap-2">
                {role === "organizer" || role === "admin" ? (
                  <TouchableOpacity
                    className="bg-primary-black py-3 rounded-xl flex-row items-center justify-between px-4"
                    onPress={() => router.push("/admin/verify-ticket")}
                  >
                    <View className="flex-row items-center gap-3">
                      <ContainerIcon
                        icon="qrcode-scan"
                        iconType="MaterialCommunityIcons"
                        className="bg-white/20 p-2"
                        iconColor={colors.primary.white}
                        iconSize={20}
                        interactive={false}
                      />
                      <Text variant="interBold" className="text-white">
                        Verify Tickets
                      </Text>
                    </View>
                    <ContainerIcon
                      icon="chevron-forward"
                      iconType="Ionicons"
                      iconColor={colors.primary.white}
                      iconSize={20}
                      interactive={false}
                    />
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  className="bg-white border border-black py-3 rounded-xl flex-row items-center justify-between px-4"
                  onPress={() => router.push("/admin/enable-blockchain")}
                >
                  <View className="flex-row items-center gap-3">
                    <ContainerIcon
                      icon="cube-outline"
                      iconType="Ionicons"
                      className="bg-primary-light_gray p-2"
                      iconSize={20}
                      interactive={false}
                    />
                    <Text variant="interBold">Enable Blockchain</Text>
                  </View>
                  <ContainerIcon
                    icon="chevron-forward"
                    iconType="Ionicons"
                    iconSize={20}
                    interactive={false}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <Section label="Your event tickets">
          {isLoadingTickets ? (
            <View className="ml-4 py-8">
              <ActivityIndicator size="large" color={colors.primary.black} />
            </View>
          ) : userTickets.length === 0 ? (
            <View className="items-center justify-center py-12 px-4">
              <ContainerIcon
                icon="ticket-outline"
                iconType="Ionicons"
                className="bg-gray-100 p-6 mb-4"
                iconColor={colors.primary.dark_gray}
                iconSize={48}
                interactive={false}
              />
              <Text variant="interBold" className="text-lg text-center mb-2">
                No Tickets Yet
              </Text>
              <Text variant="interMedium" className="text-gray-500 text-center">
                Purchase blockchain tickets to see them here.{"\n"}
                They'll be secured as NFTs!
              </Text>
            </View>
          ) : (
            <FlashList
              className="ml-4"
              showsHorizontalScrollIndicator={false}
              horizontal
              data={userTickets}
              renderItem={({ item }) => {
                const eventDate = new Date(item.event_time);
                const monthName = eventDate
                  .toLocaleString("en-US", { month: "short" })
                  .toUpperCase();
                const day = eventDate.getDate();
                const eventImage =
                  item.gallery?.[0] ||
                  "https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg";

                return (
                  <TouchableOpacity
                    className="flex-row items-center mr-3"
                    onPress={() =>
                      router.push(`/events/ticket?ticketId=${item.id}`)
                    }
                  >
                    {/* Left side of ticket */}
                    <View className="relative bg-primary-light_gray p-2 w-[170px] rounded-l-xl">
                      <View className="flex-row items-start justify-between w-[94%]">
                        <Image
                          source={{ uri: eventImage }}
                          className="w-14 h-14 rounded-md"
                        />
                        <Text className="text-right text-sm font-medium">
                          {monthName}
                          {"\n"}
                          {day}
                        </Text>
                      </View>
                      <Text
                        className="mt-1 text-xs text-black"
                        numberOfLines={2}
                      >
                        {item.event_title}
                      </Text>
                      {item.is_redeemed && (
                        <View className="absolute top-1 right-1 bg-green-500 px-2 py-0.5 rounded">
                          <Text className="text-white text-[10px] font-bold">
                            USED
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="w-0.5 h-[100px] bg-primary-white" />
                    {/* Right side stub */}
                    <View className="relative bg-primary-light_gray p-2 w-[50px] rounded-r-xl items-center justify-center">
                      {/* Top circle cutout */}
                      <View className="absolute -left-2 top-[-8px] w-4 h-4 rounded-full bg-primary-white z-10" />
                      {/* Bottom circle cutout */}
                      <View className="absolute -left-2 bottom-[-8px] w-4 h-4 rounded-full bg-primary-white z-10" />

                      {/* Ticket stub pattern */}
                      <View className="w-[80%] bg-primary-white self-end">
                        {[...Array(15)].map((_, i) => (
                          <View
                            key={i}
                            className={`w-[80%] bg-black h-0.5 self-center ${
                              i % 2 === 0 ? "mb-0.5" : "mb-1"
                            }`}
                          />
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </Section>
        <Section label="Event history" gap={8} className="flex-1">
          {isLoadingTickets ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="large" color={colors.primary.black} />
            </View>
          ) : userTickets.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12 px-4">
              <ContainerIcon
                icon="calendar-outline"
                iconType="Ionicons"
                className="bg-gray-100 p-6 mb-4"
                iconColor={colors.primary.dark_gray}
                iconSize={48}
                interactive={false}
              />
              <Text variant="interBold" className="text-lg text-center mb-2">
                No Event History
              </Text>
              <Text variant="interMedium" className="text-gray-500 text-center">
                Events you attend will appear here.{"\n"}
                Start exploring and get tickets!
              </Text>
            </View>
          ) : (
            <FlashList
              className="flex-1 mx-4"
              showsVerticalScrollIndicator={false}
              data={userTickets}
              renderItem={({ item }) => {
                const eventDate = new Date(item.event_time);
                const monthName = eventDate.toLocaleString("en-US", {
                  month: "short",
                });
                const day = eventDate.getDate();
                const eventImage =
                  item.gallery?.[0] ||
                  "https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg";

                return (
                  <TouchableOpacity
                    className="flex-row mb-3"
                    onPress={() =>
                      router.push(`/events/event?id=${item.event_id}`)
                    }
                  >
                    <Image
                      source={{ uri: eventImage }}
                      className="w-36 h-28 rounded-l-xl"
                    />
                    <LinearGradient
                      colors={[
                        hexToRgba(colors.primary.light_gray, 0.2),
                        hexToRgba(colors.primary.light_gray, 0.5),
                        hexToRgba(colors.primary.light_gray, 0.8),
                      ]}
                      style={{
                        width: "75%",
                        position: "absolute",
                        zIndex: 20,
                        right: 0,
                        bottom: 0,
                        height: "100%",
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        alignSelf: "center",
                        justifyContent: "space-between",
                      }}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text
                        variant="interBold"
                        className="text-xl text-wrap w-[70%]"
                        numberOfLines={2}
                      >
                        {item.event_title}
                      </Text>
                      <Text
                        variant="interBold"
                        className="bg-primary-white self-end px-2 py-0.5 rounded-full"
                      >
                        {monthName}, {day}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
