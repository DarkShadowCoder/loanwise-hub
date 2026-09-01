import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Banknote, SlidersHorizontal, LineChart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zender237 Back-office — Gestion des prêts" },
      {
        name: "description",
        content:
          "Console d'administration Zender237 : demandes de prêt, prêts actifs, remboursements et règles par rang.",
      },
      { property: "og:title", content: "Zender237 Back-office — Gestion des prêts" },
      {
        property: "og:description",
        content:
          "Pilotez le cycle de vie complet des prêts : éligibilité par rang, validation, décaissement et remboursement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: LineChart,
    title: "Vue d'ensemble",
    text: "Encours, demandes en attente, montants décaissés et remboursés en temps réel.",
  },
  {
    icon: Banknote,
    title: "Cycle de vie complet",
    text: "Demande → contact → traitement → approbation → décaissement → remboursement.",
  },
  {
    icon: SlidersHorizontal,
    title: "Règles par rang",
    text: "Plafonds, durées et activation des produits configurables sans toucher au code.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" /> Accès réservé aux administrateurs
        </span>
        <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">
          Back-office Zender237 — <span className="text-primary">Module Prêt</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Gérez l'ensemble de la chaîne : rang utilisateur, règles d'éligibilité, demandes,
          approbations, décaissements et suivi des remboursements.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Se connecter
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Ouvrir la console
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel p-5">
              <f.icon className="size-5 text-primary" />
              <h2 className="mt-3 text-base font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
