import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null | undefined;

const PUBLIC_COMPANY_USER_ID = '00000000-0000-4000-8000-000000000001';
const PUBLIC_COMPANY_ORGANIZATION_ID = '00000000-0000-4000-8000-000000000002';

export function isDemoMode(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export function isCompanyAuthDisabled(): boolean {
  return process.env.NEXT_PUBLIC_DISABLE_COMPANY_AUTH === 'true';
}

export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
  );
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient !== undefined) return adminClient;

  if (isDemoMode()) {
    adminClient = null;
    return adminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required in production',
      );
    }
    adminClient = null;
    return adminClient;
  }

  adminClient = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

export async function requireCompanyContext(request: Request): Promise<{
  userId: string;
  organizationId: string;
}> {
  if (isCompanyAuthDisabled()) {
    const admin = getSupabaseAdmin();
    const organizationId =
      process.env.PUBLIC_DEMO_ORGANIZATION_ID ?? PUBLIC_COMPANY_ORGANIZATION_ID;

    if (admin) {
      const { error } = await admin.from('organizations').upsert(
        { id: organizationId, name: 'RoundTable Demo Company' },
        { onConflict: 'id', ignoreDuplicates: true },
      );
      if (error) throw new Error(`Public company workspace setup failed: ${error.message}`);
    }

    return { userId: PUBLIC_COMPANY_USER_ID, organizationId };
  }

  const { userId, admin, email, displayName } = await requireSupabaseUser(request);

  if (!admin) {
    return {
      userId,
      organizationId:
        request.headers.get('x-demo-organization-id') ??
        PUBLIC_COMPANY_ORGANIZATION_ID,
    };
  }

  // A Google interviewer owns one private workspace. Using the auth user UUID
  // as the organization UUID makes provisioning idempotent and prevents a user
  // from accidentally landing in another interviewer's first membership.
  const workspaceName = `${displayName || email?.split('@')[0] || 'Interviewer'} workspace`.slice(0, 160);
  const { error: organizationError } = await admin.from('organizations').upsert(
    { id: userId, name: workspaceName },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  if (organizationError) throw new Error(`Company workspace setup failed: ${organizationError.message}`);

  const { error: membershipError } = await admin.from('memberships').upsert(
    { organization_id: userId, user_id: userId, role: 'owner' },
    { onConflict: 'organization_id,user_id', ignoreDuplicates: true },
  );
  if (membershipError) throw new Error(`Company membership setup failed: ${membershipError.message}`);

  return {
    userId,
    organizationId: userId,
  };
}

export async function requireSupabaseUser(request: Request): Promise<{
  userId: string;
  admin: SupabaseClient | null;
  email: string | null;
  displayName: string | null;
}> {
  const admin = getSupabaseAdmin();
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : null;

  if (!admin) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Supabase is not configured');
    }
    return { userId: PUBLIC_COMPANY_USER_ID, admin: null, email: null, displayName: null };
  }

  if (!token) throw new Error('Company authentication is required');
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error('Invalid company session');
  const providers = Array.isArray(data.user.app_metadata?.providers)
    ? data.user.app_metadata.providers
    : [data.user.app_metadata?.provider];
  if (!providers.includes('google')) throw new Error('Google interviewer authentication is required');

  const metadata = data.user.user_metadata;
  const displayName = typeof metadata?.full_name === 'string'
    ? metadata.full_name
    : typeof metadata?.name === 'string'
      ? metadata.name
      : null;
  return { userId: data.user.id, admin, email: data.user.email ?? null, displayName };
}
