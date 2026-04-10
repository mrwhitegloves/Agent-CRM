"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUp, ArrowRight, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
  const [uploadedCount, setUploadedCount] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      const fileHeaders = data[0] as string[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = data.slice(1).map((row: any) => {
        const rowData: Record<string, string> = {};
        fileHeaders.forEach((header, index) => {
          if (header) rowData[header] = row[index] ? String(row[index]) : "";
        });
        return rowData;
      }).filter(row => Object.keys(row).length > 0);

      setHeaders(fileHeaders.filter(Boolean));
      setExcelData(rows);
      
      // Auto-map if column names match exactly or closely
      const autoMap: Record<string, string> = {};
      DB_FIELDS.forEach(field => {
        const match = fileHeaders.find(h => 
          h && h.toString().toLowerCase().includes(field.id)
        );
        if (match) autoMap[field.id] = match;
      });
      setMapping(autoMap);
      setUploadedCount(0);
    };
    reader.readAsBinaryString(file);
  };

  const handleProcess = async () => {
    // Validate required fields mapping
    const missingFields = REQUIRED_FIELDS.filter(f => !mapping[f]);
    if (missingFields.length > 0) {
      toast.error(`Please map required fields: ${missingFields.join(", ")}`);
      return;
    }

    setUploading(true);
    
    // Transform data
    const leadsToUpload = excelData.map(row => {
      const lead: Record<string, string> = {};
      DB_FIELDS.forEach(field => {
        const mappedCol = mapping[field.id];
        if (mappedCol && row[mappedCol]) {
          lead[field.id] = row[mappedCol];
        }
      });
      return lead;
    }).filter(lead => lead.name && lead.phone); // Filter out rows missing strictly mapped required values

    if (leadsToUpload.length === 0) {
      toast.error("No valid leads found to upload. Check your mapping.");
      setUploading(false);
      return;
    }

    try {
      const res = await fetch("/api/leads/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: leadsToUpload })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully mapped and uploaded ${data.inserted} leads`);
        setUploadedCount(data.inserted);
        setExcelData([]);
        setFile(null);
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Leads</h1>
        <p className="text-sm text-gray-500">Import your lead lists using Excel or CSV.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1: Upload */}
        <Card className={`md:col-span-1 ${excelData.length > 0 ? 'opacity-60' : ''}`}>
          <CardHeader>
            <CardTitle className="text-lg">Step 1: Upload File</CardTitle>
            <CardDescription>.xlsx, .xls, or .csv files</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-6 mx-4 mb-4 bg-gray-50 text-center">
            <FileUp className="w-10 h-10 text-blue-500 mb-3" />
            <p className="text-sm font-medium mb-1">Select Excel File</p>
            <p className="text-xs text-gray-500 mb-4">First row must be headers</p>
            <Button variant="outline" onClick={() => document.getElementById('excel-upload')?.click()}>
              Browse File
            </Button>
            <input 
              id="excel-upload" 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </CardContent>
          {file && (
            <div className="mx-4 mb-4 px-3 py-2 bg-blue-50 text-blue-800 rounded-md text-sm truncate flex items-center justify-between">
              <span>{file.name}</span>
              <span className="font-bold">{excelData.length} rows</span>
            </div>
          )}
        </Card>

        {/* Step 2: Mapping */}
        <Card className={`md:col-span-2 ${excelData.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
          <CardHeader>
            <CardTitle className="text-lg">Step 2: Map Columns</CardTitle>
            <CardDescription>Match your Excel columns to database fields</CardDescription>
          </CardHeader>
          <CardContent>
            {excelData.length > 0 && (
              <div className="border rounded-md">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Database Field</TableHead>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Excel Column</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DB_FIELDS.map(field => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">
                          {field.label}
                          {REQUIRED_FIELDS.includes(field.id) && <span className="text-red-500 ml-1">*</span>}
                        </TableCell>
                        <TableCell><ArrowRight className="w-4 h-4 text-gray-400" /></TableCell>
                        <TableCell>
                          <Select 
                            value={mapping[field.id] || "unmapped"} 
                            onValueChange={(val) => setMapping(prev => ({...prev, [field.id]: val === "unmapped" ? "" : val}))}
                          >
                            <SelectTrigger className={mapping[field.id] ? "border-blue-300 bg-blue-50" : ""}>
                              <SelectValue placeholder="Select Column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unmapped">-- Ignore --</SelectItem>
                              {headers.map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {uploadedCount > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center border border-green-200">
                <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-800">Success!</h3>
                  <p className="text-sm text-green-700">{uploadedCount} leads were successfully imported into the system.</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-gray-50 border-t flex justify-between items-center py-4">
            <p className="text-sm text-gray-500">
               {excelData.length > 0 ? `Ready to import ~${excelData.length} records.` : "Upload a file to begin mapping."}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => { setExcelData([]); setFile(null); setUploadedCount(0); }}
                disabled={uploading}
              >
                Reset
              </Button>
              <Button onClick={handleProcess} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {uploading ? "Importing Data..." : "Import Leads"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
