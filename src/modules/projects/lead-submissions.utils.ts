import { BadRequestException } from '@nestjs/common';

export const LEAD_CHANNELS = ['partner', 'introducer', 'direct', 'inbound'] as const;
export const ACTIVE_LEAD_TERRITORIES = ['NG', 'GH', 'ZM', 'UG'] as const;
export const QUICK_LEAD_STEPS = ['start', 'site', 'energy', 'offtaker', 'declarations', 'review'] as const;

type LeadChannel = typeof LEAD_CHANNELS[number];
type RecordValue = Record<string, unknown>;

export interface NormalizedLeadPayload {
  channel: LeadChannel;
  submitter: {
    name: string;
    organisation: string;
    role: string;
    email: string;
    phone: string;
    whatsapp: boolean;
    countryOfResidence: string;
  };
  site: {
    name: string;
    facilityType: string;
    facilityTypeOther: string;
    address: string;
    latitude: number;
    longitude: number;
    countryCode: string;
    countryName: string;
    region: string;
    tenure: RecordValue;
  };
  energy: {
    gridStatus: string;
    hasDiesel: 'yes' | 'no' | 'unknown';
    monthlyDieselSpend: RecordValue;
    peakLoadKw: number | null;
    gridHours: number | null;
    exportIntent: 'yes' | 'no' | 'unknown';
  };
  offtaker: {
    legalName: string;
    ownership: string;
    registrationNumber: string;
    decisionMaker: RecordValue;
  };
  attribution: {
    source: string;
    interests: string[];
    interestDetails: string;
    isProjectNotice: false;
  };
  consent: {
    share: true;
    antiBribery: true;
    privacyAccepted: true;
    marketing: boolean;
  };
  opportunity: RecordValue;
}

function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException({ code: 'LEAD_FIELD_REQUIRED', message: `Complete the ${label} section before submitting.` });
  }
  return value as RecordValue;
}

function text(value: unknown, label: string, options: { min?: number; max?: number } = {}): string {
  if (typeof value !== 'string') {
    throw new BadRequestException({ code: 'LEAD_FIELD_REQUIRED', message: `Enter ${label}.` });
  }
  const normalized = value.trim();
  if (normalized.length < (options.min ?? 1) || normalized.length > (options.max ?? 500)) {
    throw new BadRequestException({ code: 'LEAD_FIELD_INVALID', message: `Check ${label} and try again.` });
  }
  return normalized;
}

function optionalText(value: unknown, label: string, max = 500): string {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.trim().length > max) {
    throw new BadRequestException({ code: 'LEAD_FIELD_INVALID', message: `Check ${label} and try again.` });
  }
  return value.trim();
}

function numberValue(value: unknown, label: string, minimum: number, maximum: number): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new BadRequestException({ code: 'LEAD_FIELD_INVALID', message: `Enter a valid ${label}.` });
  }
  return parsed;
}

function optionalNumber(value: unknown, label: string, minimum: number, maximum: number): number | null {
  if (value == null || value === '') return null;
  return numberValue(value, label, minimum, maximum);
}

function requiredAcknowledgement(value: unknown, label: string): true {
  if (value !== true) {
    throw new BadRequestException({ code: 'LEAD_CONSENT_REQUIRED', message: `Confirm ${label} to submit this lead.` });
  }
  return true;
}

export function validateLeadPayload(value: unknown): NormalizedLeadPayload {
  const payload = record(value, 'lead');
  const channel = payload.channel;
  if (typeof channel !== 'string' || !LEAD_CHANNELS.includes(channel as LeadChannel)) {
    throw new BadRequestException({ code: 'LEAD_CHANNEL_REQUIRED', message: 'Choose how you are introducing this site.' });
  }

  const submitter = record(payload.submitter, 'your details');
  const name = text(submitter.name, 'your full name', { min: 2, max: 120 });
  const role = text(submitter.role, 'your role', { max: 120 });
  const email = text(submitter.email, 'your email address', { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException({ code: 'LEAD_EMAIL_INVALID', message: 'Enter a valid email address.' });
  }
  const phone = text(submitter.phone, 'your mobile number', { max: 20 });
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    throw new BadRequestException({ code: 'LEAD_PHONE_INVALID', message: 'Enter your mobile number in international format, for example +233201234567.' });
  }
  const countryOfResidence = optionalText(submitter.countryOfResidence, 'your country of residence', 2).toUpperCase();
  if (countryOfResidence && !/^[A-Z]{2}$/.test(countryOfResidence)) {
    throw new BadRequestException({ code: 'LEAD_COUNTRY_INVALID', message: 'Choose a valid country of residence.' });
  }
  const organisation = optionalText(submitter.organisation, 'your organisation', 160);
  if ((channel === 'partner' || channel === 'direct') && !organisation) {
    throw new BadRequestException({ code: 'LEAD_ORGANISATION_REQUIRED', message: 'Enter your organisation.' });
  }

  const site = record(payload.site, 'site');
  const siteName = text(site.name, 'the facility name', { max: 160 });
  const facilityType = text(site.facilityType, 'the facility type', { max: 80 });
  const allowedFacilityTypes = [
    'hospital_clinic',
    'school_university',
    'agro_processing',
    'cold_storage',
    'manufacturing',
    'commercial_office',
    'logistics_depot',
    'hotel_hospitality',
    'telecoms',
    'water_irrigation',
    'other',
  ];
  if (!allowedFacilityTypes.includes(facilityType)) {
    throw new BadRequestException({ code: 'LEAD_FACILITY_TYPE_INVALID', message: 'Choose a facility type.' });
  }
  const facilityTypeOther = optionalText(site.facilityTypeOther, 'the facility type', 120);
  if (facilityType === 'other' && !facilityTypeOther) {
    throw new BadRequestException({ code: 'LEAD_FACILITY_TYPE_REQUIRED', message: 'Describe the facility type.' });
  }
  const geo = record(site.geo, 'site location');
  const latitude = numberValue(geo.latitude, 'latitude', -90, 90);
  const longitude = numberValue(geo.longitude, 'longitude', -180, 180);
  const countryCode = text(geo.countryCode, 'the site country', { min: 2, max: 2 }).toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new BadRequestException({ code: 'LEAD_COUNTRY_INVALID', message: 'Choose a valid site country.' });
  }
  const countryName = optionalText(geo.countryName, 'the site country name', 100);
  const region = optionalText(geo.region, 'the site region', 100);
  const address = optionalText(site.address, 'the site address', 300);

  const energy = record(payload.energy, 'energy today');
  const gridStatus = energy.gridStatus;
  if (!['mostly_available', 'patchy', 'not_connected', 'unknown'].includes(String(gridStatus))) {
    throw new BadRequestException({ code: 'LEAD_GRID_STATUS_REQUIRED', message: 'Choose the current grid connection status, or select “Don’t know yet”.' });
  }
  const hasDiesel = energy.hasDiesel;
  if (!['yes', 'no', 'unknown'].includes(String(hasDiesel))) {
    throw new BadRequestException({ code: 'LEAD_DIESEL_STATUS_REQUIRED', message: 'Tell us whether the site has diesel generators, or select “Don’t know yet”.' });
  }
  const rawSpend = energy.monthlyDieselSpend;
  let monthlyDieselSpend: RecordValue;
  if (hasDiesel === 'no' || (rawSpend && typeof rawSpend === 'object' && !Array.isArray(rawSpend) && (rawSpend as RecordValue).mode === 'unknown')) {
    monthlyDieselSpend = { mode: 'unknown' };
  } else {
    const spend = record(rawSpend, 'monthly diesel spend');
    if (spend.mode === 'unknown') {
      monthlyDieselSpend = { mode: 'unknown' };
    } else if (spend.mode === 'money') {
      const amount = numberValue(spend.amount, 'monthly diesel spend', 0, 1_000_000_000_000);
      const currency = text(spend.currency, 'the spend currency', { min: 3, max: 3 }).toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) {
        throw new BadRequestException({ code: 'LEAD_CURRENCY_INVALID', message: 'Choose a valid three-letter currency code.' });
      }
      monthlyDieselSpend = { mode: 'money', amount, currency };
    } else if (spend.mode === 'litres') {
      monthlyDieselSpend = { mode: 'litres', litresPerWeek: numberValue(spend.litresPerWeek, 'litres used each week', 0, 10_000_000) };
    } else {
      throw new BadRequestException({ code: 'LEAD_DIESEL_SPEND_REQUIRED', message: 'Enter a rough monthly diesel spend or choose “Don’t know yet”.' });
    }
  }
  const exportIntent = ['yes', 'no', 'unknown'].includes(String(energy.exportIntent)) ? String(energy.exportIntent) : 'unknown';
  const peakLoadKw = optionalNumber(energy.peakLoadKw, 'peak load in kW', 1, 50_000);
  const gridHours = optionalNumber(energy.gridHours, 'grid hours per day', 0, 24);

  const offtaker = record(payload.offtaker, 'offtaker organisation');
  const legalName = text(offtaker.legalName, 'the offtaker legal name', { max: 200 });
  const ownership = text(offtaker.ownership, 'the offtaker ownership type', { max: 80 });
  if (!['private', 'faith_mission', 'ngo_charity', 'government_public', 'unknown'].includes(ownership)) {
    throw new BadRequestException({ code: 'LEAD_OWNERSHIP_INVALID', message: 'Choose the organisation ownership type.' });
  }
  const registrationNumber = optionalText(offtaker.registrationNumber, 'the registration number', 100);
  const decisionMaker = offtaker.decisionMaker && typeof offtaker.decisionMaker === 'object' && !Array.isArray(offtaker.decisionMaker)
    ? offtaker.decisionMaker as RecordValue
    : {};
  if (decisionMaker.name && (channel === 'partner' || channel === 'introducer') && !['yes', 'no'].includes(String(decisionMaker.briefed))) {
    throw new BadRequestException({ code: 'LEAD_BRIEFED_REQUIRED', message: 'Tell us whether the decision-maker knows you are introducing them to Tribes Capital.' });
  }

  const attributionInput = payload.attribution && typeof payload.attribution === 'object' && !Array.isArray(payload.attribution)
    ? payload.attribution as RecordValue
    : {};
  const interests = Array.isArray(attributionInput.interests)
    ? attributionInput.interests.filter((item): item is string => typeof item === 'string' && item.length <= 100)
    : [];
  if (channel !== 'direct' && (!interests.length || (interests.includes('none') && interests.length > 1))) {
    throw new BadRequestException({ code: 'LEAD_INTERESTS_REQUIRED', message: 'Choose “None” or declare any interests in the project.' });
  }
  const consent = record(payload.consent, 'declarations');
  const normalizedConsent = channel === 'direct'
    ? { share: true as const, antiBribery: true as const, privacyAccepted: true as const, marketing: false }
    : {
      share: requiredAcknowledgement(consent.share, 'that you are authorised to share this information'),
      antiBribery: requiredAcknowledgement(consent.antiBribery, 'the anti-bribery declaration'),
      privacyAccepted: requiredAcknowledgement(consent.privacyAccepted, 'the privacy notice'),
      marketing: consent.marketing === true,
    };

  const source = channel === 'inbound'
    ? 'inbound'
    : optionalText(attributionInput.source, 'how you came across this site', 120);
  if ((channel === 'partner' || channel === 'introducer') && !source) {
    throw new BadRequestException({ code: 'LEAD_SOURCE_REQUIRED', message: 'Tell us how you came across this site.' });
  }

  const opportunity = payload.opportunity && typeof payload.opportunity === 'object' && !Array.isArray(payload.opportunity)
    ? payload.opportunity as RecordValue
    : {};
  const rawPvKwp = opportunity.pvKwp ?? opportunity.pv_kwp;
  const pvKwp = optionalNumber(rawPvKwp, 'indicative PV size in kWp', 0, 1_000_000);
  const rawExportIntent = opportunity.exportIntent ?? energy.exportIntent;

  return {
    channel: channel as LeadChannel,
    submitter: {
      name,
      organisation,
      role,
      email,
      phone,
      whatsapp: submitter.whatsapp === true,
      countryOfResidence,
    },
    site: {
      name: siteName,
      facilityType,
      facilityTypeOther,
      address,
      latitude,
      longitude,
      countryCode,
      countryName,
      region,
      tenure: site.tenure && typeof site.tenure === 'object' && !Array.isArray(site.tenure) ? site.tenure as RecordValue : {},
    },
    energy: {
      gridStatus: String(gridStatus),
      hasDiesel: hasDiesel as 'yes' | 'no' | 'unknown',
      monthlyDieselSpend,
      peakLoadKw,
      gridHours,
      exportIntent: ['yes', 'no'].includes(String(rawExportIntent)) ? String(rawExportIntent) as 'yes' | 'no' : 'unknown',
    },
    offtaker: {
      legalName,
      ownership,
      registrationNumber,
      decisionMaker,
    },
    attribution: {
      source,
      interests,
      interestDetails: optionalText(attributionInput.interestDetails, 'the interest details', 500),
      isProjectNotice: false,
    },
    consent: normalizedConsent,
    opportunity: { ...opportunity, ...(pvKwp == null ? {} : { pvKwp }) },
  };
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    return `{${Object.keys(objectValue).sort().map((key) => `${JSON.stringify(key)}:${stableJson(objectValue[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function haversineMeters(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = radians(latitudeB - latitudeA);
  const longitudeDelta = radians(longitudeB - longitudeA);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(latitudeA)) * Math.cos(radians(latitudeB)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ukParts(date: Date): Record<string, number> {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
}

function ukLocalDateToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
  const offsetParts = ukParts(new Date(desiredUtc));
  const representedAsUtc = Date.UTC(
    offsetParts.year,
    offsetParts.month - 1,
    offsetParts.day,
    offsetParts.hour,
    offsetParts.minute,
    offsetParts.second,
  );
  const offset = representedAsUtc - desiredUtc;
  return new Date(desiredUtc - offset);
}

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function ukBankHolidays(year: number): Set<string> {
  const key = (date: Date) => date.toISOString().slice(0, 10);
  const moveToWeekday = (date: Date): Date => {
    const adjusted = new Date(date);
    while (adjusted.getUTCDay() === 0 || adjusted.getUTCDay() === 6) adjusted.setUTCDate(adjusted.getUTCDate() + 1);
    return adjusted;
  };
  const firstMonday = (month: number) => {
    const date = new Date(Date.UTC(year, month, 1));
    while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() + 1);
    return date;
  };
  const lastMonday = (month: number) => {
    const date = new Date(Date.UTC(year, month + 1, 0));
    while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() - 1);
    return date;
  };
  const christmas = new Date(Date.UTC(year, 11, 25));
  const boxingDay = new Date(Date.UTC(year, 11, 26));
  const observedChristmas = moveToWeekday(christmas);
  const observedBoxing = moveToWeekday(boxingDay);
  if (key(observedChristmas) === key(observedBoxing)) observedBoxing.setUTCDate(observedBoxing.getUTCDate() + 1);

  const easter = easterSunday(year);
  const goodFriday = new Date(easter);
  goodFriday.setUTCDate(goodFriday.getUTCDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setUTCDate(easterMonday.getUTCDate() + 1);
  return new Set([
    key(moveToWeekday(new Date(Date.UTC(year, 0, 1)))),
    key(goodFriday),
    key(easterMonday),
    key(firstMonday(4)),
    key(lastMonday(4)),
    key(lastMonday(7)),
    key(observedChristmas),
    key(observedBoxing),
  ]);
}

function isUkWorkingDay(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  return weekday !== 0 && weekday !== 6 && !ukBankHolidays(year).has(date.toISOString().slice(0, 10));
}

export function getUkClockStartAt(submittedAt: Date): Date {
  const parts = ukParts(submittedAt);
  const minutes = parts.hour * 60 + parts.minute;
  const workingDay = isUkWorkingDay(parts.year, parts.month, parts.day);
  if (workingDay && minutes >= 9 * 60 && minutes < 17 * 60 + 30) return submittedAt;

  let candidate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (!workingDay || minutes >= 17 * 60 + 30) candidate.setUTCDate(candidate.getUTCDate() + 1);
  while (!isUkWorkingDay(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate())) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return ukLocalDateToUtc(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate(), 9, 0);
}

export function getLeadClockState(clockStartAt: Date, firstResponseAt: Date | null, now = new Date()): 'on_track' | 'due' | 'at_risk' | 'missed' | 'stopped' {
  if (firstResponseAt) return 'stopped';
  if (now <= clockStartAt) return 'on_track';

  let elapsedMs = 0;
  const startParts = ukParts(clockStartAt);
  const endParts = ukParts(now);
  const cursor = new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day));
  const lastDay = new Date(Date.UTC(endParts.year, endParts.month - 1, endParts.day));
  const workdayMs = 8.5 * 60 * 60 * 1000;
  const dueMs = workdayMs;
  const atRiskMs = dueMs * 2;
  const missedMs = dueMs * 3;

  while (cursor <= lastDay) {
    if (isUkWorkingDay(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate())) {
      const workStart = ukLocalDateToUtc(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate(), 9, 0);
      const workEnd = ukLocalDateToUtc(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate(), 17, 30);
      const intervalStart = Math.max(clockStartAt.getTime(), workStart.getTime());
      const intervalEnd = Math.min(now.getTime(), workEnd.getTime());
      if (intervalEnd > intervalStart) elapsedMs += intervalEnd - intervalStart;
      if (elapsedMs > missedMs) return 'missed';
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (elapsedMs > missedMs) return 'missed';
  if (elapsedMs >= atRiskMs) return 'at_risk';
  if (elapsedMs >= dueMs) return 'due';
  return 'on_track';
}
