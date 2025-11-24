import ContainerIcon from "@/components/ui/ContainerIcon";
import { colors } from "@/constants/colors";
import { useSafeRouter } from "@/hooks/navigation/router";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ImageBackground, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ImagesPreview() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useSafeRouter();
  const [aspectRatio, setAspectRatio] = useState(1);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  useEffect(() => {
    if (uri) {
      Image.getSize(uri, (width, height) => {
        setAspectRatio(width / height);
      });
    }
  }, [uri]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-black">
      {isLoadingImage && (
        <ActivityIndicator
          color={colors.primary.black}
          className="self-center absolute top-0 right-0 left-0 bottom-0"
          size={"large"}
        />
      )}
      <ImageBackground
        style={{
          width: "100%",
          aspectRatio,
        }}
        resizeMode="contain"
        source={{ uri }}
        onLoadStart={() => setIsLoadingImage(true)}
        onLoadEnd={() => setIsLoadingImage(false)}
      />
      <ContainerIcon
        icon="arrow-back"
        iconType="MaterialIcons"
        iconColor={colors.primary.white}
        className="bg-secondary-purple_300 p-3 absolute top-14 self-start ml-6"
        handleClick={() => router.back()}
      />
    </SafeAreaView>
  );
}
