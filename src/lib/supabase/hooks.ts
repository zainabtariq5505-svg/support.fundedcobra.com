'use client';
import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';
import type { Profile } from '@/types/database';

/**
 * Returns the current user's profile.
 * - undefined  = still loading
 * - null       = not authenticated (or Supabase not configured)
 * - Profile    = authenticated user
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    // If Supabase isn't configured, return null immediately (not loading forever)
    if (!isSupabaseConfigured()) {
      setProfile(null);
      return;
    }

    const sb = createClient();
    let mounted = true;

    async function load() {
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { if (mounted) setProfile(null); return; }
        const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
        if (mounted) setProfile(data ?? null);
      } catch {
        if (mounted) setProfile(null);
      }
    }

    load();

    const { data: { subscription } } = sb.auth.onAuthStateChange(() => load());
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return profile;
}
