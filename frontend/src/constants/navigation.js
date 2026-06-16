/**
 * Centralized Navigation Configuration
 * Defines all available pages and sidebar menu items
 */

export const NAV_ITEMS = [
  // Primary Navigation
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    key: 'home',
    section: 'main',
    available: true,
  },
  {
    id: 'learning',
    label: 'Learning Hub',
    icon: 'book',
    key: 'learning',
    section: 'main',
    available: true,
  },
  {
    id: 'vault',
    label: 'Due Diligence',
    icon: 'folder',
    key: 'vault',
    section: 'main',
    available: true,
  },
  {
    id: 'events',
    label: 'Office Hours',
    icon: 'calendar',
    key: 'events',
    section: 'main',
    available: true,
  },

  // Divider
  null,

  // Secondary Navigation
  {
    id: 'announcements',
    label: 'Announcements',
    icon: 'bell',
    key: 'announcements',
    section: 'secondary',
    available: true,
  },
  {
    id: 'help',
    label: 'Help',
    icon: 'help',
    key: 'help',
    section: 'secondary',
    available: true,
  },
];

// Only include available pages
export const AVAILABLE_PAGES = NAV_ITEMS.filter(item => item && item.available).map(item => item.key);

// Map page keys to their display names
export const PAGE_TITLES = {
  home: 'Home',
  learning: 'Learning Hub',
  vault: 'Due Diligence Vault',
  events: 'Office Hours & Events',
  announcements: 'Announcements',
  help: 'Help & Support',
};
