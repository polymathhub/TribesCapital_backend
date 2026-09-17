export type MessagingMember = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  isActive: boolean;
  presence: 'online' | 'offline';
  lastSeenAt: Date | null;
};
