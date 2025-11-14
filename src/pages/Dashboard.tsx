import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ClipboardCheck,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Batch {
  id: string;
  product_id: string;
  expiry_date: string;
  quantity: number;
  products: {
    name: string;
  } | null;
}

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
}

interface SalesOrder {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  order_date: string;
}

interface QualityControlRecord {
  inspection_date: string;
  result: string;
}

const Dashboard = () => {
  const today = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);

  const {
    data: expiringBatches,
    loading: expiringBatchesLoading,
    error: expiringBatchesError,
  } = useSupabaseQuery<Batch[]>(
    () =>
      supabase
        .from("batches")
        .select("id, expiry_date, quantity, products(name)")
        .lt("expiry_date", format(ninetyDaysFromNow, "yyyy-MM-dd"))
        .order("expiry_date", { ascending: true }),
    []
  );

  const {
    data: lowStockItems,
    loading: lowStockItemsLoading,
    error: lowStockItemsError,
  } = useSupabaseQuery<Product[]>(
    () =>
      supabase
        .from("products")
        .select("id, name, stock_quantity")
        .lt("stock_quantity", 100) // Assuming 100 as a low stock threshold
        .order("stock_quantity", { ascending: true }),
    []
  );

  const {
    data: recentOrders,
    loading: recentOrdersLoading,
    error: recentOrdersError,
  } = useSupabaseQuery<SalesOrder[]>(
    () =>
      supabase
        .from("sales_orders")
        .select("id, customer_name, total_amount, status")
        .order("order_date", { ascending: false })
        .limit(5), // Displaying top 5 recent orders
    []
  );

  const {
    data: allProducts,
    loading: allProductsLoading,
    error: allProductsError,
  } = useSupabaseQuery<Product[]>(
    () => supabase.from("products").select("price, stock_quantity"),
    []
  );

  const totalStockValue = allProducts?.reduce(
    (sum, product) => sum + (product.price || 0) * (product.stock_quantity || 0),
    0
  );

  const {
    data: monthlySales,
    loading: monthlySalesLoading,
    error: monthlySalesError,
  } = useSupabaseQuery<SalesOrder[]>(
    () =>
      supabase
        .from("sales_orders")
        .select("total_amount, order_date")
        .gte("order_date", format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd"))
        .lte("order_date", format(new Date(today.getFullYear(), today.getMonth() + 1, 0), "yyyy-MM-dd")),
    []
  );

  const thisMonthSales = monthlySales?.reduce(
    (sum, order) => sum + (order.total_amount || 0),
    0
  );

  const {
    data: qcRecords,
    loading: qcRecordsLoading,
    error: qcRecordsError,
  } = useSupabaseQuery<QualityControlRecord[]>(
    () =>
      supabase
        .from("quality_control_records")
        .select("inspection_date, result")
        .gte("inspection_date", format(new Date(today.setDate(today.getDate() - today.getDay())), "yyyy-MM-dd")) // Start of current week
        .lte("inspection_date", format(new Date(today.setDate(today.getDate() - today.getDay() + 6)), "yyyy-MM-dd")), // End of current week
    []
  );

  const qcTestsThisWeek = qcRecords?.length || 0;
  const qcFailures = qcRecords?.filter((record) => record.result === "fail").length || 0;

  if (
    expiringBatchesLoading ||
    lowStockItemsLoading ||
    recentOrdersLoading ||
    allProductsLoading ||
    monthlySalesLoading ||
    qcRecordsLoading
  ) {
    return <div>Loading dashboard data...</div>;
  }

  if (
    expiringBatchesError ||
    lowStockItemsError ||
    recentOrdersError ||
    allProductsError ||
    monthlySalesError ||
    qcRecordsError
  ) {
    return (
      <div>
        Error loading dashboard data:{" "}
        {expiringBatchesError?.message ||
          lowStockItemsError?.message ||
          recentOrdersError?.message ||
          allProductsError?.message ||
          monthlySalesError?.message ||
          qcRecordsError?.message}
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to PharmaTrack Management System
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Stock Value"
            value={`$${totalStockValue?.toFixed(2) || "0.00"}`}
            icon={DollarSign}
            trend={{ value: "+12.5% from last month", positive: true }}
            variant="success"
          />
          <StatCard
            title="Expiring Soon (30 days)"
            value={expiringBatches?.length.toString() || "0"}
            icon={AlertTriangle}
            variant="warning"
          />
          <StatCard
            title="Low Stock Alerts"
            value={lowStockItems?.length.toString() || "0"}
            icon={Package}
            variant="danger"
          />
          <StatCard
            title="Pending Orders"
            value={
              recentOrders
                ?.filter((order) => order.status === "pending").length.toString() || "0"
            }
            icon={ShoppingCart}
            variant="default"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="This Month Sales"
            value={`$${thisMonthSales?.toFixed(2) || "0.00"}`}
            icon={TrendingUp}
            trend={{ value: "+8.2% from last month", positive: true }}
            variant="success"
          />
          <StatCard
            title="QC Tests (This Week)"
            value={qcTestsThisWeek.toString()}
            icon={ClipboardCheck}
            variant="default"
          />
          <StatCard
            title="QC Failures"
            value={qcFailures.toString()}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

        {/* Tables */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Expiring Batches */}
          <Card>
            <CardHeader>
              <CardTitle>Expiring Batches (Next 90 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringBatches?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No expiring batches found
                      </TableCell>
                    </TableRow>
                  ) : (
                    expiringBatches?.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.id}</TableCell>
                        <TableCell>{batch.products?.name || "N/A"}</TableCell>
                        <TableCell>{format(new Date(batch.expiry_date), "yyyy-MM-dd")}</TableCell>
                        <TableCell>{batch.quantity}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Low Stock Items */}
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No low stock items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockItems?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.stock_quantity}</TableCell>
                        <TableCell>100</TableCell> {/* Assuming 100 as minimum */}
                        <TableCell>
                          <Badge variant="destructive">Low</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {recentOrders?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No recent sales orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentOrders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>${order.total_amount?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === "Delivered"
                                ? "default"
                                : order.status === "Dispatched"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

