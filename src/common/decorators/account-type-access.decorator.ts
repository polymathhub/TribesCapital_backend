import { SetMetadata } from '@nestjs/common';

export const GUEST_READABLE_KEY = 'guest-readable';
export const INVESTOR_ONLY_KEY = 'investor-only';
export const INVESTOR_READ_ONLY_KEY = 'investor-read-only';

export const GuestReadable = () => SetMetadata(GUEST_READABLE_KEY, true);
export const InvestorOnly = () => SetMetadata(INVESTOR_ONLY_KEY, true);
export const InvestorReadOnly = () => SetMetadata(INVESTOR_READ_ONLY_KEY, true);