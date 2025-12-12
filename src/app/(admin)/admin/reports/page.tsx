"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Package,
  Users,
  FolderTree,
  Image,
  MessageSquare,
  TrendingUp,
  Eye,
  Loader2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  formats: string[];
}

const REPORT_TYPES: ReportType[] = [
  {
    id: "products",
    name: "Products Report",
    description:
      "Products with pricing, dimensions, views, and performance data",
    icon: Package,
    formats: ["csv", "xlsx", "json"],
  },
  {
    id: "categories",
    name: "Categories Report",
    description: "Categories with product counts and hierarchy",
    icon: FolderTree,
    formats: ["csv", "xlsx", "json"],
  },
  {
    id: "users",
    name: "Users Report",
    description: "User accounts with profiles, preferences, and activity",
    icon: Users,
    formats: ["csv", "xlsx", "json"],
  },
  {
    id: "inquiries",
    name: "Inquiries Report",
    description: "Customer inquiries with status, priority, and products",
    icon: MessageSquare,
    formats: ["csv", "xlsx", "json"],
  },
  {
    id: "banners",
    name: "Banners Report",
    description: "Banner performance with impressions, clicks, and CTR",
    icon: Image,
    formats: ["csv", "xlsx", "json"],
  },
  {
    id: "tags",
    name: "Tags Report",
    description: "Tags with click analytics and engagement",
    icon: Tag,
    formats: ["csv", "xlsx", "json"],
  },
  {
    id: "analytics",
    name: "Analytics Summary",
    description: "Comprehensive metrics across all data types",
    icon: TrendingUp,
    formats: ["csv", "xlsx", "json"],
  },
];

interface PreviewData {
  headers: string[];
  rows: any[][];
  total: number;
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [format, setFormat] = useState("csv");
  const [dateRange, setDateRange] = useState("30d");
  const [dataFilter, setDataFilter] = useState<"all" | "new">("all");
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Reports that support new entries filter
  const supportsNewFilter = [
    "products",
    "categories",
    "users",
    "inquiries",
    "tags",
    "banners",
  ];

  const handlePreview = async () => {
    if (!selectedReport) return;
    setPreviewing(true);
    setPreviewData(null);

    try {
      const filterParam =
        supportsNewFilter.includes(selectedReport) && dataFilter === "new"
          ? "&filter=new"
          : "";
      const response = await fetch(
        `/api/admin/reports/${selectedReport}?format=json&range=${dateRange}&preview=true&limit=10${filterParam}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Convert data to preview format
          const items = data.data;
          if (items.length > 0) {
            const headers = Object.keys(items[0]);
            const rows = items.map((item: any) => headers.map((h) => item[h]));
            setPreviewData({
              headers,
              rows,
              total: data.total || items.length,
            });
          } else {
            setPreviewData({ headers: [], rows: [], total: 0 });
          }
        } else {
          toast.error("No data available for preview");
        }
      } else {
        toast.error("Failed to fetch preview");
      }
    } catch (error) {
      console.error("Failed to fetch preview:", error);
      toast.error("Failed to fetch preview");
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedReport) return;
    setDownloading(true);

    try {
      const filterParam =
        supportsNewFilter.includes(selectedReport) && dataFilter === "new"
          ? "&filter=new"
          : "";
      const response = await fetch(
        `/api/admin/reports/${selectedReport}?format=${format}&range=${dateRange}${filterParam}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedReport}-report-${
          new Date().toISOString().split("T")[0]
        }.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Report downloaded successfully");
      } else {
        toast.error("Failed to download report");
      }
    } catch (error) {
      console.error("Failed to download report:", error);
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const selectedReportData = REPORT_TYPES.find((r) => r.id === selectedReport);

  return (
    <div className="flex-1 p-6 space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate and download reports for your data
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Report Type</CardTitle>
              <CardDescription>
                Choose the type of report you want to generate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {REPORT_TYPES.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedReport === report.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground/50"
                    }`}
                    onClick={() => {
                      setSelectedReport(report.id);
                      setFormat(report.formats[0]);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <report.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{report.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.description}
                        </p>
                        <div className="flex gap-1 mt-2">
                          {report.formats.map((f) => (
                            <Badge
                              key={f}
                              variant="secondary"
                              className="text-xs"
                            >
                              {f.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Download Options */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Download Options</CardTitle>
              <CardDescription>Configure your report settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>File Format</Label>
                <Select
                  value={format}
                  onValueChange={setFormat}
                  disabled={!selectedReportData}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedReportData?.formats.map((f) => (
                      <SelectItem key={f} value={f}>
                        <div className="flex items-center gap-2">
                          {f === "csv" || f === "xlsx" ? (
                            <FileSpreadsheet className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          {f.toUpperCase()}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="365d">Last year</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Filter - only for supported reports */}
              {selectedReport && supportsNewFilter.includes(selectedReport) && (
                <div className="space-y-2">
                  <Label>Data Filter</Label>
                  <Select
                    value={dataFilter}
                    onValueChange={(v) => setDataFilter(v as "all" | "new")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All entries</SelectItem>
                      <SelectItem value="new">New entries only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {dataFilter === "new"
                      ? "Only entries created within the selected date range"
                      : "All entries regardless of creation date"}
                  </p>
                </div>
              )}

              <div className="flex gap-2 md:flex-row flex-col">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handlePreview}
                  disabled={!selectedReport || previewing}
                >
                  {previewing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Preview
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleDownload}
                  disabled={!selectedReport || downloading}
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedReportData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selected Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <selectedReportData.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedReportData.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Format: {format.toUpperCase()} | Range: {dateRange}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Section - Inside Grid */}
        {(previewing || previewData) && (
          <div className="lg:col-span-3 min-w-0 overflow-hidden">
            <Card className="w-full overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 flex-wrap text-base">
                  <Eye className="h-5 w-5 flex-shrink-0" />
                  <span>Report Preview</span>
                  {previewData && (
                    <Badge variant="secondary" className="text-xs">
                      {previewData.rows.length} of {previewData.total}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Preview of the data that will be included in the report
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden">
                {previewing ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-10 w-full" />
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : previewData && previewData.rows.length > 0 ? (
                  <div className="overflow-x-auto max-w-full">
                    <table className="min-w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          {previewData.headers.map((header) => (
                            <th
                              key={header}
                              className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                            >
                              {header
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())
                                .trim()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {previewData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-muted/30">
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-3 py-2 whitespace-nowrap max-w-[120px] truncate"
                                title={
                                  cell === null || cell === undefined
                                    ? "-"
                                    : typeof cell === "object"
                                    ? JSON.stringify(cell)
                                    : String(cell)
                                }
                              >
                                {cell === null || cell === undefined
                                  ? "-"
                                  : typeof cell === "boolean"
                                  ? cell
                                    ? "Yes"
                                    : "No"
                                  : typeof cell === "object"
                                  ? JSON.stringify(cell)
                                  : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : previewData ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No data available for the selected report and date range
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
