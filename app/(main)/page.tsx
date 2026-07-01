import { createClient } from '@/lib/supabase/server';
import DecisionMaker from '@/components/DecisionMaker';
import SignInModal from '@/components/SignInModal';
import LaunchGate from '@/components/LaunchGate';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <LaunchGate>
      <DecisionMaker />
      {!user && <SignInModal />}
    </LaunchGate>
  );
}
