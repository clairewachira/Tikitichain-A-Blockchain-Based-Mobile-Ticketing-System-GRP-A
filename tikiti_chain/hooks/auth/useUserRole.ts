import { useAuthContext } from './use-auth-context';

export type UserRole = 'attendee' | 'organizer' | 'admin';

export function useUserRole() {
  const { profile, isLoading } = useAuthContext();

  const role = (profile?.role as UserRole) || 'attendee';
  const isAttendee = role === 'attendee';
  const isOrganizer = role === 'organizer';
  const isAdmin = role === 'admin';
  const isAdminOrOrganizer = isAdmin || isOrganizer;

  return {
    role,
    isAttendee,
    isOrganizer,
    isAdmin,
    isAdminOrOrganizer,
    isLoading,
  };
}
