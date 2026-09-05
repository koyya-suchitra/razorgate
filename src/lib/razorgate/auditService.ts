import { ActorType, AuditEvent } from './types';

export function formatTimeLabel(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const padMs = (n: number) => n.toString().padStart(3, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${padMs(date.getMilliseconds())}`;
}

export function createAuditEvent(
  eventName: string,
  actor: ActorType,
  status: AuditEvent['status'],
  reason: string,
  transactionId?: string,
  metadata: Record<string, any> = {}
): AuditEvent {
  const now = new Date();
  return {
    id: `aud_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString().slice(-4)}`,
    transactionId,
    timestamp: now.toISOString(),
    timeLabel: formatTimeLabel(now),
    eventName,
    actor,
    status,
    reason,
    metadata,
  };
}

export const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'aud_seed_01',
    transactionId: 'tx_rzg_sys_boot',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    timeLabel: '09:00:00.000',
    eventName: 'Gateway Core Initialized',
    actor: 'POLICY_ENGINE',
    status: 'SUCCESS',
    reason: 'RazorGate security policies active. Autonomous ceiling set to ₹10,000.',
    metadata: { autonomousLimit: 10000, dailyLimit: 25000, merchantRule: 'VERIFIED_ONLY' },
  },
  {
    id: 'aud_seed_02',
    transactionId: 'tx_rzg_sys_boot',
    timestamp: new Date(Date.now() - 3590000).toISOString(),
    timeLabel: '09:00:10.120',
    eventName: 'Agent Buyer Link Synchronized',
    actor: 'AI_BUYER',
    status: 'INFO',
    reason: 'AI Commerce Agent connected to RazorGate protocol via sandbox adapter.',
    metadata: { agentModel: 'Gemini Agentic Commerce Engine', status: 'ONLINE' },
  },
];
