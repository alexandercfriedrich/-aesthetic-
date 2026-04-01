"use client";

import { useState } from "react";
import { Send, Phone, Mail, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";

type Props = {
  doctorId: string;
  doctorName: string;
  procedureId?: string;
  procedureName?: string;
};

type ContactMethod = "email" | "phone" | "whatsapp";

export function LeadFormSection({ doctorId, doctorName, procedureId, procedureName }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const fd = new FormData(e.currentTarget);

    const payload = {
      doctorId,
      procedureId: procedureId ?? null,
      patientName: String(fd.get("patientName") ?? ""),
      patientEmail: String(fd.get("patientEmail") ?? ""),
      patientPhone: String(fd.get("patientPhone") ?? "") || undefined,
      preferredContact: (String(fd.get("preferredContact") ?? "email")) as ContactMethod,
      message: String(fd.get("message") ?? ""),
      consentPrivacy: fd.get("consentPrivacy") === "on",
      consentDataForwarding: fd.get("consentDataForwarding") === "on",
      sourcePageUrl: window.location.href,
      sourcePageType: "doctor_profile",
    };

    try {
      const { submitLeadAction } = await import(
        "@/app/(public)/arzt/[slug]/actions"
      );
      await submitLeadAction(payload);
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <h2 className="text-lg font-semibold">Anfrage gesendet!</h2>
          <p className="text-sm text-muted-foreground">
            Deine Anfrage wurde an {doctorName} weitergeleitet. Du erhältst eine Bestätigung per
            E-Mail.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-1 font-semibold">Anfrage senden</h2>
      <p className="mb-5 text-xs text-muted-foreground">
        Direkte Anfrage an {doctorName}. Deine Daten werden nur an diesen Arzt weitergeleitet.
      </p>

      {/* Honeypot */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="website_confirm" className="hidden" tabIndex={-1} aria-hidden />

        {procedureName && (
          <div className="rounded-xl bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
            Behandlung: {procedureName}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            name="patientName"
            required
            autoComplete="name"
            className="h-10 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            E-Mail <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            name="patientEmail"
            required
            autoComplete="email"
            className="h-10 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Telefon (optional)</label>
          <input
            type="tel"
            name="patientPhone"
            autoComplete="tel"
            className="h-10 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Bevorzugter Kontaktweg</label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "email", icon: Mail, label: "E-Mail" },
                { value: "phone", icon: Phone, label: "Telefon" },
                { value: "whatsapp", icon: MessageSquare, label: "WhatsApp" },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <label
                key={value}
                className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary"
              >
                <input
                  type="radio"
                  name="preferredContact"
                  value={value}
                  defaultChecked={value === "email"}
                  className="sr-only"
                />
                <Icon className="h-4 w-4" />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Nachricht <span className="text-destructive">*</span>
          </label>
          <textarea
            name="message"
            required
            minLength={20}
            maxLength={3000}
            rows={4}
            placeholder="Beschreibe kurz dein Anliegen…"
            className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          />
        </div>

        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="consentPrivacy"
              required
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary"
            />
            <span>
              Ich habe die{" "}
              <a href="/datenschutz" target="_blank" className="underline hover:text-foreground">
                Datenschutzerklärung
              </a>{" "}
              gelesen und stimme zu. <span className="text-destructive">*</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="consentDataForwarding"
              required
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary"
            />
            <span>
              Ich stimme der Weitergabe meiner Kontaktdaten an {doctorName} zu.{" "}
              <span className="text-destructive">*</span>
            </span>
          </label>
        </div>

        {status === "error" && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMsg || "Anfrage konnte nicht gesendet werden. Bitte versuche es erneut."}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
        >
          {status === "sending" ? (
            <span className="animate-pulse">Wird gesendet…</span>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Anfrage senden
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Deine Daten werden ausschließlich zur Bearbeitung deiner Anfrage verwendet.
        </p>
      </form>
    </div>
  );
}
