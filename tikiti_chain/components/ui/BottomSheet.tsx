import { Ref, useCallback, PropsWithChildren } from "react";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { View } from "react-native";
import { Text } from "./Text";
import { colors } from "@/constants/colors";
import ContainerIcon from "./ContainerIcon";

interface BottomSheetModalProps {
  title?: string;
  startSnapIndex?: number;
  bgColor?: string;
  snapPoints?: string[];
  className?: string;
  containerClassName?: string;
  handleIndicatorBackgroundColor?: string;
  pressBehaviour?: "none" | "close" | "collapse";
  enablePanDownToClose?: boolean;
  ref: Ref<BottomSheetModal>;
  handleCloseModal?: () => void;
}

export default function CustomBottomSheetModal({
  ref,
  children,
  title,
  startSnapIndex,
  bgColor,
  snapPoints: customSnapPoints,
  className,
  pressBehaviour,
  handleIndicatorBackgroundColor,
  enablePanDownToClose,
  containerClassName,
  handleCloseModal,
}: PropsWithChildren<BottomSheetModalProps>) {
  const snapPoints = ["10%", "20%", "38%", "50%", "75%", "90%"];

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        pressBehavior={pressBehaviour}
        disappearsOnIndex={-1}
      />
    ),
    [pressBehaviour],
  );
  return (
    <BottomSheetModal
      enablePanDownToClose={enablePanDownToClose ?? true}
      handleIndicatorStyle={{
        width: 70,
        backgroundColor:
          handleIndicatorBackgroundColor || colors.primary.light_gray,
      }}
      index={startSnapIndex || 2}
      ref={ref}
      snapPoints={customSnapPoints ?? snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: bgColor || colors.primary.white }}
    >
      <BottomSheetView
        className={`${containerClassName} p-4 gap-4 items-center flex-1`}
      >
        {handleCloseModal && (
          <ContainerIcon
            icon="close"
            iconType="Ionicons"
            iconColor={colors.primary.black}
            className="absolute self-start mt-3 ml-6"
            handleClick={handleCloseModal}
          />
        )}
        {title && (
          <Text variant="subheading" className="text-2xl">
            {title}
          </Text>
        )}
        <View className={`${className} gap-3`}>{children}</View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
