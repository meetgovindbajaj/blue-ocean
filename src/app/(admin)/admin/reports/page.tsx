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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Package,
  Users,
  FolderTree,
  Image,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

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
    description: "Export all products with details, pricing, and inventory",
    icon: Package,
    formats: ["csv", "xlsx", "json"],
  },
  {
    id: "categories",
    name: "Categories Report",
    description: "Export category hierarchy and product counts",
    icon: FolderTree,
    formats: ["csv", "xlsx", "json"],
  },
  {
    id: "users",
    name: "Users Report",
    description: "Export user accounts and registration data",
    icon: Users,
    formats: ["csv", "xlsx"],
  },
  {
    id: "orders",
    name: "Orders Report",
    description: "Export order history and transaction details",
    icon: ShoppingCart,
    formats: ["csv", "xlsx", "json"],
  },
  {
    id: "banners",
    name: "Banners Report",
    description: "Export hero banner performance metrics",
    icon: Image,
    formats: ["csv", "xlsx"],
  },
  {
    id: "analytics",
    name: "Analytics Report",
    description: "Export views, clicks, and engagement data",
    icon: TrendingUp,
    formats: ["csv", "xlsx", "json"],
  },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [format, setFormat] = useState("csv");
  const [dateRange, setDateRange] = useState("30d");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!selectedReport) return;
    setDownloading(true);

    try {
      const response = await fetch(
        `/api/admin/reports/${selectedReport}?format=${format}&range=${dateRange}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedReport}-report-${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to download report");
      }
    } catch (error) {
      console.error("Failed to download report:", error);
      alert("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const selectedReportData = REPORT_TYPES.find((r) => r.id === selectedReport);

  return (
    <div className="flex-1 p-6 space-y-6">
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
                            <Badge key={f} variant="secondary" className="text-xs">
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
              <CardDescription>
                Configure your report settings
              </CardDescription>
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

              <Button
                className="w-full"
                onClick={handleDownload}
                disabled={!selectedReport || downloading}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading ? "Generating..." : "Download Report"}
              </Button>
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
      </div>
    </div>
  );
}
