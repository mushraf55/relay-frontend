import type { Workspace } from './workspace';

export type CloudWorkspaceResponse = {
  data: Partial<Workspace>;
  revision: number;
  billing: { plan: string; cycle: string; bots?: number; trialEndsAt?: string; trialDaysRemaining?: number; autoPay?: boolean };
  canEdit: boolean;
};

export function beginCloudWorkspace(current: Workspace, fresh: Workspace, profile: Workspace['profile'], sameWorkspace: boolean): Workspace {
  if (sameWorkspace && current.ready) return { ...current, profile };
  return { ...fresh, profile, bots: [], sources: [], conversations: [], team: [], auditLog: [], activity: [], aiCosts: [], ready: false };
}

export function mergeCloudWorkspace(current: Workspace, result: CloudWorkspaceResponse): Workspace {
  const data = result.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid saved workspace data');
  for (const field of ['bots', 'sources', 'conversations', 'tests', 'feedback', 'leads', 'team', 'auditLog', 'activity', 'aiCosts'] as const) {
    if (data[field] !== undefined && !Array.isArray(data[field])) throw new Error(`Invalid saved ${field}: expected a list. Your saved data has not been changed.`);
  }
  return {
    ...current,
    workspace: data.workspace ?? current.workspace,
    timezone: data.timezone ?? current.timezone,
    onboarded: data.onboarded ?? current.onboarded,
    bots: data.bots ?? current.bots,
    sources: data.sources ?? current.sources,
    conversations: data.conversations ?? current.conversations,
    tests: data.tests ?? current.tests,
    feedback: data.feedback ?? current.feedback,
    leads: data.leads ?? current.leads,
    team: data.team ?? current.team,
    auditLog: data.auditLog ?? current.auditLog,
    activity: data.activity ?? current.activity,
    aiCosts: data.aiCosts ?? current.aiCosts,
    notifications: data.notifications ?? current.notifications,
    // Billing's `bots` is a numeric entitlement, never the chatbot collection.
    plan: result.billing.plan,
    cycle: result.billing.cycle,
    trialEndsAt: result.billing.trialEndsAt,
    trialDaysRemaining: result.billing.trialDaysRemaining,
    autoPay: result.billing.autoPay !== false,
    ready: true,
    signedIn: true,
    verified: true,
    storageError: result.canEdit ? '' : 'Read-only workspace. Ask an organization admin to make changes.',
  };
}
