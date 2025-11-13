import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Receipt, CreditCard, FileText, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { useBilling } from "@/hooks/useBilling";
import { usePatients } from "@/hooks/usePatients";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function toCents(value: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(value || '0');
  return Math.round(n * 100);
}

const Billing = () => {
  const { invoices, payments, claims, providers, loading, error, addInvoice, addPayment, addClaim } = useBilling();
  const { patients } = usePatients();
  const [searchQuery, setSearchQuery] = useState("");
  const [openInvoice, setOpenInvoice] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openClaim, setOpenClaim] = useState(false);
  const { toast } = useToast();

  const [invoiceForm, setInvoiceForm] = useState({
    patientId: 0,
    invoiceDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(new Date(), "yyyy-MM-dd"),
    subtotal: "",
    taxAmount: "",
    discountAmount: "",
    notes: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    patientId: 0,
    invoiceId: 0,
    amount: "",
    paymentMethod: "cash",
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    transactionId: "",
    notes: "",
  });
  const [claimForm, setClaimForm] = useState({
    userId: "",
    patientId: 0,
    invoiceId: undefined as number | undefined,
    insuranceId: 1,
    claimNumber: "",
    submissionDate: format(new Date(), "yyyy-MM-dd"),
    serviceDate: format(new Date(), "yyyy-MM-dd"),
    claimedAmount: "",
    approvedAmount: "",
    paidAmount: "",
    status: "submitted",
    diagnosisCodes: "",
    procedureCodes: "",
    notes: "",
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
    const pendingClaims = claims.filter(c => c.status === 'pending' || c.status === 'submitted').length;

    return {
      totalRevenue: (totalRevenue / 100).toFixed(2),
      totalPaid: (totalPaid / 100).toFixed(2),
      totalOutstanding: (totalOutstanding / 100).toFixed(2),
      pendingClaims
    };
  }, [invoices, claims]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "partially_paid": return "secondary";
      case "pending": return "outline";
      case "overdue": return "destructive";
      case "approved": return "default";
      case "denied": return "destructive";
      default: return "secondary";
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invoices, searchQuery]);

  if (loading) return <DashboardLayout><div className="p-6 text-center">Loading billing data...</div></DashboardLayout>;
  if (error) return <DashboardLayout><div className="p-6 text-center text-destructive">Error: {error}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Claims</h1>
          <p className="text-muted-foreground mt-1">Manage invoices, payments, and insurance claims</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">${stats.totalRevenue}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Collected</p>
                  <p className="text-2xl font-bold text-foreground">${stats.totalPaid}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-foreground">${stats.totalOutstanding}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Claims</p>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingClaims}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices">
              <Receipt className="mr-2 h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="claims">
              <FileText className="mr-2 h-4 w-4" />
              Insurance Claims
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Invoices</CardTitle>
                  <Button className="gap-2" onClick={() => setOpenInvoice(true)}>
                    <Plus className="h-4 w-4" />
                    Create Invoice
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search invoices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No invoices found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => {
                        const patient = patients.find(p => p.id === invoice.patientId);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                            <TableCell>{patient?.fullName || 'Unknown'}</TableCell>
                            <TableCell>{invoice.invoiceDate}</TableCell>
                            <TableCell>${(invoice.totalAmount / 100).toFixed(2)}</TableCell>
                            <TableCell>${(invoice.paidAmount / 100).toFixed(2)}</TableCell>
                            <TableCell>${(invoice.balanceAmount / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge {...({ variant: getStatusColor(invoice.status) } as any)}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Payments</CardTitle>
                  <Button className="gap-2" onClick={() => setOpenPayment(true)}>
                    <Plus className="h-4 w-4" />
                    Record Payment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No payments recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => {
                        const patient = patients.find(p => p.id === payment.patientId);
                        const invoice = invoices.find(i => i.id === payment.invoiceId);
                        return (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.paymentDate}</TableCell>
                            <TableCell>{patient?.fullName || 'Unknown'}</TableCell>
                            <TableCell>{invoice?.invoiceNumber || 'N/A'}</TableCell>
                            <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                            <TableCell className="capitalize">{payment.paymentMethod.replace('_', ' ')}</TableCell>
                            <TableCell>{payment.transactionId || '-'}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Insurance Claims</CardTitle>
                  <Button className="gap-2" onClick={() => setOpenClaim(true)}>
                    <Plus className="h-4 w-4" />
                    Submit Claim
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead>Claimed</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No claims submitted yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      claims.map((claim) => {
                        const patient = patients.find(p => p.id === claim.patientId);
                        return (
                          <TableRow key={claim.id}>
                            <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                            <TableCell>{patient?.fullName || 'Unknown'}</TableCell>
                            <TableCell>{claim.submissionDate}</TableCell>
                            <TableCell>{claim.serviceDate}</TableCell>
                            <TableCell>${(claim.claimedAmount / 100).toFixed(2)}</TableCell>
                            <TableCell>${((claim.approvedAmount || 0) / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge {...({ variant: getStatusColor(claim.status) } as any)}>
                                {claim.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Invoice */}
        <Dialog open={openInvoice} onOpenChange={setOpenInvoice}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Patient</Label>
                  <select
                    className="mt-2 w-full rounded-md border bg-background p-2"
                    value={invoiceForm.patientId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, patientId: Number(e.target.value) })}
                  >
                    <option value={0}>Select patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Invoice Date</Label>
                  <Input className="mt-2" type="date" value={invoiceForm.invoiceDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Due Date</Label>
                  <Input className="mt-2" type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} />
                </div>
                <div>
                  <Label>Subtotal ($)</Label>
                  <Input className="mt-2" type="number" min="0" step="0.01" value={invoiceForm.subtotal} onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tax ($)</Label>
                  <Input className="mt-2" type="number" min="0" step="0.01" value={invoiceForm.taxAmount} onChange={(e) => setInvoiceForm({ ...invoiceForm, taxAmount: e.target.value })} />
                </div>
                <div>
                  <Label>Discount ($)</Label>
                  <Input className="mt-2" type="number" min="0" step="0.01" value={invoiceForm.discountAmount} onChange={(e) => setInvoiceForm({ ...invoiceForm, discountAmount: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input className="mt-2" value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenInvoice(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    if (!invoiceForm.patientId) throw new Error("Please select a patient.");
                    const subtotal = toCents(invoiceForm.subtotal);
                    const tax = toCents(invoiceForm.taxAmount);
                    const discount = toCents(invoiceForm.discountAmount);
                    const total = subtotal + tax - discount;
                    const result = await addInvoice({
                      userId: "00000000-0000-0000-0000-000000000000",
                      patientId: invoiceForm.patientId,
                      invoiceNumber: `INV-${Date.now()}`,
                      invoiceDate: invoiceForm.invoiceDate,
                      dueDate: invoiceForm.dueDate,
                      subtotal,
                      taxAmount: tax,
                      discountAmount: discount,
                      totalAmount: total,
                      status: "pending",
                      notes: invoiceForm.notes,
                    } as any);
                    if (!result) throw new Error("Failed to create invoice");
                    toast({ title: "Invoice created" });
                    setOpenInvoice(false);
                  } catch (e: any) {
                    toast({ title: "Error", description: e.message, variant: "destructive" });
                  }
                }}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Record Payment */}
        <Dialog open={openPayment} onOpenChange={setOpenPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Patient</Label>
                  <select
                    className="mt-2 w-full rounded-md border bg-background p-2"
                    value={paymentForm.patientId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, patientId: Number(e.target.value) })}
                  >
                    <option value={0}>Select patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Invoice</Label>
                  <select
                    className="mt-2 w-full rounded-md border bg-background p-2"
                    value={paymentForm.invoiceId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: Number(e.target.value) })}
                  >
                    <option value={0}>Select invoice</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.invoiceNumber}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount ($)</Label>
                  <Input className="mt-2" type="number" min="0" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input className="mt-2" type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Method</Label>
                  <select
                    className="mt-2 w-full rounded-md border bg-background p-2"
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="insurance">Insurance</option>
                    <option value="check">Check</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <Label>Transaction ID</Label>
                  <Input className="mt-2" value={paymentForm.transactionId} onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input className="mt-2" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenPayment(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    if (!paymentForm.patientId || !paymentForm.invoiceId) throw new Error("Select patient and invoice.");
                    const result = await addPayment({
                      invoiceId: paymentForm.invoiceId,
                      patientId: paymentForm.patientId,
                      amount: toCents(paymentForm.amount),
                      paymentMethod: paymentForm.paymentMethod as any,
                      paymentDate: paymentForm.paymentDate,
                      transactionId: paymentForm.transactionId || undefined,
                      notes: paymentForm.notes || undefined
                    });
                    if (!result) throw new Error("Failed to record payment");
                    toast({ title: "Payment recorded" });
                    setOpenPayment(false);
                  } catch (e: any) {
                    toast({ title: "Error", description: e.message, variant: "destructive" });
                  }
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Submit Claim */}
        <Dialog open={openClaim} onOpenChange={setOpenClaim}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Insurance Claim</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Patient</Label>
                  <select
                    className="mt-2 w-full rounded-md border bg-background p-2"
                    value={claimForm.patientId}
                    onChange={(e) => setClaimForm({ ...claimForm, patientId: Number(e.target.value) })}
                  >
                    <option value={0}>Select patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Invoice (optional)</Label>
                  <select
                    className="mt-2 w-full rounded-md border bg-background p-2"
                    value={claimForm.invoiceId || 0}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setClaimForm({ ...claimForm, invoiceId: v ? v : undefined });
                    }}
                  >
                    <option value={0}>None</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.invoiceNumber}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Claim #</Label>
                  <Input className="mt-2" value={claimForm.claimNumber} onChange={(e) => setClaimForm({ ...claimForm, claimNumber: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    className="mt-2 w-full rounded-md border bg-background p-2"
                    value={claimForm.status}
                    onChange={(e) => setClaimForm({ ...claimForm, status: e.target.value })}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                    <option value="partially_approved">Partially Approved</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Submission Date</Label>
                  <Input className="mt-2" type="date" value={claimForm.submissionDate} onChange={(e) => setClaimForm({ ...claimForm, submissionDate: e.target.value })} />
                </div>
                <div>
                  <Label>Service Date</Label>
                  <Input className="mt-2" type="date" value={claimForm.serviceDate} onChange={(e) => setClaimForm({ ...claimForm, serviceDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Claimed ($)</Label>
                  <Input className="mt-2" type="number" min="0" step="0.01" value={claimForm.claimedAmount} onChange={(e) => setClaimForm({ ...claimForm, claimedAmount: e.target.value })} />
                </div>
                <div>
                  <Label>Approved ($)</Label>
                  <Input className="mt-2" type="number" min="0" step="0.01" value={claimForm.approvedAmount} onChange={(e) => setClaimForm({ ...claimForm, approvedAmount: e.target.value })} />
                </div>
                <div>
                  <Label>Paid ($)</Label>
                  <Input className="mt-2" type="number" min="0" step="0.01" value={claimForm.paidAmount} onChange={(e) => setClaimForm({ ...claimForm, paidAmount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Diagnosis Codes</Label>
                  <Input className="mt-2" value={claimForm.diagnosisCodes} onChange={(e) => setClaimForm({ ...claimForm, diagnosisCodes: e.target.value })} />
                </div>
                <div>
                  <Label>Procedure Codes</Label>
                  <Input className="mt-2" value={claimForm.procedureCodes} onChange={(e) => setClaimForm({ ...claimForm, procedureCodes: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input className="mt-2" value={claimForm.notes} onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenClaim(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    if (!claimForm.patientId || !claimForm.claimNumber) throw new Error("Fill required fields.");
                    const result = await addClaim({
                      userId: claimForm.userId || "00000000-0000-0000-0000-000000000000",
                      patientId: claimForm.patientId,
                      invoiceId: claimForm.invoiceId,
                      insuranceId: claimForm.insuranceId,
                      claimNumber: claimForm.claimNumber,
                      submissionDate: claimForm.submissionDate,
                      serviceDate: claimForm.serviceDate,
                      claimedAmount: toCents(claimForm.claimedAmount),
                      approvedAmount: claimForm.approvedAmount ? toCents(claimForm.approvedAmount) : undefined,
                      paidAmount: claimForm.paidAmount ? toCents(claimForm.paidAmount) : undefined,
                      status: claimForm.status as any,
                      diagnosisCodes: claimForm.diagnosisCodes || undefined,
                      procedureCodes: claimForm.procedureCodes || undefined,
                      notes: claimForm.notes || undefined,
                    });
                    if (!result) throw new Error("Failed to submit claim");
                    toast({ title: "Claim submitted" });
                    setOpenClaim(false);
                  } catch (e: any) {
                    toast({ title: "Error", description: e.message, variant: "destructive" });
                  }
                }}
              >
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
