import { cn } from "@/utils/cn";
import React from "react";
import { Text as RNText, TextProps } from "react-native";

type Variant =
  | "passionOneRegular"
  | "passionOneBold"
  | "passionOneBlack"
  | "interRegular"
  | "interMedium"
  | "interSemiBold"
  | "interBold"
  | "interExtraBold"
  | "interBlack"
  | "heading"
  | "subheading"
  | "body"
  | "caption";

interface Props extends TextProps {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
}

const variantMap: Record<Variant, string> = {
  // Inter variants
  interRegular: "font-interRegular",
  interMedium: "font-interMedium",
  interSemiBold: "font-interSemiBold",
  interBold: "font-interBold",
  interExtraBold: "font-interExtraBold",
  interBlack: "font-interBlack",

  // SpecialGothicExpandedOne variants
  passionOneRegular: "font-passionOneRegular",
  passionOneBold: "font-passionOneBold",
  passionOneBlack: "font-passionOneBlack",

  // Custom semantic variants
  heading: "text-4xl font-passionOneBlack",
  subheading: "text-xl font-interBold",
  body: "text-base font-interRegular",
  caption: "text-sm font-interRegular",
};

export const Text: React.FC<Props> = ({
  children,
  className,
  variant = "interRegular",
  ...rest
}) => {
  const fontClass = variantMap[variant] || variantMap["interRegular"];
  return (
    <RNText className={cn(fontClass, className)} {...rest}>
      {children}
    </RNText>
  );
};
