import { Modal, View, TouchableOpacity } from "react-native";
import { Text } from "./Text";
import ContainerIcon from "./ContainerIcon";
import FollowButton from "./FollowButton";
import { colors } from "@/constants/colors";
import { EventAttendee } from "@/types/interaction";
import { FlashList } from "@shopify/flash-list";
import { useAuthContext } from "@/hooks/auth/use-auth-context";

type AttendeesModalProps = {
  visible: boolean;
  onClose: () => void;
  attendees: EventAttendee[];
  friendsAttending: EventAttendee[];
};

export default function AttendeesModal({
  visible,
  onClose,
  attendees,
  friendsAttending,
}: AttendeesModalProps) {
  const { user } = useAuthContext();
  const friendIds = new Set(friendsAttending.map((f) => f.id));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-primary-light_gray rounded-t-3xl max-h-[70%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-5 border-b border-primary-gray/20">
            <Text variant="interBold" className="text-xl">
              Attendees ({attendees.length})
            </Text>
            <TouchableOpacity onPress={onClose}>
              <ContainerIcon
                icon="close"
                iconType="Ionicons"
                iconSize={24}
                iconColor={colors.primary.black}
                interactive={false}
              />
            </TouchableOpacity>
          </View>

          {/* Friends Section */}
          {friendsAttending.length > 0 && (
            <View className="px-5 pt-4 pb-2 border-b border-primary-gray/20">
              <Text variant="interBold" className="text-sm mb-2 text-primary-black">
                Friends Attending ({friendsAttending.length})
              </Text>
              {friendsAttending.slice(0, 3).map((friend) => (
                <View key={friend.id} className="flex-row items-center py-2">
                  <View className="w-10 h-10 rounded-full bg-primary-black items-center justify-center mr-3">
                    <Text variant="interBold" className="text-white">
                      {(friend.firstname?.[0] || friend.username[0]).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text variant="interSemiBold" className="text-base">
                      {friend.firstname && friend.lastname
                        ? `${friend.firstname} ${friend.lastname}`
                        : friend.username}
                    </Text>
                    <Text variant="interMedium" className="text-xs text-primary-dark_gray">
                      @{friend.username}
                    </Text>
                  </View>
                  {user?.id !== friend.id && (
                    <FollowButton userId={friend.id} variant="compact" />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* All Attendees List */}
          <View className="flex-1 px-5">
            <Text variant="interBold" className="text-sm my-3 text-primary-dark_gray">
              All Attendees
            </Text>
            <FlashList
              data={attendees}
              estimatedItemSize={60}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isFriend = friendIds.has(item.id);
                const isCurrentUser = user?.id === item.id;
                return (
                  <View className="flex-row items-center py-2">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        isFriend ? "bg-primary-black" : "bg-primary-dark_gray"
                      }`}
                    >
                      <Text variant="interBold" className="text-white">
                        {(item.firstname?.[0] || item.username[0]).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text variant="interSemiBold" className="text-base">
                          {item.firstname && item.lastname
                            ? `${item.firstname} ${item.lastname}`
                            : item.username}
                        </Text>
                        {isCurrentUser && (
                          <View className="px-2 py-0.5 bg-secondary-blue/20 rounded-full">
                            <Text variant="interBold" className="text-xs text-secondary-blue">
                              You
                            </Text>
                          </View>
                        )}
                        {isFriend && !isCurrentUser && (
                          <View className="px-2 py-0.5 bg-primary-black/10 rounded-full">
                            <Text variant="interBold" className="text-xs text-primary-black">
                              Friend
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text variant="interMedium" className="text-xs text-primary-dark_gray">
                        @{item.username}
                      </Text>
                    </View>
                    {!isCurrentUser && (
                      <FollowButton userId={item.id} variant="compact" />
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View className="py-8 items-center">
                  <Text variant="interMedium" className="text-primary-dark_gray">
                    No attendees yet
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
