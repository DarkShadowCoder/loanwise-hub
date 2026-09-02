import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchLoanRequest,
  fetchLoanByRequest,
  fetchStatusHistory,
} from "@/lib/loan-queries";
import { formatDate, formatDateTime, formatFCFA } from "@/lib/loan-format";
import { LOAN_TYPE_LABEL, REQUEST_STATUS, describe } from "@/lib/loan-status";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageHeader } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/applications/$id")({
  head: () => ({
    meta: [
      { title: "Dossier de demande de prêt — Zender237 Back-office" },
      {
        name: "description",
        content:
          "Dossier complet d'une demande de prêt : profil, pièces d'identité, historique et décisions administratives.",
      },
      { property: "og:title", content: "Dossier de demande de prêt — Zender237" },
      {
        property: "og:description",
        content: "Analyse et décision sur une demande de prêt utilisateur.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationDetail,
});

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function IdentityImage({ path, label }: { path: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void supabase.storage
      .from("loan-identities")
      .createSignedUrl(path, 600)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <div>
      <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={label}
            className="h-40 w-full rounded-lg border border-border object-cover"
          />
        </a>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
          Aperçu indisponible
        </div>
      )}
    </div>
  );
}

function ApplicationDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const router = useRouter();

  const request = useQuery({ queryKey: ["loan_request", id], queryFn: () => fetchLoanRequest(id) });
  const loan = useQuery({ queryKey: ["loan_by_request", id], queryFn: () => fetchLoanByRequest(id) });
  const history = useQuery({ queryKey: ["loan_status_history", id], queryFn: () => fetchStatusHistory(id) });

  const [approvedAmount, setApprovedAmount] = useState("");
  const [serviceFee, setServiceFee] = useState("0");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const r = request.data;

  useEffect(() => {
    if (r && approvedAmount === "") setApprovedAmount(String(r.amount));
  }, [r, approvedAmount]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["loan_request", id] });
    void qc.invalidateQueries({ queryKey: ["loan_by_request", id] });
    void qc.invalidateQueries({ queryKey: ["loan_status_history", id] });
    void qc.invalidateQueries({ queryKey: ["loan_requests"] });
    void qc.invalidateQueries({ queryKey: ["loans"] });
  };

  const statusMutation = useMutation({
    mutationFn: async (payload: { status: string; reason?: string }) => {
      const { error } = await supabase.rpc("admin_update_loan_request_status", {
        p_request_id: id,
        p_new_status: payload.status,
        p_reason: payload.reason ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut mis à jour");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_approve_loan_request", {
        p_request_id: id,
        p_approved_amount: Number(approvedAmount),
        p_service_fee: Number(serviceFee || 0),
        p_notes: notes || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Demande approuvée, le prêt a été créé");
      setApproveOpen(false);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_reject_loan_request", {
        p_request_id: id,
        p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Demande rejetée");
      setRejectOpen(false);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (request.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement du dossier…</p>;
  }
  if (request.error) {
    return <p className="text-sm text-destructive">{(request.error as Error).message}</p>;
  }
  if (!r) {
    return <p className="text-sm text-muted-foreground">Demande introuvable.</p>;
  }

  const s = describe(REQUEST_STATUS, r.status);
  const editable = ["submitted", "contacted", "processing"].includes(r.status);

  return (
    <div>
      <button
        onClick={() => router.navigate({ to: "/applications" })}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour aux demandes
      </button>

      <PageHeader
        title={r.full_name}
        description={`${LOAN_TYPE_LABEL[r.loan_type] ?? r.loan_type} · soumise le ${formatDateTime(r.submitted_at)}`}
        actions={<StatusBadge label={s.label} tone={s.tone} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold">Détails de la demande</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Montant demandé" value={formatFCFA(r.amount)} />
              <Field label="Rang au moment de la demande" value={r.rank_at_request} />
              <Field label="Durée de remboursement" value={`${r.repayment_months} mois`} />
              <Field label="WhatsApp" value={r.whatsapp_number} />
              <Field label="Téléphone" value={r.phone_number} />
              <Field label="Pseudo" value={r.profiles?.username} />
              {r.loan_type === "flight" ? (
                <>
                  <Field label="Départ" value={r.travel_origin} />
                  <Field label="Destination" value={r.travel_destination} />
                  <Field label="Date du voyage" value={formatDate(r.travel_date)} />
                  <Field label="Passager" value={r.passenger_name} />
                  <Field
                    label="Hébergement"
                    value={
                      r.accommodation_requested
                        ? `Oui · ${r.accommodation_months} mois`
                        : "Non"
                    }
                  />
                </>
              ) : null}
            </div>
            {r.admin_notes ? (
              <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">{r.admin_notes}</p>
            ) : null}
            {r.rejection_reason ? (
              <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                Motif du rejet : {r.rejection_reason}
              </p>
            ) : null}
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold">Pièces d'identité</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <IdentityImage path={r.id_front_path} label="Recto" />
              <IdentityImage path={r.id_back_path} label="Verso" />
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold">Historique des statuts</h2>
            {history.data && history.data.length > 0 ? (
              <ol className="space-y-3">
                {history.data.map((h) => {
                  const row = h as {
                    id: string;
                    previous_status: string | null;
                    new_status: string;
                    reason: string | null;
                    created_at: string;
                  };
                  return (
                    <li key={row.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(row.created_at)}
                      </span>
                      <StatusBadge {...describe(REQUEST_STATUS, row.previous_status)} />
                      <span className="text-muted-foreground">→</span>
                      <StatusBadge {...describe(REQUEST_STATUS, row.new_status)} />
                      {row.reason ? (
                        <span className="text-xs text-muted-foreground">· {row.reason}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun changement enregistré.</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold">Actions</h2>
            {editable ? (
              <div className="space-y-2">
                {r.status === "submitted" ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ status: "contacted" })}
                  >
                    Marquer comme contactée
                  </Button>
                ) : null}
                {r.status !== "processing" ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ status: "processing" })}
                  >
                    Passer en traitement
                  </Button>
                ) : null}

                <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">Approuver la demande</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approuver la demande</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="approved">Montant approuvé (FCFA)</Label>
                        <Input
                          id="approved"
                          type="number"
                          value={approvedAmount}
                          onChange={(e) => setApprovedAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fee">Frais de service (FCFA)</Label>
                        <Input
                          id="fee"
                          type="number"
                          value={serviceFee}
                          onChange={(e) => setServiceFee(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Note interne</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Les plafonds du rang sont revalidés côté base de données lors de
                        l'approbation.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending || !approvedAmount}
                      >
                        Confirmer l'approbation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Rejeter la demande
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rejeter la demande</DialogTitle>
                    </DialogHeader>
                    <div>
                      <Label htmlFor="reason">Motif du rejet</Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={() => rejectMutation.mutate()}
                        disabled={rejectMutation.isPending || reason.trim().length === 0}
                      >
                        Confirmer le rejet
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Cette demande est clôturée, aucune action n'est disponible.
              </p>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold">Prêt associé</h2>
            {loan.data ? (
              <div className="space-y-3">
                <Field label="Montant approuvé" value={formatFCFA(loan.data.approved_amount)} />
                <Field label="Total à rembourser" value={formatFCFA(loan.data.total_due)} />
                <Field label="Reste à payer" value={formatFCFA(loan.data.outstanding_amount)} />
                <Link
                  to="/loans/$id"
                  params={{ id: loan.data.id }}
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  Ouvrir le prêt
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun prêt créé pour cette demande.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
