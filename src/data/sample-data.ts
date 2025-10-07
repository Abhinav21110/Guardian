export const chartData = [
  {
    name: 'Jan',
    phishing: 4000,
    malware: 2400,
    spam: 2400,
  },
  {
    name: 'Feb',
    phishing: 3000,
    malware: 1398,
    spam: 2210,
  },
  {
    name: 'Mar',
    phishing: 2000,
    malware: 9800,
    spam: 2290,
  },
  {
    name: 'Apr',
    phishing: 2780,
    malware: 3908,
    spam: 2000,
  },
  {
    name: 'May',
    phishing: 1890,
    malware: 4800,
    spam: 2181,
  },
  {
    name: 'Jun',
    phishing: 2390,
    malware: 3800,
    spam: 2500,
  },
  {
    name: 'Jul',
    phishing: 3490,
    malware: 4300,
    spam: 2100,
  },
];

export const lineChartData = [
  { name: 'Week 1', detected: 400, blocked: 380, falsePositives: 20 },
  { name: 'Week 2', detected: 350, blocked: 330, falsePositives: 15 },
  { name: 'Week 3', detected: 600, blocked: 580, falsePositives: 25 },
  { name: 'Week 4', detected: 480, blocked: 450, falsePositives: 30 },
  { name: 'Week 5', detected: 420, blocked: 400, falsePositives: 18 },
  { name: 'Week 6', detected: 550, blocked: 530, falsePositives: 20 },
  { name: 'Week 7', detected: 500, blocked: 480, falsePositives: 22 },
  { name: 'Week 8', detected: 520, blocked: 500, falsePositives: 25 },
];

export const areaChartData = [
  { name: 'Jan', phishing: 40, malware: 24, spam: 24 },
  { name: 'Feb', phishing: 30, malware: 13, spam: 22 },
  { name: 'Mar', phishing: 20, malware: 98, spam: 23 },
  { name: 'Apr', phishing: 27, malware: 39, spam: 20 },
  { name: 'May', phishing: 18, malware: 48, spam: 21 },
  { name: 'Jun', phishing: 23, malware: 38, spam: 25 },
  { name: 'Jul', phishing: 34, malware: 43, spam: 21 },
  { name: 'Aug', phishing: 38, malware: 50, spam: 24 },
  { name: 'Sep', phishing: 42, malware: 45, spam: 26 },
  { name: 'Oct', phishing: 50, malware: 55, spam: 30 },
  { name: 'Nov', phishing: 48, malware: 52, spam: 28 },
  { name: 'Dec', phishing: 55, malware: 60, spam: 32 },
];

export const threatTypes = [
  { id: 1, name: 'Phishing', count: 843, severity: 'High', trend: 'up' },
  { id: 2, name: 'Malware', count: 276, severity: 'Critical', trend: 'up' },
  { id: 3, name: 'Spam', count: 1242, severity: 'Low', trend: 'down' },
  { id: 4, name: 'DDoS', count: 45, severity: 'High', trend: 'up' },
  { id: 5, name: 'Credential Theft', count: 128, severity: 'Critical', trend: 'up' },
  { id: 6, name: 'SQL Injection', count: 67, severity: 'High', trend: 'down' },
  { id: 7, name: 'XSS', count: 92, severity: 'Medium', trend: 'up' },
  { id: 8, name: 'Brute Force', count: 315, severity: 'Medium', trend: 'up' },
];

export const recentThreats = [
  { id: 1, type: 'Phishing', source: 'phishy-site.com', date: '2025-10-07T14:30:00Z', status: 'Blocked' },
  { id: 2, type: 'Malware', source: 'download-malware.org', date: '2025-10-07T12:15:00Z', status: 'Blocked' },
  { id: 3, type: 'DDoS', source: '192.168.1.100', date: '2025-10-07T09:45:00Z', status: 'Mitigated' },
  { id: 4, type: 'Credential Theft', source: 'login-fake.com', date: '2025-10-06T18:20:00Z', status: 'Blocked' },
  { id: 5, type: 'Spam', source: 'spammer@example.com', date: '2025-10-06T16:10:00Z', status: 'Quarantined' },
];

export const pieChartData = [
  { name: 'Phishing', value: 400, fill: '#8884d8' },
  { name: 'Malware', value: 300, fill: '#82ca9d' },
  { name: 'Spam', value: 300, fill: '#ffc658' },
  { name: 'Suspicious', value: 200, fill: '#ff8042' },
  { name: 'DDoS', value: 150, fill: '#0088fe' },
  { name: 'Credential Theft', value: 180, fill: '#00c49f' },
];
