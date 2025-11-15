import { AddQCTestDialog } from "@/components/forms/AddQCTestDialog";
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface QualityControlRecord {
  id: string;
  result: string;
  created_at: string;
  test_type: string;
  batches: { product_id: string; batch_number: string } | null;
  products: { name: string } | null;
  profiles: { full_name: string } | null;
}

const QualityControl = () => {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResult, setFilterResult] = useState("all");

  const { data: queryResult, isLoading, error } = useQuery({
    queryKey: ["quality-control", page, 10, searchQuery, filterResult],
    queryFn: async () => {
      const from = page * 10;
      const to = from + 10 - 1;

      let query = supabase
        .from("quality_control_records")
        .select(
          `
          id,
          result,
          created_at,
          test_type,
          batches ( product_id, batch_number ),
          products ( name ),
          profiles ( full_name )
          `,
          { count: 'exact' }
        );

      if (filterResult !== "all") {
        query = query.eq("result", filterResult);
      }

      if (searchQuery) {
        query = query.or(`batches.batch_number.ilike.%${searchQuery}%,products.name.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
  });

  const qcRecords: QualityControlRecord[] = queryResult?.data || [];
  const totalCount = queryResult?.count || 0;
  const pageCount = Math.ceil(totalCount / 10);

  const getStatusBadge = (status: string) => {
    if (status === "pass" || status === "passed") {
      return <Badge variant="default">Pass</Badge>;
    } else if (status === "fail" || status === "failed") {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Fail
        </Badge>
      );
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quality Control</h1>
            <p className="text-muted-foreground">
              Track and manage quality control tests for batches
            </p>
          </div>
          <AddQCTestDialog />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by batch number or product..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="pass">Pass</SelectItem>
              <SelectItem value="fail">Fail</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
            <p className="text-2xl font-bold mt-2">{totalCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Passed</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {qcRecords.filter((t: QualityControlRecord) => t.result === "pass").length}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {qcRecords.filter((t: QualityControlRecord) => t.result === "fail").length}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Test Type</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Tester</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-destructive">
                    Error loading QC tests
                  </TableCell>
                </TableRow>
              ) : qcRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No QC tests found
                  </TableCell>
                </TableRow>
              ) : (
                qcRecords.map((test: QualityControlRecord) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.batches?.batch_number}</TableCell>
                    <TableCell>{test.products?.name || "-"}</TableCell>
                    <TableCell>{test.test_type || "-"}</TableCell>
                    <TableCell>{getStatusBadge(test.result)}</TableCell>
                    <TableCell>{test.profiles?.full_name || "-"}</TableCell>
                    <TableCell>{test.created_at ? new Date(test.created_at).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end space-x-2 p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((old) => Math.max(0, old - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((old) => old + 1)}
              disabled={page >= pageCount - 1}
            >
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QualityControl;
