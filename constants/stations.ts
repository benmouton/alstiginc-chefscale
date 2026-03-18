export const STATIONS = [
  'Grill',
  'Sauté',
  'Pastry',
  'Garde Manger',
  'Fry',
  'Prep',
  'Expo',
  'Other',
] as const;

export type Station = typeof STATIONS[number];
