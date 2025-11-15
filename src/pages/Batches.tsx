import { AddBatchDialog } from "@/components/forms/AddBatchDialog";
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface BatchRecord {
  id: string;
  batch_number: string;
  manufacture_date: string;
  expiry_date: string;
  quantity: number;
  location: string;
  status: string;
  products: { name: string } | null;
}

const Batches = () => {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");

  const { data: batchesData, isLoading, error } = useQuery({
    queryKey: ["batches", page, 10, searchQuery, filterStatus, filterLocation],
    queryFn: async () => {
      const from = page * 10;
      const to = from + 10 - 1;

      let query = supabase
        .from("batches")
        .select(
          `
          id,
          batch_number,
          manufacture_date,
          expiry_date,
          quantity,
          location,
          status,
          products ( name )
          `,
          { count: 'exact' }
        );

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (filterLocation !== "all") {
        query = query.eq("location", filterLocation);
      }

      if (searchQuery) {
        query = query.or(`batch_number.ilike.%${searchQuery}%,products.name.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
  });

  const batches: BatchRecord[] = batchesData?.data || [];
  const totalCount = batchesData?.count || 0;
  const pageCount = Math.ceil(totalCount / 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "expiring":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Expiring Soon
          </Badge>
        );
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Batches & Inventory
            </h1>
            <p className="text-muted-foreground">
              Track batch-level inventory with full traceability
            </p>
          </div>
          <AddBatchDialog />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by batch number, product, or location..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="warehouse-a">Warehouse A</SelectItem>
              <SelectItem value="warehouse-b">Warehouse B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Batches Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>MFG Date</TableHead>
                <TableHead>EXP Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4 text-destructive">
                    Error loading batches
                  </TableCell>
                </TableRow>
              ) : batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4 text-muted-foreground">
                    No batches found
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch: BatchRecord) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.id}</TableCell>
                    <TableCell>{batch.batch_number}</TableCell>
                    <TableCell>{batch.products?.name || "-"}</TableCell>
                    <TableCell>{batch.manufacture_date}</TableCell>
                    <TableCell>{batch.expiry_date}</TableCell>
                    <TableCell>{batch.quantity.toLocaleString()}</TableCell>
                    <TableCell>{batch.location || "-"}</TableCell>
                    <TableCell>{/* Cost is not directly available from the current query */}</TableCell>
                    <TableCell>{getStatusBadge(batch.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
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

export default Batches;
