"use client";

import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileUp,
  ArrowRight,
  CheckCircle2,
  History,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateTime } from "@/lib/utils";
import Link from "next/link";

const REQUIRED_FIELDS = ["name", "phone"];
const DB_FIELDS = [
  { id: "name", label: "Lead Name (Required)" },
  { id: "phone", label: "Phone Number (Required)" },
  { id: "city", label: "City" },
  { id: "source", label: "Lead Source" },
];

export default function UploadLeadsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [excelData, setExcelData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  // Upload result
  const [uploadResult, setUploadResult] = useState<{
    inserted: number;
    duplicates: number;
    total: number;
    batchId: string;
  } | null>(null);

  // Batch history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/upload-batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch {
      // silent
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const downloadTemplate = () => {
    const data = [
      ["Lead Name", "Phone Number", "City", "Lead Source"],
      ["John Doe", "9876543210", "New York", "Facebook"],
      ["Jane Smith", "8765432109", "London", "Google"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads Template");
    XLSX.writeFile(wb, "lead_import_template.xlsx");
    toast.success("Template downloaded!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    setUploadResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const fileHeaders = (data[0] as string[])
        .map((h) => h?.toString().trim())
        .filter(Boolean);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = data
        .slice(1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((row: any) => {
          const rowData: Record<string, string> = {};
          fileHeaders.forEach((header, index) => {
            if (header) rowData[header] = row[index] ? String(row[index]) : "";
          });
          return rowData;
        })
        .filter((row) => Object.keys(row).length > 0);

      setHeaders(fileHeaders);
      setExcelData(rows);

      const autoMap: Record<string, string> = {};
      const synonyms: Record<string, string[]> = {
        name: ["name", "full name", "lead name", "customer", "client"],
        phone: ["phone", "mobile", "contact", "tel", "cell", "number"],
        city: ["city", "town", "location", "area"],
        source: ["source", "lead source", "channel", "origin"],
      };

      DB_FIELDS.forEach((field) => {
        const potentialNames = synonyms[field.id] || [field.id];
        const match = fileHeaders.find((h) => {
          if (!h) return false;
          const lowerH = h.toLowerCase();
          return potentialNames.some((synonym) => lowerH.includes(synonym));
        });
        if (match) autoMap[field.id] = match;
      });

      setMapping(autoMap);
      if (Object.keys(autoMap).length > 0)
        toast.success(`Auto-mapped ${Object.keys(autoMap).length} columns!`);
    };
    reader.readAsBinaryString(file);
  };

  const handleProcess = async () => {
    const missingFields = REQUIRED_FIELDS.filter((f) => !mapping[f]);
    if (missingFields.length > 0) {
      toast.error(`Please map required fields: ${missingFields.join(", ")}`);
      return;
    }

    setUploading(true);

    const leadsToUpload = excelData
      .map((row) => {
        const lead: Record<string, string> = {};
        DB_FIELDS.forEach((field) => {
          const mappedCol = mapping[field.id];
          if (mappedCol && row[mappedCol]) lead[field.id] = row[mappedCol];
        });
        return lead;
      })
      .filter((lead) => lead.name && lead.phone);

    if (leadsToUpload.length === 0) {
      toast.error("No valid leads found to upload. Check your mapping.");
      setUploading(false);
      return;
    }

    try {
      const res = await fetch("/api/leads/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: leadsToUpload, fileName: file?.name }),
      });

      const data = await res.json();
      if (res.ok) {
        setUploadResult({
          inserted: data.inserted,
          duplicates: data.duplicates,
          total: data.total,
          batchId: data.batchId,
        });
        if (data.duplicates > 0) {
          toast.success(
            `Uploaded ${data.inserted} leads. ${data.duplicates} duplicates skipped.`
          );
        } else {
          toast.success(`Successfully uploaded ${data.inserted} leads!`);
        }
        setExcelData([]);
        setFile(null);
        fetchBatches(); // refresh history
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-secondary">
            Upload Leads
          </h1>
          <p className="text-sm text-muted">
            Import leads from Excel or CSV. Duplicate phone numbers are
            automatically skipped.
          </p>
        </div>
      </div>

      {/* ── UPLOAD UI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Step 1: Upload */}
        <div className="lg:col-span-4 space-y-6">
          <Card
            className={`border-accent/10 shadow-lg bg-sand-light/30 relative overflow-hidden ${
              excelData.length > 0 ? "opacity-50 grayscale-[0.5]" : ""
            }`}
          >
            <CardHeader className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">
                  Step 1
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={downloadTemplate}
                  className="text-primary hover:text-white hover:bg-primary h-7 text-[10px] font-bold uppercase tracking-wider px-3 rounded-full border border-primary/20 transition-all"
                >
                  Download Template
                </Button>
              </div>
              <CardTitle className="text-xl font-serif font-bold text-secondary">
                Upload File
              </CardTitle>
              <CardDescription className="text-xs">
                Select a .xlsx, .xls, or .csv file
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-accent/20 rounded-2xl p-8 bg-white/50 text-center shadow-inner group hover:bg-white transition-all duration-300">
                <div className="w-16 h-16 bg-sand-light rounded-full flex items-center justify-center mb-6 shadow-sm border border-accent/10 group-hover:scale-110 transition-transform">
                  <FileUp className="w-8 h-8 text-accent" />
                </div>
                <p className="text-sm font-bold text-secondary mb-1">
                  Select your file
                </p>
                <p className="text-[9px] uppercase tracking-[0.1em] text-muted font-bold mb-6 italic">
                  Excel or CSV supported
                </p>
                <Button
                  variant="default"
                  className="w-full bg-secondary hover:bg-black text-white font-bold rounded-xl shadow-md transform hover:-translate-y-0.5 transition-all"
                  onClick={() =>
                    document.getElementById("excel-upload")?.click()
                  }
                >
                  Browse Files
                </Button>
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </CardContent>
            {file && (
              <div className="mx-6 mb-6 p-4 bg-secondary text-white rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold truncate max-w-[120px] tracking-wide">
                    {file.name}
                  </span>
                </div>
                <span className="text-[10px] font-black tracking-widest bg-white/10 px-2 py-1 rounded italic">
                  {excelData.length} RECORDS
                </span>
              </div>
            )}
          </Card>

          <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
            <h3 className="text-xs font-bold text-blue-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Duplicate Prevention
            </h3>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Each phone number must be <strong>unique</strong>. If a number
              already exists in the system, that row will be skipped and counted
              as a duplicate.
            </p>
          </div>
        </div>

        {/* Step 2: Mapping */}
        <div className="lg:col-span-8">
          <Card
            className={`border-accent/10 shadow-2xl relative overflow-hidden flex flex-col h-full bg-white ${
              excelData.length === 0 ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            <CardHeader className="p-8 border-b bg-sand-light/20 relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ArrowRight className="w-32 h-32 text-accent rotate-[-45deg]" />
              </div>
              <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-2 block">
                Step 2
              </span>
              <CardTitle className="text-2xl font-serif font-bold text-secondary">
                Map Columns
              </CardTitle>
              <CardDescription className="text-xs">
                Match your file columns to the right fields
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {excelData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-sand-light/30">
                      <TableRow className="border-b-accent/10">
                        <TableHead className="py-5 pl-8 text-[10px] uppercase font-bold tracking-widest text-muted">
                          OUR FIELD
                        </TableHead>
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="py-5 pr-8 text-[10px] uppercase font-bold tracking-widest text-muted">
                          YOUR COLUMN
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {DB_FIELDS.map((field) => (
                        <TableRow
                          key={field.id}
                          className="border-b-accent/5 hover:bg-sand-light/10 transition-colors"
                        >
                          <TableCell className="py-6 pl-8">
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm font-bold text-secondary tracking-tight">
                                {field.label}
                              </span>
                              {REQUIRED_FIELDS.includes(field.id) && (
                                <span className="text-[9px] text-primary font-black uppercase tracking-widest flex items-center gap-1.5">
                                  <div className="w-1 h-1 bg-primary rounded-full" />{" "}
                                  Required
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <ArrowRight className="w-4 h-4 text-accent/40" />
                          </TableCell>
                          <TableCell className="py-6 pr-8">
                            <div className="space-y-2">
                              <Select
                                value={mapping[field.id] || "unmapped"}
                                onValueChange={(val) =>
                                  setMapping((prev) => ({
                                    ...prev,
                                    [field.id]:
                                      val === "unmapped" ? "" : val,
                                  }))
                                }
                              >
                                <SelectTrigger
                                  className={cn(
                                    "rounded-xl h-11 transition-all border-accent/20 focus:ring-accent",
                                    mapping[field.id]
                                      ? "bg-secondary text-white border-secondary font-bold"
                                      : "bg-white"
                                  )}
                                >
                                  <SelectValue placeholder="Select Data Key" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-accent/10 shadow-2xl">
                                  <SelectItem
                                    value="unmapped"
                                    className="text-[10px] font-bold uppercase tracking-widest text-muted"
                                  >
                                    -- Not mapped --
                                  </SelectItem>
                                  {headers.map((h) => (
                                    <SelectItem
                                      key={h}
                                      value={h}
                                      className="text-sm font-medium"
                                    >
                                      {h}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {mapping[field.id] &&
                                excelData[0]?.[mapping[field.id]] && (
                                  <p className="text-[10px] text-accent font-bold italic px-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />{" "}
                                    Preview: &quot;
                                    {excelData[0][mapping[field.id]]}&quot;
                                  </p>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : uploadResult ? (
                // ── Result card ──
                <div className="m-8 space-y-4">
                  <div className="p-6 bg-secondary text-white rounded-2xl flex items-center space-x-6 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-accent" />
                    </div>
                    <div className="relative">
                      <h3 className="text-lg font-serif font-bold text-accent">
                        Upload Successful!
                      </h3>
                      <p className="text-[11px] font-medium tracking-wide text-gray-300">
                        <span className="text-white font-bold">
                          {uploadResult.inserted} leads
                        </span>{" "}
                        added.{" "}
                        {uploadResult.duplicates > 0 && (
                          <span className="text-orange-300 font-bold">
                            {uploadResult.duplicates} duplicates skipped.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Stat pills */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl border p-3 text-center">
                      <p className="text-xl font-bold text-secondary">
                        {uploadResult.total}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">
                        Submitted
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-xl border border-green-100 p-3 text-center">
                      <p className="text-xl font-bold text-green-700">
                        {uploadResult.inserted}
                      </p>
                      <p className="text-[10px] text-green-600 uppercase font-bold mt-0.5">
                        Inserted
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-xl border border-orange-100 p-3 text-center">
                      <p className="text-xl font-bold text-orange-600">
                        {uploadResult.duplicates}
                      </p>
                      <p className="text-[10px] text-orange-500 uppercase font-bold mt-0.5">
                        Duplicates
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/admin/leads?batchId=${uploadResult.batchId}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View These Leads
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center animate-pulse px-10">
                  <div className="w-20 h-20 bg-sand-light rounded-full flex items-center justify-center mb-6 opacity-30">
                    <FileUp className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-accent/40">
                    Upload a file first
                  </h3>
                  <p className="text-xs text-muted max-w-[280px] mt-2">
                    Select a file in Step 1 to start mapping your columns.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-5 md:p-8 bg-sand-light/10 border-t border-accent/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-auto">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-accent/20 flex items-center justify-center shadow-sm">
                  <CheckCircle2
                    className={cn(
                      "w-5 h-5",
                      excelData.length > 0 ? "text-accent" : "text-gray-200"
                    )}
                  />
                </div>
                <p className="text-[11px] font-bold text-secondary uppercase tracking-[0.1em]">
                  {excelData.length > 0
                    ? `${excelData.length} records ready to upload.`
                    : "Upload a file to get started."}
                </p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setExcelData([]);
                    setFile(null);
                    setUploadResult(null);
                  }}
                  disabled={uploading}
                  className="rounded-xl border-secondary/20 hover:bg-red-50 hover:text-red-700 font-bold px-6 h-12 flex-1 md:flex-none uppercase text-[10px] tracking-widest"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleProcess}
                  disabled={uploading || excelData.length === 0}
                  className="rounded-xl bg-primary hover:bg-secondary text-white font-bold px-10 h-12 flex-1 md:flex-none uppercase text-[10px] tracking-widest shadow-xl transform active:scale-95 transition-all shadow-primary/20"
                >
                  {uploading ? "Uploading..." : "Upload Leads"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* ── BATCH HISTORY ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-xl font-serif font-bold text-secondary">
              Upload History
            </h2>
            <p className="text-xs text-muted font-bold uppercase tracking-wider">
              All lead batches imported — click a batch to view its leads
            </p>
          </div>
        </div>

        <Card className="border-accent/10 shadow-md overflow-hidden">
          {/* Mobile */}
          <div className="block md:hidden divide-y">
            {batchesLoading ? (
              <div className="p-6 text-center text-gray-400 text-sm animate-pulse">
                Loading history…
              </div>
            ) : batches.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic text-sm">
                No uploads yet.
              </div>
            ) : (
              batches.map((batch) => (
                <div key={batch._id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                        {batch.fileName || "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(batch.uploadedAt)} ·{" "}
                        {batch.uploadedBy?.name || "Admin"}
                      </p>
                    </div>
                    <Link
                      href={`/admin/leads?batchId=${batch._id}`}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] bg-gray-50">
                      {batch.totalSubmitted} submitted
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-green-50 text-green-700 border-green-200"
                    >
                      {batch.inserted} added
                    </Badge>
                    {batch.duplicates > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-orange-50 text-orange-600 border-orange-200"
                      >
                        {batch.duplicates} dupes
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow className="hover:bg-secondary border-b-accent/20">
                  <TableHead className="text-white font-bold uppercase text-[10px] tracking-wider h-12 pl-6">
                    Date & File
                  </TableHead>
                  <TableHead className="text-white font-bold uppercase text-[10px] tracking-wider h-12 text-center">
                    Uploaded By
                  </TableHead>
                  <TableHead className="text-white font-bold uppercase text-[10px] tracking-wider h-12 text-center">
                    Submitted
                  </TableHead>
                  <TableHead className="text-green-300 font-bold uppercase text-[10px] tracking-wider h-12 text-center">
                    Inserted
                  </TableHead>
                  <TableHead className="text-orange-300 font-bold uppercase text-[10px] tracking-wider h-12 text-center">
                    Duplicates
                  </TableHead>
                  <TableHead className="text-white font-bold uppercase text-[10px] tracking-wider h-12 text-right pr-6">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchesLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center h-20 text-gray-400 animate-pulse"
                    >
                      Loading history…
                    </TableCell>
                  </TableRow>
                ) : batches.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center h-20 text-gray-400 italic"
                    >
                      No uploads recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch, idx) => (
                    <TableRow
                      key={batch._id}
                      className={`hover:bg-sand-light/20 border-b-accent/5 transition-colors ${idx === 0 ? "bg-blue-50/30" : ""}`}
                    >
                      <TableCell className="pl-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-secondary truncate max-w-[220px]">
                            {batch.fileName || "unknown file"}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {formatDateTime(batch.uploadedAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className="text-sm font-medium text-gray-700">
                          {batch.uploadedBy?.name || "Admin"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className="text-sm font-bold text-secondary">
                          {batch.totalSubmitted}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className="text-sm font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                          {batch.inserted}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {batch.duplicates > 0 ? (
                          <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                            {batch.duplicates}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <Link
                          href={`/admin/leads?batchId=${batch._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold hover:bg-blue-100 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Leads
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
