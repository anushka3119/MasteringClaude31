import { NextResponse } from 'next/server';

interface IHealthResponse {
  status: 'healthy' | 'degraded' | 'critical';
  score: number;
  servicesOnline: number;
  servicesTotal: number;
  timestamp: string;
  openIncidents: number;
  services: { name: string; status: string; url: string }[];
}

const SERVICES = [
  { name: 'auth-service', port: 4001, url: 'http://localhost:4001' },
  { name: 'analytics-service', port: 4002, url: 'http://localhost:4002' },
  { name: 'notification-service', port: 4003, url: 'http://localhost:4003' },
  { name: 'payment-service', port: 4004, url: 'http://localhost:4004' }
];

export async function GET(): Promise<NextResponse<IHealthResponse>> {
  const serviceResults = await Promise.all(
    SERVICES.map(async (service) => {
      try {
        const response = await fetch(`${service.url}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        return {
          name: service.name,
          status: response.ok ? 'online' : 'error',
          url: service.url
        };
      } catch (error) {
        return {
          name: service.name,
          status: 'offline',
          url: service.url
        };
      }
    })
  );

  const servicesOnline = serviceResults.filter(s => s.status === 'online').length;
  const servicesTotal = SERVICES.length;

  // Check for open incidents from incidents API
  let openIncidents = 0;
  try {
    const incidentsRes = await fetch('http://localhost:3000/api/incidents', {
      signal: AbortSignal.timeout(5000)
    });
    const data = await incidentsRes.json();
    openIncidents = (data.incidents || []).filter((i: any) => i.status === 'OPEN').length;
  } catch (e) { /* ignore */ }

  // Score based on services and incidents
  const serviceScore = (servicesOnline / servicesTotal) * 70;
  const incidentScore = Math.max(0, 30 - openIncidents * 10);
  const score = Math.round(serviceScore + incidentScore);

  const status: IHealthResponse['status'] =
    score >= 80 ? 'healthy' : score >= 40 ? 'degraded' : 'critical';

  return NextResponse.json({
    status,
    score,
    servicesOnline,
    servicesTotal,
    timestamp: new Date().toISOString(),
    openIncidents,
    services: serviceResults
  });
}