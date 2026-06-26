import { createClient } from '@/lib/supabase/server';
import DecisionMaker from '@/components/DecisionMaker';
import SignInModal from '@/components/SignInModal';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <DecisionMaker />
      {!user && <SignInModal />}
    </>
  );
}
