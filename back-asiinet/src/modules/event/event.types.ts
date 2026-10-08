export const EVENT_TYPES = [
  "reunion",
  "cumpleanos",
  "capacitacion",
  "licencia",
  "otro",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
