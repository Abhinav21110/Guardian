// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – PostgreSQL Database Service
// Falls back gracefully to in-memory storage when DB is not available
// ─────────────────────────────────────────────────────────────────────────────
import pg from 'pg';
import type { ScanResult, DashboardStats, RiskTier, AttackCategory } from '../types/index';
import { config } from '../config/env';
import { logger } from '../config/logger';

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _dbAvailable = false;

// In-memory fallback store
const memScans: ScanResult[] = [];

// ─── Pool factory ─────────────────────────────────────────────────────────────

function getPool(): pg.Pool {
  if (!_pool) {
    const poolConfig = config.db.url
      ? { connectionString: config.db.url, ssl: config.db.ssl ? { rejectUnauthorized: false } : false }
      : {
          host: config.db.host,
          port: config.db.port,
          database: config.db.name,
          user: config.db.user,
          password: config.db.password,
          ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
          max: 20,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        };
    _pool = new Pool(poolConfig);
    _pool.on('error', (err) => logger.warn({ err }, 'PostgreSQL pool error'));
  }
  return _pool;
}

// ─── Schema init ──────────────────────────────────────────────────────────────

const DDL = `
CREATE TABLE IF NOT EXISTS scans (
  id              UUID PRIMARY KEY,
  input           TEXT NOT NULL,
  input_type      VARCHAR(10) NOT NULL DEFAULT 'URL',
  risk_score      SMALLINT NOT NULL DEFAULT 0,
  tier            VARCHAR(30) NOT NULL DEFAULT 'SAFE',
  attack_category VARCHAR(40) NOT NULL DEFAULT 'UNKNOWN',
  confidence      NUMERIC(4,3) NOT NULL DEFAULT 0,
  ml_score        SMALLINT,
  llm_score       SMALLINT,
  threat_intel_score SMALLINT,
  anchored        BOOLEAN NOT NULL DEFAULT false,
  tx_hash         VARCHAR(70),
  raw_result      JSONB NOT NULL,
  ip_country      VARCHAR(5),
  domain          VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scans_created_at  ON scans (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_tier        ON scans (tier);
CREATE INDEX IF NOT EXISTS idx_scans_domain      ON scans (domain);
CREATE INDEX IF NOT EXISTS idx_scans_risk_score  ON scans (risk_score DESC);
`;

export async function initDatabase(): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(DDL);
    _dbAvailable = true;
    logger.info('Database initialised');
  } catch (err) {
    logger.warn({ err }, 'Database unavailable – using in-memory store');
    _dbAvailable = false;
  }
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

export async function persistScan(result: ScanResult): Promise<void> {
  if (!_dbAvailable) {
    memScans.unshift(result);
    if (memScans.length > 500) memScans.pop();
    return;
  }

  const domain = (() => {
    try {
      return new URL(result.input.startsWith('http') ? result.input : `http://${result.input}`).hostname;
    } catch { return null; }
  })();

  await getPool().query(
    `INSERT INTO scans (id, input, input_type, risk_score, tier, attack_category, confidence,
      ml_score, llm_score, threat_intel_score, anchored, tx_hash, raw_result, ip_country, domain)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (id) DO NOTHING`,
    [
      result.scanId,
      result.input.slice(0, 2000),
      result.inputType,
      result.fusion.unifiedRiskScore,
      result.fusion.tier,
      result.fusion.attackCategory,
      result.fusion.confidence,
      result.ml?.riskScore ?? null,
      result.llm?.semanticRiskScore ?? null,
      result.threatIntel ? 100 - result.threatIntel.reputationScore : null,
      result.anchored,
      result.txHash ?? null,
      result,
      result.threatIntel?.geoIp?.countryCode ?? null,
      domain,
    ],
  );
}

export async function getRecentScans(limit = 50, offset = 0): Promise<ScanResult[]> {
  if (!_dbAvailable) {
    return memScans.slice(offset, offset + limit);
  }
  const res = await getPool().query<{ raw_result: ScanResult }>(
    'SELECT raw_result FROM scans ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset],
  );
  return res.rows.map(r => r.raw_result);
}

export async function getScanById(id: string): Promise<ScanResult | null> {
  if (!_dbAvailable) return memScans.find(s => s.scanId === id) ?? null;
  const res = await getPool().query<{ raw_result: ScanResult }>(
    'SELECT raw_result FROM scans WHERE id = $1',
    [id],
  );
  return res.rows[0]?.raw_result ?? null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!_dbAvailable) return buildInMemoryStats();
  return buildDbStats();
}

// ─── In-memory stats builder ──────────────────────────────────────────────────

function buildInMemoryStats(): DashboardStats {
  const total = memScans.length;
  const now   = Date.now();
  const scansToday    = memScans.filter(s => now - new Date(s.timestamp).getTime() < 86_400_000).length;
  const scansThisWeek = memScans.filter(s => now - new Date(s.timestamp).getTime() < 604_800_000).length;

  const tierMap: Record<RiskTier, number> = { SAFE: 0, SUSPICIOUS: 0, HIGH_RISK: 0, CONFIRMED_PHISHING: 0 };
  const catMap: Partial<Record<AttackCategory, number>> = {};
  let totalScore = 0;
  let detected = 0;

  for (const s of memScans) {
    tierMap[s.fusion.tier] = (tierMap[s.fusion.tier] ?? 0) + 1;
    catMap[s.fusion.attackCategory] = (catMap[s.fusion.attackCategory] ?? 0) + 1;
    totalScore += s.fusion.unifiedRiskScore;
    if (s.fusion.tier !== 'SAFE') detected++;
  }

  return {
    totalScans: total,
    scansToday,
    scansThisWeek,
    threatsByTier: tierMap,
    threatsByCategory: catMap as Record<AttackCategory, number>,
    topMaliciousDomains: [],
    averageRiskScore: total > 0 ? Math.round(totalScore / total) : 0,
    detectionRate: total > 0 ? Math.round((detected / total) * 100) : 0,
    recentScans: memScans.slice(0, 10),
    geoDistribution: [],
    riskTimeSeries: [],
    processingStats: { avgMs: 0, p95Ms: 0, p99Ms: 0 },
  };
}

// ─── DB stats builder ─────────────────────────────────────────────────────────

async function buildDbStats(): Promise<DashboardStats> {
  const pool = getPool();

  const [totals, recentRows, tierRows, catRows, domainRows, avgRow, geoRows, timeSeriesRows, perfRow] =
    await Promise.all([
      pool.query<{ total: string; today: string; week: string }>(`
        SELECT
          COUNT(*)                                                            AS total,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day')      AS today,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')     AS week
        FROM scans`),
      pool.query<{ raw_result: ScanResult }>('SELECT raw_result FROM scans ORDER BY created_at DESC LIMIT 10'),
      pool.query<{ tier: string; count: string }>('SELECT tier, COUNT(*) AS count FROM scans GROUP BY tier'),
      pool.query<{ attack_category: string; count: string }>('SELECT attack_category, COUNT(*) AS count FROM scans GROUP BY attack_category'),
      pool.query<{ domain: string; count: string }>(`
        SELECT domain, COUNT(*) AS count FROM scans
        WHERE domain IS NOT NULL AND tier IN ('HIGH_RISK','CONFIRMED_PHISHING')
        GROUP BY domain ORDER BY count DESC LIMIT 10`),
      pool.query<{ avg: string; detected: string; total: string }>(`
        SELECT AVG(risk_score) AS avg,
               COUNT(*) FILTER (WHERE tier != 'SAFE') AS detected,
               COUNT(*) AS total
        FROM scans`),
      pool.query<{ ip_country: string; count: string; lat: string; lng: string }>(`
        SELECT ip_country, COUNT(*) AS count, 0 AS lat, 0 AS lng
        FROM scans WHERE ip_country IS NOT NULL GROUP BY ip_country ORDER BY count DESC LIMIT 20`),
      pool.query<{ date: string; safe: string; suspicious: string; high_risk: string; confirmed: string }>(`
        SELECT DATE(created_at) AS date,
               COUNT(*) FILTER (WHERE tier = 'SAFE')               AS safe,
               COUNT(*) FILTER (WHERE tier = 'SUSPICIOUS')          AS suspicious,
               COUNT(*) FILTER (WHERE tier = 'HIGH_RISK')           AS high_risk,
               COUNT(*) FILTER (WHERE tier = 'CONFIRMED_PHISHING')  AS confirmed
        FROM scans WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at) ORDER BY date ASC`),
      pool.query<{ avg_ms: string; p95_ms: string; p99_ms: string }>(`
        SELECT
          AVG((raw_result->>'processingMs')::int)                              AS avg_ms,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (raw_result->>'processingMs')::int) AS p95_ms,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (raw_result->>'processingMs')::int) AS p99_ms
        FROM scans`),
    ]);

  const tierMap: Record<RiskTier, number> = { SAFE: 0, SUSPICIOUS: 0, HIGH_RISK: 0, CONFIRMED_PHISHING: 0 };
  for (const row of tierRows.rows) tierMap[row.tier as RiskTier] = Number(row.count);

  const catMap: Partial<Record<AttackCategory, number>> = {};
  for (const row of catRows.rows) catMap[row.attack_category as AttackCategory] = Number(row.count);

  const agg = totals.rows[0];
  const avg = avgRow.rows[0];

  return {
    totalScans:     Number(agg?.total ?? 0),
    scansToday:     Number(agg?.today ?? 0),
    scansThisWeek:  Number(agg?.week ?? 0),
    threatsByTier:  tierMap,
    threatsByCategory: catMap as Record<AttackCategory, number>,
    topMaliciousDomains: domainRows.rows.map(r => ({ domain: r.domain, count: Number(r.count) })),
    averageRiskScore: Math.round(Number(avg?.avg ?? 0)),
    detectionRate:   Number(avg?.total) > 0 ? Math.round((Number(avg?.detected ?? 0) / Number(avg?.total)) * 100) : 0,
    recentScans:    recentRows.rows.map(r => r.raw_result),
    geoDistribution: geoRows.rows.map(r => ({
      country: r.ip_country, countryCode: r.ip_country,
      count: Number(r.count), lat: Number(r.lat), lng: Number(r.lng),
    })),
    riskTimeSeries: timeSeriesRows.rows.map(r => ({
      date: r.date,
      safe: Number(r.safe),
      suspicious: Number(r.suspicious),
      highRisk: Number(r.high_risk),
      confirmed: Number(r.confirmed),
    })),
    processingStats: {
      avgMs: Math.round(Number(perfRow.rows[0]?.avg_ms ?? 0)),
      p95Ms: Math.round(Number(perfRow.rows[0]?.p95_ms ?? 0)),
      p99Ms: Math.round(Number(perfRow.rows[0]?.p99_ms ?? 0)),
    },
  };
}

export async function disconnectDatabase(): Promise<void> {
  if (_pool) { await _pool.end(); _pool = null; }
}
