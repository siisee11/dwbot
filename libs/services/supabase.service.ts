import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "../consts/supabase";

let supabase: SupabaseClient;

export const getSupabase = () => {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }

  return supabase;
};
