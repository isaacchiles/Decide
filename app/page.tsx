import { createClient } from '@/lib/supabase/server';
import DecisionMaker from '@/components/DecisionMaker';
import SignInModal from '@/components/SignInModal';
import ErrorBoundary from '@/components/ErrorBoundary';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ErrorBoundary>
      <DecisionMaker />
      {!user && <SignInModal />}
    </ErrorBoundary>
  );
}
