"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Eye,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";

interface DestinationCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  apiUrl: string;
  uploadPreset: string;
}

interface PreviewFolder {
  folder: string;
  count: number;
  totalBytes: number;
}

interface PreviewResult {
  folders: PreviewFolder[];
  total: number;
}

interface MigrationFailure {
  publicId: string;
  folder: string;
  error: string;
}

interface MigrationResult {
  summary: {
    total: number;
    migrated: number;
    failed: number;
    skipped: number;
    dbUpdated: number;
  };
  dbUpdates: Record<string, number>;
  failures: MigrationFailure[];
}

const initialCredentials: DestinationCredentials = {
  cloudName: "",
  apiKey: "",
  apiSecret: "",
  apiUrl: "",
  uploadPreset: "",
};

export default function CloudinaryMigrationPage() {
  const [credentials, setCredentials] =
    useState<DestinationCredentials>(initialCredentials);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [running, setRunning] = useState(false);

  const canRun = useMemo(
    () =>
      credentials.cloudName.trim() &&
      credentials.apiKey.trim() &&
      credentials.apiSecret.trim(),
    [credentials],
  );

  const updateCredential = (
    key: keyof DestinationCredentials,
    value: string,
  ) => {
    setCredentials((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handlePreview = async () => {
    setLoadingPreview(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/cloudinary-migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview" }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to preview source assets");
      }

      setPreview({
        folders: data.folders,
        total: data.total,
      });
      toast.success("Source assets counted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRun = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canRun) {
      toast.error("Cloud name, API key, and API secret are required");
      return;
    }

    const confirmed = confirm(
      "This will copy Cloudinary images and update database image references. Continue?",
    );
    if (!confirmed) return;

    setRunning(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/cloudinary-migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run",
          credentials,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Migration failed");
      }

      setResult(data);
      updateCredential("apiSecret", "");
      toast.success("Cloudinary migration finished");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Migration failed");
    } finally {
      setRunning(false);
    }
  };

  const progressValue =
    result && result.summary.total > 0
      ? Math.round(
          ((result.summary.migrated + result.summary.skipped) /
            result.summary.total) *
            100,
        )
      : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Cloudinary Migration
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Copy the app-managed image folders to another Cloudinary account and
            update stored image references after successful uploads.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit gap-2">
          <ShieldCheck className="h-4 w-4" />
          Admin only
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleRun} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Destination Credentials</CardTitle>
              <CardDescription>
                Credentials are sent only to the migration API for this run and
                are not stored by the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cloudName">Cloud name</Label>
                <Input
                  id="cloudName"
                  value={credentials.cloudName}
                  onChange={(event) =>
                    updateCredential("cloudName", event.target.value)
                  }
                  placeholder="destination-cloud"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API key</Label>
                <Input
                  id="apiKey"
                  value={credentials.apiKey}
                  onChange={(event) =>
                    updateCredential("apiKey", event.target.value)
                  }
                  placeholder="1234567890"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiSecret">API secret</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={credentials.apiSecret}
                  onChange={(event) =>
                    updateCredential("apiSecret", event.target.value)
                  }
                  placeholder="Required for signed uploads"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uploadPreset">Upload preset</Label>
                <Input
                  id="uploadPreset"
                  value={credentials.uploadPreset}
                  onChange={(event) =>
                    updateCredential("uploadPreset", event.target.value)
                  }
                  placeholder="Optional"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="apiUrl">API URL</Label>
                <Input
                  id="apiUrl"
                  value={credentials.apiUrl}
                  onChange={(event) =>
                    updateCredential("apiUrl", event.target.value)
                  }
                  placeholder="https://api.cloudinary.com"
                  autoComplete="off"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Run Migration</CardTitle>
              <CardDescription>
                Uploads are throttled sequentially with retry/backoff to reduce
                Cloudinary rate-limit pressure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    The migration updates MongoDB references after assets copy
                    successfully. Failed uploads are skipped and listed below.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={loadingPreview || running}
                >
                  {loadingPreview ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Preview source assets
                </Button>
                <Button type="submit" disabled={running || !canRun}>
                  {running ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CloudUpload className="h-4 w-4" />
                  )}
                  Start migration
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Source Scope</CardTitle>
              <CardDescription>
                Folders included in this migration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preview ? (
                <>
                  {preview.folders.map((folder) => (
                    <div
                      key={folder.folder}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{folder.folder}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(folder.totalBytes)}
                        </p>
                      </div>
                      <Badge>{folder.count}</Badge>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Total images</span>
                    <span>{preview.total}</span>
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Preview the source account to count `blue_ocean` and
                  `avatars`.
                </div>
              )}
            </CardContent>
          </Card>

          {running && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Migration running
                </CardTitle>
                <CardDescription>
                  Keep this tab open while the server copies assets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={35} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Migration Result
            </CardTitle>
            <CardDescription>
              {result.summary.dbUpdated} database record groups updated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={progressValue} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Total" value={result.summary.total} />
              <Metric label="Migrated" value={result.summary.migrated} />
              <Metric label="Failed" value={result.summary.failed} />
              <Metric label="Skipped" value={result.summary.skipped} />
              <Metric label="DB updated" value={result.summary.dbUpdated} />
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(result.dbUpdates)
                .filter(([key]) => key !== "total")
                .map(([key, value]) => (
                  <div key={key} className="rounded-md border p-3">
                    <p className="text-xs uppercase text-muted-foreground">
                      {formatLabel(key)}
                    </p>
                    <p className="mt-1 text-lg font-semibold">{value}</p>
                  </div>
                ))}
            </div>

            {result.failures.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold">Failed uploads</h2>
                <div className="max-h-80 overflow-auto rounded-md border">
                  {result.failures.map((failure) => (
                    <div
                      key={`${failure.folder}-${failure.publicId}`}
                      className="border-b p-3 text-sm last:border-b-0"
                    >
                      <p className="font-medium">{failure.publicId}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {failure.folder}
                      </p>
                      <p className="mt-2 text-red-600">{failure.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}
