import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion administrateur — Zender237 Back-office" },
      {
        name: "description",
        content: "Connectez-vous à la console d'administration Zender237 pour gérer les prêts.",
      },
      { property: "og:title", content: "Connexion administrateur — Zender237" },
      { property: "og:description", content: "Accès sécurisé au back-office du module Prêt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userId = data.user?.id;
      const { data: admin } = await supabase
        .from("admins")
        .select("id, active")
        .eq("auth_user_id", userId!)
        .maybeSingle();

      if (!admin || !admin.active) {
        await supabase.auth.signOut();
        toast.error("Ce compte n'a pas d'accès administrateur actif.");
        return;
      }
      toast.success("Connexion réussie");
      await router.navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="panel w-full max-w-md p-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" /> Back-office Zender237
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Connexion administrateur</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Utilisez l'email lié à votre compte administrateur.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@zender237.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
}
