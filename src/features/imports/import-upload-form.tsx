"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BillingImport, ImportRejection, ParsedBillingRow } from "@/types/domain";

type PreviewPayload = {
  acceptedCount: number;
  rejectedCount: number;
  sample: ParsedBillingRow[];
  rejections: ImportRejection[];
};

type UploadResponse = {
  message?: string;
  import?: BillingImport;
  preview?: PreviewPayload;
  missingColumns?: string[];
};

type CommitResponse = {
  message?: string;
  import?: BillingImport;
  inserted?: number;
  duplicated?: number;
};

export function ImportUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [billingImport, setBillingImport] = useState<BillingImport | null>(
    null,
  );
  const [commitResult, setCommitResult] = useState<CommitResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetFlow() {
    setPreview(null);
    setBillingImport(null);
    setCommitResult(null);
    setError(null);
  }

  function onUpload() {
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    startTransition(async () => {
      setError(null);
      setCommitResult(null);
      const body = new FormData();
      body.append("file", file);

      try {
        const response = await fetch("/api/imports", {
          method: "POST",
          body,
        });
        const data = (await response.json()) as UploadResponse;

        if (!response.ok) {
          setPreview(data.preview ?? null);
          setBillingImport(data.import ?? null);
          setError(data.message ?? "Upload failed.");
          return;
        }

        setBillingImport(data.import ?? null);
        setPreview(data.preview ?? null);
      } catch {
        setError("Network error while uploading the CSV.");
      }
    });
  }

  function onConfirm() {
    if (!billingImport) {
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch(`/api/imports/${billingImport.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "commit" }),
        });
        const data = (await response.json()) as CommitResponse;
        if (!response.ok) {
          setError(data.message ?? "Commit failed.");
          return;
        }
        setCommitResult(data);
        setBillingImport(data.import ?? billingImport);
        router.refresh();
      } catch {
        setError("Network error while confirming the import.");
      }
    });
  }

  const committed = billingImport?.status === "committed" || !!commitResult;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload billing CSV</CardTitle>
          <CardDescription>
            Required columns: billing_date, provider, service, region,
            resource_id, usage_quantity, usage_unit, cost, currency,
            environment. Max 5&nbsp;MB / 50&nbsp;000 rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV file</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              disabled={isPending || committed}
              onChange={(event) => {
                resetFlow();
                setFile(event.target.files?.[0] ?? null);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={onUpload}
              disabled={!file || isPending || committed}
            >
              {isPending && !preview ? "Validating…" : "Validate & preview"}
            </Button>
            {preview && !committed ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onConfirm}
                disabled={isPending || (preview.acceptedCount ?? 0) === 0}
              >
                {isPending ? "Importing…" : "Confirm import"}
              </Button>
            ) : null}
            {committed ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  View dashboard
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFile(null);
                    resetFlow();
                  }}
                >
                  Import another file
                </Button>
              </>
            ) : null}
          </div>
          {error ? (
            <p
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {billingImport ? (
                <>
                  File <span className="font-medium">{billingImport.filename}</span>
                  {" · "}
                  status {billingImport.status}
                </>
              ) : (
                "Validation results"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Accepted" value={String(preview.acceptedCount)} />
              <Stat label="Rejected" value={String(preview.rejectedCount)} />
              <Stat
                label="Duplicates on confirm"
                value={
                  commitResult
                    ? String(commitResult.duplicated ?? 0)
                    : "Checked at confirm"
                }
              />
            </div>

            {commitResult ? (
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                Imported {commitResult.inserted ?? 0} new row
                {(commitResult.inserted ?? 0) === 1 ? "" : "s"}
                {(commitResult.duplicated ?? 0) > 0
                  ? ` · ${commitResult.duplicated} duplicate${(commitResult.duplicated ?? 0) === 1 ? "" : "s"} skipped`
                  : ""}
                .
              </p>
            ) : null}

            {preview.sample.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Provider</th>
                      <th className="px-3 py-2 font-medium">Service</th>
                      <th className="px-3 py-2 font-medium">Region</th>
                      <th className="px-3 py-2 font-medium">Cost</th>
                      <th className="px-3 py-2 font-medium">Env</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((row, index) => (
                      <tr key={`${row.resourceId}-${index}`} className="border-t">
                        <td className="px-3 py-2">{row.billingDate}</td>
                        <td className="px-3 py-2">{row.provider}</td>
                        <td className="px-3 py-2">{row.service}</td>
                        <td className="px-3 py-2">{row.region}</td>
                        <td className="px-3 py-2">
                          {row.cost} {row.currency}
                        </td>
                        <td className="px-3 py-2">{row.environment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {preview.rejections.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Rejection reasons</h3>
                <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3 text-sm">
                  {preview.rejections.map((rejection) => (
                    <li key={`${rejection.rowNumber}-${rejection.message}`}>
                      <span className="font-medium">Row {rejection.rowNumber}:</span>{" "}
                      {rejection.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
