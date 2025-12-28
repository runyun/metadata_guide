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
    async findUserByName(name) {
      const { data, error } = await window.supabaseClient
        .from('users')
        .select('*')
        .eq('name', name)
        .limit(1);
      if (data.length == 0) {
        throw new Error('沒有這個使用者');

      } else if (error) {
        throw new Error(error.message);
      }

      return (data && data[0]) || null;
    },

    async createUser(name) {
      const { data, error } = await window.supabaseClient
        .from('users')
        .insert([{ name }])
        .select()
        .limit(1);
      if (error) throw error;
      return (data && data[0]) || null;
    },

  };

})();
