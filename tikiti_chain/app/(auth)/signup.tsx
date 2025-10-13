import ContainerIcon from "@/components/ui/ContainerIcon";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useSafeRouter } from "@/hooks/navigation/router";
import { useSignUpWithEmail } from "@/hooks/user/authHooks";
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

type RegistrationData = {
  emailAddress: string;
  password: string;
  confirmPassword: string;
  userName: string;
};

type FormErrors = {
  [key: string]: string;
};

export default function SignInFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUpWithEmail, isSigningUpWithEmail } = useSignUpWithEmail();

  const router = useSafeRouter();

  const [formData, setFormData] = useState<RegistrationData>({
    emailAddress: "",
    password: "",
    confirmPassword: "",
    userName: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.emailAddress.trim()) {
        newErrors.emailAddress = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.emailAddress)) {
        newErrors.emailAddress = "Please enter a valid email";
      }
    }

    if (step === 2) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (step === 3) {
      if (!formData.userName.trim()) {
        newErrors.fullName = "Username is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleRegister = async () => {
    if (!validateStep(3)) return;

    signUpWithEmail({
      email: formData.emailAddress,
      password: formData.password,
      username: formData.userName,
    });
  };

  const updateFormData = (field: keyof RegistrationData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const renderFormField = (
    field: keyof RegistrationData,
    placeholder: string,
    icon: string,
    options?: {
      secureTextEntry?: boolean;
      keyboardType?: any;
      showToggle?: boolean;
      onToggle?: () => void;
      showIcon?: boolean;
      dropdown?: string[];
      dropdownVisible?: boolean;
      onDropdownToggle?: () => void;
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

  const renderStep1 = () => (
    <View className="flex-1">
      <View className="mb-8">
        <Text variant="subheading" className="text-3xl text-gray-900 mb-2">
          What&apos;s your email?
        </Text>
      </View>

      {renderFormField("emailAddress", "Email Address", "email", {
        keyboardType: "email-address",
      })}
    </View>
  );

  const renderStep2 = () => (
    <View className="flex-1">
      <View className="mb-8">
        <Text variant="subheading" className="text-3xl text-gray-900 mb-2">
          Come up with a password
        </Text>
        <Text className="text-gray-600 text-base">
          Using{" "}
          <Text variant="interBold" className="text-black">
            {formData.emailAddress}
          </Text>{" "}
          to sign up
        </Text>
      </View>

      {renderFormField("password", "Password", "lock", {
        secureTextEntry: !showPassword,
        showToggle: true,
        onToggle: () => setShowPassword(!showPassword),
        showIcon: showPassword,
      })}

      {renderFormField("confirmPassword", "Confirm Password", "lock", {
        secureTextEntry: !showConfirmPassword,
        showToggle: true,
        onToggle: () => setShowConfirmPassword(!showConfirmPassword),
        showIcon: showConfirmPassword,
      })}

      <View className="bg-blue-50 rounded-2xl p-4 mt-4">
        <Text className="text-primary-blue text-sm font-medium mb-2">
          Password Requirements:
        </Text>
        <View className="space-y-1">
          <View className="flex-row items-center">
            <MaterialIcons
              name={
                formData.password.length >= 8
                  ? "check-circle"
                  : "radio-button-unchecked"
              }
              size={16}
              color={
                formData.password.length >= 8
                  ? colors.secondary.green
                  : colors.secondary.gray
              }
            />
            <Text
              className={cn(
                "text-sm ml-2",
                formData.password.length >= 8
                  ? "text-primary-green"
                  : "text-gray-600",
              )}
            >
              At least 8 characters
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="flex-1">
      <View className="mb-8">
        <Text variant="subheading" className="text-3xl text-gray-900 mb-2">
          Your username
        </Text>
        <Text className="text-gray-600 text-base">
          Using{" "}
          <Text variant="interBold" className="text-black">
            {formData.emailAddress}
          </Text>{" "}
          to sign up
        </Text>
      </View>

      {renderFormField("userName", "JohnDoe", "person")}
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
            handleClick={() => (currentStep > 1 ? prevStep() : router.back())}
          />

          {/* Progress Indicator */}
          <View className="flex-row items-center self-center mb-6 gap-3">
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                className={cn(
                  `bg-primary-gray h-1 flex-1 rounded-full`,

                  step <= currentStep ? "bg-black" : "bg-primary-gray",
                )}
              ></View>
            ))}
          </View>
        </View>

        {/* Form Content */}
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>

        {/* Bottom Actions */}
        <View className="px-6 pb-6 pt-4">
          <View className="flex-row gap-4">
            {currentStep > 1 && (
              <TouchableOpacity
                className="flex-1 bg-primary-white py-4 rounded-full"
                onPress={prevStep}
                disabled={isSigningUpWithEmail}
              >
                <Text
                  variant="interSemiBold"
                  className="text-center text-black"
                >
                  Previous
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className={cn(currentStep > 1 ? "flex-1" : "flex-1")}
              onPress={currentStep === 3 ? handleRegister : nextStep}
              disabled={isSigningUpWithEmail}
            >
              <LinearGradient
                colors={
                  !isSigningUpWithEmail
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
                {isSigningUpWithEmail ? (
                  <View className="flex-row items-center justify-center">
                    <MaterialIcons
                      name="hourglass-empty"
                      size={20}
                      color="white"
                    />
                    <Text variant="interSemiBold" className="text-white ml-2">
                      Creating Account...
                    </Text>
                  </View>
                ) : (
                  <Text
                    variant="interSemiBold"
                    className="text-center text-white"
                  >
                    {currentStep === 3 ? "Create Account" : "Continue"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
