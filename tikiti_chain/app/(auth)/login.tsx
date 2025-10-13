import ContainerIcon from "@/components/ui/ContainerIcon";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useSafeRouter } from "@/hooks/navigation/router";
import { useSignInWithEmail } from "@/hooks/user/authHooks";
import { cn } from "@/utils/cn";
import { hexToRgba } from "@/utils/functions";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LoginData = {
  emailAddress: string;
  password: string;
};

type FormErrors = {
  [key: string]: string;
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithEmail, isSigningInWithEmail } = useSignInWithEmail();

  const router = useSafeRouter();

  const [formData, setFormData] = useState<LoginData>({
    emailAddress: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.emailAddress.trim()) {
      newErrors.emailAddress = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.emailAddress)) {
      newErrors.emailAddress = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    signInWithEmail({
      email: formData.emailAddress,
      password: formData.password,
    });
  };

  const updateFormData = (field: keyof LoginData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const renderFormField = (
    field: keyof LoginData,
    placeholder: string,
    icon: string,
    options?: {
      secureTextEntry?: boolean;
      keyboardType?: any;
      showToggle?: boolean;
      onToggle?: () => void;
      showIcon?: boolean;
    },
  ) => (
    <View className="mb-4">
      <View className="relative">
        <View className="absolute left-4 top-4 z-10">
          <MaterialIcons
            name={icon as any}
            size={22}
            color={colors.primary.dark_gray}
          />
        </View>

        <TextInput
          className={cn(
            "bg-primary-light_gray border rounded-full pl-12 pr-12 py-4 text-gray-900 text-base",
            errors[field] ? "border-red-400" : "border-primary-black",
            "focus:border-2",
          )}
          placeholder={placeholder}
          placeholderTextColor={colors.primary.dark_gray}
          value={formData[field]}
          onChangeText={(text) => updateFormData(field, text)}
          secureTextEntry={options?.secureTextEntry}
          keyboardType={options?.keyboardType || "default"}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {options?.showToggle && (
          <TouchableOpacity
            className="absolute right-4 top-4"
            onPress={options.onToggle}
          >
            <Ionicons
              name={options.showIcon ? "eye" : "eye-off"}
              size={20}
              color={colors.primary.black}
            />
          </TouchableOpacity>
        )}
      </View>

      {errors[field] && (
        <Text className="text-red-500 text-sm mt-2 ml-4">{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary-light_gray">
      <StatusBar
        backgroundColor={colors.primary.light_gray}
        barStyle={"dark-content"}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View className="p-6">
          <ContainerIcon
            icon="arrow-back"
            iconType="Ionicons"
            className="p-2 rounded-full bg-primary-black shadow-sm mb-6 self-start"
            iconColor={colors.primary.white}
            handleClick={() => router.back()}
          />
        </View>

        {/* Form Content */}
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="flex-1">
            <View className="mb-8">
              <Text
                variant="subheading"
                className="text-3xl text-gray-900 mb-2"
              >
                Welcome back
              </Text>
              <Text className="text-gray-600 text-base">
                Sign in to your account
              </Text>
            </View>

            {renderFormField("emailAddress", "Email Address", "email", {
              keyboardType: "email-address",
            })}

            {renderFormField("password", "Password", "lock", {
              secureTextEntry: !showPassword,
              showToggle: true,
              onToggle: () => setShowPassword(!showPassword),
              showIcon: showPassword,
            })}

            <TouchableOpacity className="mb-6">
              <Text className="text-primary-blue text-sm text-right">
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="flex-1"
            onPress={handleLogin}
            disabled={isSigningInWithEmail}
          >
            <LinearGradient
              colors={
                !isSigningInWithEmail
                  ? [colors.primary.black, colors.primary.black]
                  : [
                      hexToRgba(colors.primary.black, 0.8),
                      hexToRgba(colors.primary.black, 0.8),
                    ]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 16, borderRadius: 30 }}
            >
              {isSigningInWithEmail ? (
                <View className="flex-row items-center justify-center">
                  <MaterialIcons
                    name="hourglass-empty"
                    size={20}
                    color="white"
                  />
                  <Text variant="interSemiBold" className="text-white ml-2">
                    Signing in...
                  </Text>
                </View>
              ) : (
                <Text
                  variant="interSemiBold"
                  className="text-center text-white"
                >
                  Sign In
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Actions */}
        <View className="px-6 pb-6 pt-4">
          <View className="flex-row items-center justify-center mt-4">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text className="text-primary-blue font-interBold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
