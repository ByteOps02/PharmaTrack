import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter } from "lucide-react";
import { usePatients } from "@/hooks/usePatients";
import { useClinicalRecords, ClinicalRecord } from "@/hooks/useClinicalRecords";
import { useNavigate } from "react-router-dom";

const Records = () => {
  const navigate = useNavigate();
  const { patients } = usePatients();
  const { patientRecords } = useClinicalRecords(undefined);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [patientFilter, setPatientFilter] = useState<number | "all">("all");

  const filtered = useMemo(() => {
    let rows: ClinicalRecord[] = patientRecords;
    if (typeFilter !== "all") {
      rows = rows.filter(r => r.type.toLowerCase() === String(typeFilter).toLowerCase());
    }
    if (patientFilter !== "all") {
      rows = rows.filter(r => r.patientId === patientFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [patientRecords, typeFilter, patientFilter, query]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clinical Records Directory</h1>
            <p className="text-muted-foreground mt-1">Browse clinical records across all patients</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/patients")}>Go to Patients</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search and Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search title, content, provider..."
                  className="pl-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  className="w-full rounded-md border bg-background p-2"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All types</option>
                  <option value="Consultation Note">Consultation Note</option>
                  <option value="Lab Result">Lab Result</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Imaging Report">Imaging Report</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <select
                  className="w-full rounded-md border bg-background p-2"
                  value={patientFilter}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPatientFilter(v === "all" ? "all" : Number(v));
                  }}
                >
                  <option value="all">All patients</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const patient = patients.find(p => p.id === r.patientId);
                    return (
                      <TableRow key={`${r.id}-${r.patientId}`}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell className="font-medium">{r.title}</TableCell>
                        <TableCell>
                          <Badge {...({ variant: "secondary" } as any)}>{r.type}</Badge>
                        </TableCell>
                        <TableCell>{r.provider}</TableCell>
                        <TableCell>{patient?.fullName ?? `#${r.patientId}`}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/records/${r.patientId}`)}>
                            View patient records
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Records;


