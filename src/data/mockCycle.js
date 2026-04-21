// Mock cycle data for UI development
export const currentCycleDay = 14;
export const cycleLength = 28;

export const GUIDANCE = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
};

export const MUCUS = {
  NONE: 'none',
  STICKY: 'sticky',
  CREAMY: 'creamy',
  WATERY: 'watery',
  EGGWHITE: 'egg-white',
};

export const todayGuidance = {
  indicator: GUIDANCE.YELLOW,
  label: 'Use caution tonight',
  detail: 'Peak-type mucus observed yesterday. Post-peak rules apply — confirm 3 dry days to reach green.',
  confidence: 72,
};

export const cycleEntries = [
  { day: 1,  date: '2026-04-05', temp: 97.2, mucus: MUCUS.NONE,      lh: null,  estrogen: null, bleed: true,  symptoms: [] },
  { day: 2,  date: '2026-04-06', temp: 97.1, mucus: MUCUS.NONE,      lh: null,  estrogen: null, bleed: true,  symptoms: [] },
  { day: 3,  date: '2026-04-07', temp: 97.0, mucus: MUCUS.NONE,      lh: null,  estrogen: null, bleed: true,  symptoms: [] },
  { day: 4,  date: '2026-04-08', temp: 97.1, mucus: MUCUS.NONE,      lh: null,  estrogen: null, bleed: true,  symptoms: [] },
  { day: 5,  date: '2026-04-09', temp: 97.3, mucus: MUCUS.NONE,      lh: null,  estrogen: null, bleed: false, symptoms: [] },
  { day: 6,  date: '2026-04-10', temp: 97.2, mucus: MUCUS.NONE,      lh: null,  estrogen: null, bleed: false, symptoms: [] },
  { day: 7,  date: '2026-04-11', temp: 97.2, mucus: MUCUS.STICKY,    lh: null,  estrogen: null, bleed: false, symptoms: [] },
  { day: 8,  date: '2026-04-12', temp: 97.3, mucus: MUCUS.STICKY,    lh: null,  estrogen: null, bleed: false, symptoms: [] },
  { day: 9,  date: '2026-04-13', temp: 97.1, mucus: MUCUS.CREAMY,    lh: null,  estrogen: 15.2, bleed: false, symptoms: ['mild cramps'] },
  { day: 10, date: '2026-04-14', temp: 97.4, mucus: MUCUS.CREAMY,    lh: null,  estrogen: 18.6, bleed: false, symptoms: [] },
  { day: 11, date: '2026-04-15', temp: 97.3, mucus: MUCUS.WATERY,    lh: 12.1, estrogen: 24.0, bleed: false, symptoms: ['tender'] },
  { day: 12, date: '2026-04-16', temp: 97.2, mucus: MUCUS.EGGWHITE,  lh: 28.4, estrogen: 31.5, bleed: false, symptoms: ['tender', 'bloating'] },
  { day: 13, date: '2026-04-17', temp: 97.5, mucus: MUCUS.EGGWHITE,  lh: 64.8, estrogen: 38.2, bleed: false, symptoms: ['tender'] },
  { day: 14, date: '2026-04-18', temp: null,  mucus: null,            lh: null,  estrogen: null, bleed: false, symptoms: [], isToday: true },
];

export const patternFlags = [
  {
    id: 'lh-surge',
    type: 'info',
    title: 'LH surge detected',
    body: 'Your LH peaked at 64.8 mIU/mL on Day 13. Ovulation likely occurred within 12–36 hours.',
    day: 13,
  },
  {
    id: 'short-luteal',
    type: 'warning',
    title: 'Short luteal phase — last 2 cycles',
    body: 'Your past two cycles show 10-day luteal phases. A phase under 10 days may affect implantation. Consider discussing with your practitioner.',
    day: null,
  },
  {
    id: 'temp-shift',
    type: 'info',
    title: 'Thermal shift not yet confirmed',
    body: 'Expecting a sustained temp rise in the next 1–2 days to confirm ovulation. Log your temp tomorrow morning.',
    day: 14,
  },
];

export const cycleHistory = [
  { cycleNum: 23, start: '2026-03-08', length: 28, ovulationDay: 14, lutealLength: 14, peakMucus: MUCUS.EGGWHITE },
  { cycleNum: 22, start: '2026-02-08', length: 28, ovulationDay: 15, lutealLength: 13, peakMucus: MUCUS.EGGWHITE },
  { cycleNum: 21, start: '2026-01-11', length: 28, ovulationDay: 16, lutealLength: 12, peakMucus: MUCUS.WATERY },
  { cycleNum: 20, start: '2025-12-14', length: 29, ovulationDay: 17, lutealLength: 12, peakMucus: MUCUS.EGGWHITE },
  { cycleNum: 19, start: '2025-11-15', length: 29, ovulationDay: 16, lutealLength: 13, peakMucus: MUCUS.EGGWHITE },
  { cycleNum: 18, start: '2025-10-17', length: 29, ovulationDay: 15, lutealLength: 14, peakMucus: MUCUS.EGGWHITE },
];
