import { PropsWithChildren } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserRole, UserRole } from '@/hooks/auth/useUserRole';
import { Text } from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RoleGuardProps extends PropsWithChildren {
  allowedRoles: UserRole[];
  fallbackRoute?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackRoute = '/(tabs)' }: RoleGuardProps) {
  const { role, isLoading } = useUserRole();
  const router = useRouter();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-primary-light_gray">
        <ActivityIndicator size="large" color={colors.primary.black} />
      </SafeAreaView>
    );
  }

  const hasAccess = allowedRoles.includes(role);

  if (!hasAccess) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-primary-light_gray px-4 gap-6">
        <Text variant="interBold" className="text-2xl text-center">
          Access Denied
        </Text>
        <Text variant="interMedium" className="text-center text-gray-600">
          You don't have permission to access this page.
          {role === 'attendee' && '\n\nThis page is only available to organizers and admins.'}
        </Text>
        <Button
          name="Go Back"
          className="bg-black px-12 py-4 rounded-full"
          onPress={() => router.replace(fallbackRoute as any)}
        />
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}
