/**
 * Database Service
 * Handles PostgreSQL connections and scan history storage
 */

import { Pool, PoolClient } from 'pg';

export interface ScanRecord {
  id?: string;
  url: string;
  finalRiskScore: number;
  classification: string;
  confidence: number;
  mlScore: number;
  llmScore: number;
  threatScore: number;
  scanType: 'url' | 'email' | 'screenshot';
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  fullReport?: any;
}

export class DatabaseService {
  private pool: Pool | null = null;

  /**
   * Initialize database connection pool
   */
  async connect(): Promise<void> {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'guardian',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      client.release();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Initialize database schema
   */
  async initializeSchema(): Promise<void> {
    if (!this.pool) throw new Error('Database not connected');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS scans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT NOT NULL,
        final_risk_score INTEGER NOT NULL,
        classification VARCHAR(50) NOT NULL,
        confidence INTEGER NOT NULL,
        ml_score INTEGER NOT NULL,
        llm_score INTEGER NOT NULL,
        threat_score INTEGER NOT NULL,
        scan_type VARCHAR(20) NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(45),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        full_report JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_scans_classification ON scans(classification);
      CREATE INDEX IF NOT EXISTS idx_scans_url ON scans(url);
    `;

    try {
      await this.pool.query(createTableQuery);
      console.log('✅ Database schema initialized');
    } catch (error) {
      console.error('❌ Schema initialization failed:', error);
      throw error;
    }
  }

  /**
   * Store scan result
   */
  async storeScan(record: ScanRecord): Promise<string> {
    if (!this.pool) throw new Error('Database not connected');

    const query = `
      INSERT INTO scans (
        url, final_risk_score, classification, confidence,
        ml_score, llm_score, threat_score, scan_type,
        user_agent, ip_address, full_report
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

    const values = [
      record.url,
      record.finalRiskScore,
      record.classification,
      record.confidence,
      record.mlScore,
      record.llmScore,
      record.threatScore,
      record.scanType,
      record.userAgent,
      record.ipAddress,
      JSON.stringify(record.fullReport)
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error('Error storing scan:', error);
      throw error;
    }
  }

  /**
   * Get recent scans
   */
  async getRecentScans(limit: number = 100): Promise<ScanRecord[]> {
    if (!this.pool) throw new Error('Database not connected');

    const query = `
      SELECT * FROM scans
      ORDER BY timestamp DESC
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);
      return result.rows.map(this.mapRowToRecord);
    } catch (error) {
      console.error('Error fetching scans:', error);
      throw error;
    }
  }

  /**
   * Get scan by ID
   */
  async getScanById(id: string): Promise<ScanRecord | null> {
    if (!this.pool) throw new Error('Database not connected');

    const query = 'SELECT * FROM scans WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      if (result.rows.length === 0) return null;
      return this.mapRowToRecord(result.rows[0]);
    } catch (error) {
      console.error('Error fetching scan:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<any> {
    if (!this.pool) throw new Error('Database not connected');

    const query = `
      SELECT 
        COUNT(*) as total_scans,
        SUM(CASE WHEN classification = 'confirmed_phishing' THEN 1 ELSE 0 END) as phishing_detected,
        SUM(CASE WHEN classification = 'high_risk' THEN 1 ELSE 0 END) as high_risk,
        SUM(CASE WHEN classification = 'suspicious' THEN 1 ELSE 0 END) as suspicious,
        SUM(CASE WHEN classification = 'safe' THEN 1 ELSE 0 END) as safe,
        AVG(final_risk_score) as avg_risk_score
      FROM scans
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  /**
   * Map database row to ScanRecord
   */
  private mapRowToRecord(row: any): ScanRecord {
    return {
      id: row.id,
      url: row.url,
      finalRiskScore: row.final_risk_score,
      classification: row.classification,
      confidence: row.confidence,
      mlScore: row.ml_score,
      llmScore: row.llm_score,
      threatScore: row.threat_score,
      scanType: row.scan_type,
      userAgent: row.user_agent,
      ipAddress: row.ip_address,
      timestamp: row.timestamp,
      fullReport: row.full_report
    };
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('✅ Database disconnected');
    }
  }
}
