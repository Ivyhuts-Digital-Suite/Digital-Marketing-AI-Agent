import { MarketingEventSource, MarketingEventType } from "../../../models/MarketingEvent";

/**
 * Phase 11 - Step 2/4: Event Normalization.
 *
 * Same discipline as metricNormalizer.ts: a lookup table per source, never
 * a guess. Ambiguous provider events (e.g. an ad platform's generic
 * "conversion" event, which could be a LEAD, an OPPORTUNITY, or a CUSTOMER
 * depending on how the advertiser configured it) are intentionally left
 * unmapped here - the caller must supply the real, disambiguated
 * eventType for those (see ProviderEventPayload.eventType accepting an
 * already-canonical type verbatim).
 */
const CANONICAL_EVENT_TYPES: MarketingEventType[] = [
  "IMPRESSION",
  "ENGAGEMENT",
  "CLICK",
  "LEAD",
  "MQL",
  "SQL",
  "OPPORTUNITY",
  "CUSTOMER",
  "REVENUE",
];

const INSTAGRAM_EVENT_MAP: Record<string, MarketingEventType> = {
  impression: "IMPRESSION",
  like: "ENGAGEMENT",
  comment: "ENGAGEMENT",
  share: "ENGAGEMENT",
  save: "ENGAGEMENT",
  profile_visit: "CLICK",
  link_click: "CLICK",
};

const META_ADS_EVENT_MAP: Record<string, MarketingEventType> = {
  impression: "IMPRESSION",
  click: "CLICK",
};

const GOOGLE_ADS_EVENT_MAP: Record<string, MarketingEventType> = {
  impression: "IMPRESSION",
  click: "CLICK",
};

const WEBSITE_EVENT_MAP: Record<string, MarketingEventType> = {
  pageview: "IMPRESSION",
  click: "CLICK",
  form_submit: "LEAD",
};

const EMAIL_CRM_EVENT_MAP: Record<string, MarketingEventType> = {
  lead: "LEAD",
  mql: "MQL",
  sql: "SQL",
  opportunity: "OPPORTUNITY",
  customer: "CUSTOMER",
  revenue: "REVENUE",
};

const EVENT_MAPS_BY_SOURCE: Record<MarketingEventSource, Record<string, MarketingEventType>> = {
  instagram: INSTAGRAM_EVENT_MAP,
  meta_ads: META_ADS_EVENT_MAP,
  google_ads: GOOGLE_ADS_EVENT_MAP,
  website: WEBSITE_EVENT_MAP,
  email_crm: EMAIL_CRM_EVENT_MAP,
};

function normalizeKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, "_");
}

export interface EventNormalizationResult {
  eventType: MarketingEventType | null;
  error?: string;
}

export function normalizeEventType(source: MarketingEventSource, providerLabel: string): EventNormalizationResult {
  const key = normalizeKey(providerLabel);

  const canonical = CANONICAL_EVENT_TYPES.find((type) => type.toLowerCase() === key);
  if (canonical) {
    return { eventType: canonical };
  }

  const map = EVENT_MAPS_BY_SOURCE[source];
  const mapped = map[key];
  if (mapped) {
    return { eventType: mapped };
  }

  return {
    eventType: null,
    error: `Unsupported or ambiguous event "${providerLabel}" for source "${source}" - supply an explicit canonical eventType instead.`,
  };
}
