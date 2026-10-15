export function getAuthModeCopy(demoMode: boolean): string {
  if (demoMode) {
    return "Demo mode uses a simulated session — no Supabase account required. Connect a project under Settings to enable real Auth.";
  }
  return "Sign in with your Supabase Auth email and password. Your billing data is isolated by Row Level Security.";
}
