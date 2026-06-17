import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import DashboardShell from "@/components/dashboard/DashboardShell";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  creator_id: string;
  created_at: string;
  creator_name?: string;
  attachment_url?: string;
  attachment_name?: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: "customer" | "agent";
  created_at: string;
}

export default async function Page() {
  let profile: Profile | null = null;
  let initialTickets: Ticket[] = [];
  let allProfiles: Profile[] = [];

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Get authenticated user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    // Not logged in -> redirect to login page
    redirect('/login');
  }

  // 2. Fetch profile role info
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select()
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Profile fetch failed: ${profileError.message}`);
  }

  if (!profileData) {
    // Lazy-create profile in database to prevent foreign key errors for registered users whose profile row is missing
    const defaultName = user.email?.split('@')[0] || "User";
    const newProfile = {
      id: user.id,
      name: defaultName,
      email: user.email || "",
      role: "customer"
    };

    const { data: insertedProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .maybeSingle();

    if (insertError) {
      if (insertError.code === '23505') {
        // If it fails because of duplicate key (already exists), re-fetch the existing profile.
        const { data: refetchedProfile } = await supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .maybeSingle();
        if (refetchedProfile) {
          profile = refetchedProfile as Profile;
        } else {
          throw new Error(`Auto-creation failed because profile duplicate key could not be retrieved.`);
        }
      } else {
        throw new Error(`Failed to auto-create profile: ${insertError.message}`);
      }
    } else if (insertedProfile) {
      profile = insertedProfile as Profile;
    } else {
      throw new Error(`Failed to retrieve auto-created profile.`);
    }
  } else {
    profile = profileData as Profile;
  }

  if (profile) {
    // 3. Fetch tickets depending on user role
    let query = supabase.from('tickets').select(`
      id,
      title,
      description,
      priority,
      status,
      creator_id,
      created_at,
      attachment_url,
      attachment_name,
      profiles!tickets_creator_id_fkey(name)
    `);

    if (profile.role === 'customer') {
      // Customers only see their own tickets
      query = query.eq('creator_id', profile.id);
    }

    const { data: ticketsData, error: ticketsError } = await query.order('created_at', { ascending: false });

    if (ticketsError) {
      throw new Error(`Failed to fetch tickets: ${ticketsError.message}`);
    }

    if (ticketsData) {
      // Map join name
      initialTickets = (ticketsData as any[]).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        creator_id: t.creator_id,
        created_at: t.created_at,
        creator_name: (Array.isArray(t.profiles) ? t.profiles[0]?.name : (t.profiles as any)?.name) || "Customer",
        attachment_url: t.attachment_url || undefined,
        attachment_name: t.attachment_name || undefined
      }));
    }

    // 4. Fetch all user profiles for listings/team tab (Agent only)
    if (profile.role === 'agent') {
      const { data: profilesData, error: profilesError } = await supabase.from('profiles').select().order('name');
      if (profilesError) {
        throw new Error(`Failed to fetch team profiles: ${profilesError.message}`);
      }
      if (profilesData) {
        allProfiles = profilesData as Profile[];
      }
    }
  }

  return (
    <DashboardShell 
      initialTickets={initialTickets}
      userProfile={profile}
      allProfiles={allProfiles}
    />
  );
}
