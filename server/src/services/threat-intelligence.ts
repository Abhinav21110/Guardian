// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – Threat Intelligence Service
// Integrates: VirusTotal v3, Google Safe Browsing v4, WHOIS, IP-geolocation
// ─────────────────────────────────────────────────────────────────────────────
import {
  type ThreatIntelResult,
  type VirusTotalResult,
  type SafeBrowsingResult,
  type WhoisResult,
  type GeoIpResult,
} from '../types/index';
import { config } from '../config/env';
import { logger } from '../config/logger';

// ─── VirusTotal v3 ────────────────────────────────────────────────────────────

async function queryVirusTotal(url: string): Promise<VirusTotalResult | undefined> {
  if (!config.api.virusTotalKey) return undefined;
  try {
    // Encode URL for VT API
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: { 'x-apikey': config.api.virusTotalKey },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 404) {
      // Submit for analysis first
      const form = new URLSearchParams({ url });
      const submit = await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: { 'x-apikey': config.api.virusTotalKey, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        signal: AbortSignal.timeout(8000),
      });
      if (!submit.ok) return undefined;
      const submitData = await submit.json() as { data?: { id?: string } };
      const analysisId = submitData?.data?.id;
      if (!analysisId) return undefined;

      // Poll for results (1 attempt)
      await new Promise(r => setTimeout(r, 3000));
      const analysisRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: { 'x-apikey': config.api.virusTotalKey },
        signal: AbortSignal.timeout(8000),
      });
      if (!analysisRes.ok) return undefined;
      const analysis = await analysisRes.json() as { data?: { attributes?: { stats?: Record<string, number>; results?: Record<string, { result?: string }> } } };
      const stats  = analysis?.data?.attributes?.stats ?? {};
      const results = analysis?.data?.attributes?.results ?? {};
      const positives = (stats['malicious'] ?? 0) + (stats['suspicious'] ?? 0);
      const total     = Object.values(stats).reduce((a, b) => a + b, 0);
      const detected  = Object.entries(results)
        .filter(([, v]) => v.result && !['clean', 'unrated'].includes(v.result))
        .map(([k]) => k);
      return { positives, total, scanDate: new Date().toISOString(), permalink: `https://www.virustotal.com/gui/url/${urlId}`, detectedEngines: detected };
    }

    if (!res.ok) return undefined;
    const data = await res.json() as { data?: { attributes?: { last_analysis_stats?: Record<string, number>; last_analysis_results?: Record<string, { result?: string }>; last_analysis_date?: number; permalink?: string } } };
    const attr    = data?.data?.attributes ?? {};
    const stats   = attr.last_analysis_stats ?? {};
    const results = attr.last_analysis_results ?? {};
    const positives = (stats['malicious'] ?? 0) + (stats['suspicious'] ?? 0);
    const total     = Object.values(stats).reduce((a, b) => a + b, 0);
    const detected  = Object.entries(results)
      .filter(([, v]) => v.result && !['clean', 'unrated'].includes(v.result))
      .map(([k]) => k);
    const scanDate = attr.last_analysis_date
      ? new Date(attr.last_analysis_date * 1000).toISOString()
      : new Date().toISOString();

    return { positives, total, scanDate, permalink: `https://www.virustotal.com/gui/url/${urlId}`, detectedEngines: detected };
  } catch (err) {
    logger.warn({ err }, 'VirusTotal query failed');
    return undefined;
  }
}

// ─── Google Safe Browsing v4 ──────────────────────────────────────────────────

async function queryGoogleSafeBrowsing(url: string): Promise<SafeBrowsingResult | undefined> {
  if (!config.api.safeBrowsingKey) return undefined;
  try {
    const body = {
      client: { clientId: 'guardian-ai', clientVersion: '1.0.0' },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${config.api.safeBrowsingKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return undefined;
    const data = await res.json() as { matches?: Array<{ threatType?: string; platformType?: string }> };
    const matches = data?.matches ?? [];
    return {
      isMalicious: matches.length > 0,
      threatTypes: [...new Set(matches.map(m => m.threatType ?? 'UNKNOWN'))],
      platformTypes: [...new Set(matches.map(m => m.platformType ?? 'ANY_PLATFORM'))],
    };
  } catch (err) {
    logger.warn({ err }, 'Google Safe Browsing query failed');
    return undefined;
  }
}

// ─── WHOIS (via whois.freeaiapi.io public endpoint) ───────────────────────────

async function queryWhois(domain: string): Promise<WhoisResult | undefined> {
  try {
    const res = await fetch(
      `https://api.whois.vu/?q=${encodeURIComponent(domain)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return undefined;
    const raw = await res.json() as Record<string, unknown>;

    const createdStr  = String(raw['creation_date'] ?? raw['created'] ?? '');
    const updatedStr  = String(raw['updated_date'] ?? raw['updated'] ?? '');
    const expiresStr  = String(raw['expiration_date'] ?? raw['expires'] ?? '');

    const createdDate = createdStr ? new Date(createdStr).toISOString() : null;
    const updatedDate = updatedStr ? new Date(updatedStr).toISOString() : null;
    const expiresDate = expiresStr ? new Date(expiresStr).toISOString() : null;

    const ageInDays = createdDate
      ? Math.floor((Date.now() - new Date(createdDate).getTime()) / 86_400_000)
      : null;

    const ns = raw['name_servers'] ?? raw['nameservers'];
    const nameServers: string[] = Array.isArray(ns) ? ns.map(String) :
      typeof ns === 'string' ? ns.split(/[\s,]+/).filter(Boolean) : [];

    return {
      domainName: String(raw['domain_name'] ?? domain),
      registrar: String(raw['registrar'] ?? 'Unknown'),
      createdDate,
      updatedDate,
      expiresDate,
      ageInDays,
      registrantCountry: String(raw['country'] ?? raw['registrant_country'] ?? ''),
      nameServers: nameServers.slice(0, 6),
    };
  } catch (err) {
    logger.warn({ err }, 'WHOIS query failed');
    return undefined;
  }
}

// ─── IP Geolocation (ipinfo.io) ───────────────────────────────────────────────

async function queryGeoIp(hostname: string): Promise<GeoIpResult | undefined> {
  try {
    // Resolve hostname to IP via DNS-over-HTTPS if it's not already an IP
    let ip = hostname;
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (!isIp) {
      const doh = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`,
        { signal: AbortSignal.timeout(4000) },
      );
      if (doh.ok) {
        const dns = await doh.json() as { Answer?: Array<{ data?: string }> };
        ip = dns?.Answer?.[0]?.data ?? hostname;
      }
    }

    const token = config.api.ipInfoToken ? `?token=${config.api.ipInfoToken}` : '';
    const res = await fetch(`https://ipinfo.io/${ip}/json${token}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return undefined;
    const d = await res.json() as Record<string, unknown>;

    const [lat, lng] = String(d['loc'] ?? '0,0').split(',').map(Number);
    return {
      ip: String(d['ip'] ?? ip),
      country: String(d['country'] ?? ''),
      countryCode: String(d['country'] ?? ''),
      city: String(d['city'] ?? ''),
      org: String(d['org'] ?? ''),
      asn: String(d['org'] ?? '').split(' ')[0] ?? '',
      latitude: lat ?? 0,
      longitude: lng ?? 0,
      isTor: false,   // upgrade with AbuseIPDB if needed
      isProxy: false,
      isHosting: String(d['org'] ?? '').toLowerCase().includes('hosting') ||
        String(d['org'] ?? '').toLowerCase().includes('cloud'),
    };
  } catch (err) {
    logger.warn({ err }, 'GeoIP query failed');
    return undefined;
  }
}

// ─── Public aggregator ────────────────────────────────────────────────────────

export async function gatherThreatIntel(url: string): Promise<ThreatIntelResult> {
  const t0 = Date.now();
  logger.debug({ url }, 'Threat intel gathering start');

  let hostname = '';
  try {
    hostname = new URL(url.startsWith('http') ? url : `http://${url}`).hostname;
  } catch { hostname = url; }

  const [virusTotal, safeBrowsing, whois, geoIp] = await Promise.allSettled([
    queryVirusTotal(url),
    queryGoogleSafeBrowsing(url),
    queryWhois(hostname),
    queryGeoIp(hostname),
  ]);

  const vt  = virusTotal.status  === 'fulfilled' ? virusTotal.value  : undefined;
  const gsb = safeBrowsing.status === 'fulfilled' ? safeBrowsing.value : undefined;
  const wi  = whois.status       === 'fulfilled' ? whois.value       : undefined;
  const geo = geoIp.status       === 'fulfilled' ? geoIp.value       : undefined;

  // Known malicious: VT positives ≥ 3 or GSB flagged
  const knownMalicious = (vt?.positives ?? 0) >= 3 || (gsb?.isMalicious ?? false);

  // Reputation score: start 100, subtract for bad signals
  let reputationScore = 100;
  if (vt) {
    const ratio = vt.total > 0 ? vt.positives / vt.total : 0;
    reputationScore -= Math.round(ratio * 50);
  }
  if (gsb?.isMalicious)  reputationScore -= 40;
  if (wi?.ageInDays !== null && wi?.ageInDays !== undefined && wi.ageInDays < 30)   reputationScore -= 15;
  if (wi?.ageInDays !== null && wi?.ageInDays !== undefined && wi.ageInDays < 7)    reputationScore -= 10;
  reputationScore = Math.max(0, reputationScore);

  const sources: string[] = [];
  if (vt)  sources.push('VirusTotal');
  if (gsb) sources.push('GoogleSafeBrowsing');
  if (wi)  sources.push('WHOIS');
  if (geo) sources.push('IPGeolocation');

  logger.debug({ knownMalicious, reputationScore, sources }, 'Threat intel done');

  return {
    virusTotal: vt,
    safeBrowsing: gsb,
    whois: wi,
    geoIp: geo,
    knownMalicious,
    reputationScore,
    sources,
    processingMs: Date.now() - t0,
  };
}
