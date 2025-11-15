import { AddSalesOrderDialog } from "@/components/forms/AddSalesOrderDialog";
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
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SalesOrderRecord {
  id: string;
  customer_name: string;
  order_date: string;
  expected_delivery_date: string;
  status: string;
  total_amount: number;
  so_number: string;
}

const SalesOrders = () => {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: salesOrdersData, isLoading, error } = useQuery({
    queryKey: ["sales-orders", page, 10, searchQuery, filterStatus],
    queryFn: async () => {
      const from = page * 10;
      const to = from + 10 - 1;

      let query = supabase
        .from("sales_orders")
        .select("id, customer_name, order_date, expected_delivery_date, status, total_amount, so_number", { count: 'exact' });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (searchQuery) {
        query = query.or(`so_number.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
  });

  const salesOrders: SalesOrderRecord[] = salesOrdersData?.data || [];
  const totalCount = salesOrdersData?.count || 0;
  const pageCount = Math.ceil(totalCount / 10);

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: "outline",
      processing: "default",
      dispatched: "secondary",
      delivered: "default",
      cancelled: "destructive",
    };
    return (
      <Badge variant={statusStyles[status] || "secondary"}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "pending"}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
            <p className="text-muted-foreground">
              Manage and track all sales orders to customers
            </p>
          </div>
          <AddSalesOrderDialog />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by SO number or customer..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sales Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SO Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Status</TableHead>
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
                        Error loading sales orders
                      </TableCell>
                    </TableRow>
                  ) : salesOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No sales orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesOrders.map((so: SalesOrderRecord) => (
                      <TableRow key={so.id}>
                        <TableCell className="font-medium">{so.so_number || "-"}</TableCell>
                        <TableCell>{so.customer_name}</TableCell>
                        <TableCell>${so.total_amount?.toLocaleString() || 0}</TableCell>
                        <TableCell>{so.order_date ? new Date(so.order_date).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{so.expected_delivery_date ? new Date(so.expected_delivery_date).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{getStatusBadge(so.status)}</TableCell>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SalesOrders;
