import { MarketingEventSource } from "../../../models/MarketingEvent";
import { MarketingMetricName } from "../../../models/MarketingMetric";

/**
 * Phase 11 - Step 4: Metric Normalization.
 *
 * Maps a provider's own metric label onto our canonical MarketingMetricName
 * vocabulary. Deliberately a lookup table, not a fuzzy/LLM mapping - an
 * unrecognized label is a normalization failure (see ingestion service),
 * never silently coerced into a semantically different metric. This is
 * what "do not invent unsupported metrics" means in code.
 *
 * Extensible per source: adding a new provider means adding one more map
 * here, not touching the ingestion pipeline.
 */
const CANONICAL_METRIC_NAMES: MarketingMetricName[] = [
  "impressions",
  "reach",
  "engagement",
  "likes",
  "comments",
  "shares",
  "saves",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "spend",
  "conversions",
  "conversionRate",
  "leads",
  "mqls",
  "sqls",
  "opportunities",
  "customers",
  "revenue",
];

const INSTAGRAM_METRIC_MAP: Record<string, MarketingMetricName> = {
  reach: "reach",
  impressions: "impressions",
  likes: "likes",
  comments: "comments",
  shares: "shares",
  saves: "saves",
  profile_visits: "clicks",
  link_clicks: "clicks",
};

const META_ADS_METRIC_MAP: Record<string, MarketingMetricName> = {
  impressions: "impressions",
  clicks: "clicks",
  ctr: "ctr",
  cpc: "cpc",
  cpm: "cpm",
  spend: "spend",
  conversions: "conversions",
  conversion_rate: "conversionRate",
};

const GOOGLE_ADS_METRIC_MAP: Record<string, MarketingMetricName> = {
  impressions: "impressions",
  clicks: "clicks",
  ctr: "ctr",
  cpc: "cpc",
  cost: "spend",
  conversions: "conversions",
  conversion_rate: "conversionRate",
  // "conversion value" is intentionally NOT mapped to "revenue": it is a
  // platform-estimated ad value, not CRM-confirmed revenue, and mapping it
  // would quietly pollute revenue/ROI calculations with an unconfirmed
  // number. Left unsupported until a real need + explicit product
  // decision justifies a distinct canonical metric for it.
};

const WEBSITE_METRIC_MAP: Record<string, MarketingMetricName> = {
  impressions: "impressions",
  clicks: "clicks",
  conversions: "conversions",
  conversion_rate: "conversionRate",
};

const EMAIL_CRM_METRIC_MAP: Record<string, MarketingMetricName> = {
  leads: "leads",
  mqls: "mqls",
  sqls: "sqls",
  opportunities: "opportunities",
  customers: "customers",
  revenue: "revenue",
};

const METRIC_MAPS_BY_SOURCE: Record<MarketingEventSource, Record<string, MarketingMetricName>> = {
  instagram: INSTAGRAM_METRIC_MAP,
  meta_ads: META_ADS_METRIC_MAP,
  google_ads: GOOGLE_ADS_METRIC_MAP,
  website: WEBSITE_METRIC_MAP,
  email_crm: EMAIL_CRM_METRIC_MAP,
};

function normalizeKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, "_");
}

export interface MetricNormalizationResult {
  metric: MarketingMetricName | null;
  error?: string;
}

/** Never fabricates a metric name: unrecognized labels return an explicit error instead of a guessed mapping. */
export function normalizeMetricName(source: MarketingEventSource, providerLabel: string): MetricNormalizationResult {
  const key = normalizeKey(providerLabel);

  // Already-canonical labels pass straight through, case-insensitively.
  const canonical = CANONICAL_METRIC_NAMES.find((name) => name.toLowerCase() === key);
  if (canonical) {
    return { metric: canonical };
  }

  const map = METRIC_MAPS_BY_SOURCE[source];
  const mapped = map[key];
  if (mapped) {
    return { metric: mapped };
  }

  return {
    metric: null,
    error: `Unsupported metric "${providerLabel}" for source "${source}" - no canonical mapping exists.`,
  };
}
