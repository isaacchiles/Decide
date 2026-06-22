import { createClient } from '@/lib/supabase/client';

export type DecisionRecord = {
  id: string;
  title: string;
  criteria: { name: string; weight: number; rationale: string }[];
  options: { name: string; source: string }[];
  scores: Record<string, Record<string, number>>;
  winner_name: string;
  winner_score: number;
  share_anonymously: boolean;
  created_at: string;
};

/**
 * Save a completed decision to Supabase.
 * Only behavioral metadata is stored — title is the only user-text field,
 * kept for the user's own reference in their history.
 */
export async function saveDecision(params: {
  title: string;
  criteria: DecisionRecord['criteria'];
  options: DecisionRecord['options'];
  scores: DecisionRecord['scores'];
  winner_name: string;
  winner_score: number;
  share_anonymously?: boolean;
}): Promise<{ id: string } | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id:           user.id,
      title:             params.title,
      criteria:          params.criteria,
      options:           params.options,
      scores:            params.scores,
      winner_name:       params.winner_name,
      winner_score:      params.winner_score,
      share_anonymously: params.share_anonymously ?? false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('saveDecision error:', error);
    return null;
  }

  return { id: data.id };
}

/**
 * Load all decisions for the current user, newest first.
 * Belt-and-suspenders: .eq('user_id') in addition to RLS policy.
 */
export async function loadDecisions(): Promise<DecisionRecord[]> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('loadDecisions error:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Load a single decision by ID for the current user.
 * Belt-and-suspenders: .eq('user_id') in addition to RLS policy.
 */
export async function getDecision(id: string): Promise<DecisionRecord | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('getDecision error:', error);
    return null;
  }

  return data ?? null;
}

/**
 * Delete a decision by ID.
 * Belt-and-suspenders: .eq('user_id') in addition to RLS policy.
 */
export async function deleteDecision(id: string): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('decisions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}
