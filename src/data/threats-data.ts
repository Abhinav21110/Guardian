export type Threat = {
  id: string;
  source: string;
  type: 'Phishing' | 'Malware' | 'Spam' | 'DDoS' | 'Credential Theft' | 'SQL Injection' | 'XSS' | 'Brute Force';
  level: 'Critical' | 'High' | 'Medium' | 'Low';
  timestamp: string;
  isNew: boolean;
  status: 'Active' | 'Blocked' | 'Mitigated' | 'Resolved' | 'False Positive';
  description?: string;
  affectedAssets?: string[];
};

export const threatsData: Threat[] = [
  {
    id: '1',
    source: 'evil-link.com',
    type: 'Phishing',
    level: 'Critical',
    timestamp: '2025-10-07T19:45:00Z',
    isNew: true,
    status: 'Active',
    description: 'Phishing attempt mimicking a banking website',
    affectedAssets: ['Web Server', 'User Credentials']
  },
  {
    id: '2',
    source: 'suspicious-attachment.docx',
    type: 'Malware',
    level: 'High',
    timestamp: '2025-10-07T18:30:00Z',
    isNew: true,
    status: 'Blocked',
    description: 'Malicious document containing exploit code',
    affectedAssets: ['Email System']
  },
  {
    id: '3',
    source: 'spam-email@example.com',
    type: 'Spam',
    level: 'Medium',
    timestamp: '2025-10-07T17:15:00Z',
    isNew: false,
    status: 'Blocked',
    description: 'Unsolicited commercial email',
    affectedAssets: ['Email System']
  },
  {
    id: '4',
    source: 'another-phish.net',
    type: 'Phishing',
    level: 'Critical',
    timestamp: '2025-10-07T16:00:00Z',
    isNew: false,
    status: 'Mitigated',
    description: 'Credential harvesting site',
    affectedAssets: ['User Credentials']
  },
  {
    id: '5',
    source: 'unsolicited-offer.org',
    type: 'Spam',
    level: 'Low',
    timestamp: '2025-10-07T14:45:00Z',
    isNew: false,
    status: 'Resolved',
    description: 'Marketing spam with suspicious links',
    affectedAssets: ['Email System']
  },
  {
    id: '6',
    source: '192.168.1.100',
    type: 'DDoS',
    level: 'High',
    timestamp: '2025-10-07T13:30:00Z',
    isNew: false,
    status: 'Mitigated',
    description: 'Distributed Denial of Service attack',
    affectedAssets: ['Web Server', 'Network']
  },
  {
    id: '7',
    source: 'login-fake.com',
    type: 'Credential Theft',
    level: 'Critical',
    timestamp: '2025-10-07T12:15:00Z',
    isNew: false,
    status: 'Blocked',
    description: 'Fake login page detected',
    affectedAssets: ['User Credentials']
  },
  {
    id: '8',
    source: 'sql-inject.xyz',
    type: 'SQL Injection',
    level: 'High',
    timestamp: '2025-10-07T11:00:00Z',
    isNew: false,
    status: 'Blocked',
    description: 'SQL injection attempt on login form',
    affectedAssets: ['Database']
  }
];
