import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminAccount = {
  id: string;
  full_name: string;
  role: string;
  active: boolean;
  whatsapp_number: string | null;
};

export function useAdminSession() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminAccount | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        if (!cancelled) {
          setAdmin(null);
          setEmail(null);
          setLoading(false);
        }
        return;
      }
      const { data: row } = await supabase
        .from("admins")
        .select("id, full_name, role, active, whatsapp_number")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        setEmail(user.email ?? null);
        setAdmin((row as AdminAccount | null) ?? null);
        setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, admin, email };
}
