// Requires env.js and supabase CDN script to be loaded first
(function () {
  function ensureEnv() {
    if (!window.__ENV__ || !window.__ENV__.SUPABASE_URL || !window.__ENV__.SUPABASE_ANON_KEY) {
      console.warn('Supabase env not found. Create js/env.js or set env variables during build.');
      return false;
    }
    return true;
  }

  if (!ensureEnv()) return;

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('Supabase library not loaded. Please include CDN script: https://cdn.jsdelivr.net/npm/@supabase/supabase-js');
    return;
  }

  const url = window.__ENV__.SUPABASE_URL;
  const key = window.__ENV__.SUPABASE_ANON_KEY;

  window.supabaseClient = window.supabase.createClient(url, key);

  window.supabaseApi = {
    // return the user record along with roles, optional organization,
    // and any affiliations (which include organization + location)
    async findUserByName(name) {
      // basic user fetch
      const { data, error } = await window.supabaseClient
        .from('users')
        .select('name, id')
        .eq('name', name)
        .limit(1);
      if (error) {
        throw new Error(error.message);
      }
      if (!data || data.length === 0) {
        return null;
      }

      const user = data[0];

      // fetch roles for this user via user_roles join
      const { data: roleLinks, error: rolesErr } = await window.supabaseClient
        .from('user_roles')
        .select('role_id, roles(id, name)')
        .eq('user_id', user.id);
      if (rolesErr) {
        throw new Error(rolesErr.message);
      }
      user.roles = (roleLinks || []).map((r) => r.roles || { id: r.role_id });

      // load affiliation relations (organization + location)
      const { data: affLinks, error: affErr } = await window.supabaseClient
        .from('affiliation')
        .select('assigned_at, organization_id, organizations(id, name), location_id, locations(id, name)')
        .eq('user_id', user.id);
      if (affErr) {
        throw new Error(affErr.message);
      }
      user.affiliations = (affLinks || []).map((a) => ({
        assigned_at: a.assigned_at,
        organization: a.organizations || { id: a.organization_id },
        location: a.locations || { id: a.location_id }
      }));

      return user;
    },

    async createUser(name) {
      const { data, error } = await window.supabaseClient
        .from('users')
        .insert([{ name }])
        .select()
        .limit(1);
      if (error) throw error;
      const user = (data && data[0]) || null;
      if (!user) return null;
      // newly created user has no roles/org/affiliations yet, but apply same structure
      user.roles = [];
      user.affiliations = [];
      if (user.organization_id) {
        const { data: orgData, error: orgErr } = await window.supabaseClient
          .from('organizations')
          .select('*')
          .eq('id', user.organization_id)
          .limit(1);
        if (orgErr) {
          throw new Error(orgErr.message);
        }
        user.organization = (orgData && orgData[0]) || null;
      }
      return user;
    },

  };

})();
