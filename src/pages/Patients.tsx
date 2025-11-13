import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { usePatients, Patient } from "@/hooks/usePatients";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dob: z.string().min(1, "Date of Birth is required"),
  gender: z.enum(["Male", "Female", "Other"], { message: "Gender is required" }),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
});

const Patients = () => {
  const { patients, loading, error, fetchPatients, addPatient, updatePatient, deletePatient } = usePatients();
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"All" | "Male" | "Female" | "Other">("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      dob: "",
      gender: "Other",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (selectedPatient) {
      form.reset({
        fullName: selectedPatient.fullName,
        dob: selectedPatient.dob,
        gender: selectedPatient.gender,
        phone: selectedPatient.phone,
        email: selectedPatient.email,
        address: selectedPatient.address,
      });
    } else {
      form.reset({
        fullName: "",
        dob: "",
        gender: "Other",
        phone: "",
        email: "",
        address: "",
      });
    }
  }, [selectedPatient, form]);

  const handleOpenDialog = (patient?: Patient) => {
    setSelectedPatient(patient || null);
    setOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    let result;
    if (selectedPatient) {
      result = await updatePatient({ ...selectedPatient, ...values });
    } else {
      result = await addPatient({
        fullName: values.fullName,
        dob: values.dob,
        gender: values.gender,
        phone: values.phone,
        email: values.email,
        address: values.address
      });
    }

    if (result) {
      toast({
        title: selectedPatient ? "Patient updated!" : "Patient registered!",
        description: `Patient ${values.fullName} has been ${selectedPatient ? 'updated' : 'registered'}.`,
      });
      setOpen(false);
      form.reset();
      fetchPatients(); // Refresh data after CRUD
    } else {
      toast({
        title: "Operation failed.",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this patient?")) {
      const success = await deletePatient(id);
      if (success) {
        toast({
          title: "Patient deleted!",
          description: "The patient record has been successfully removed.",
        });
        fetchPatients(); // Refresh data after CRUD
      } else {
        toast({
          title: "Deletion failed.",
          description: "There was an error deleting the patient.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredPatients = useMemo(() => {
    let filtered = patients;

    if (searchQuery) {
      filtered = filtered.filter(
        (patient) =>
          patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.phone.includes(searchQuery) ||
          (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (genderFilter !== "All") {
      filtered = filtered.filter((p) => p.gender === genderFilter);
    }

    // Basic sorting by full name
    filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));

    return filtered;
  }, [patients, searchQuery, genderFilter]);

  const pagedPatients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, genderFilter, pageSize]);

  const exportCsv = () => {
    const rows = [
      ["MRN", "Full Name", "DOB", "Gender", "Phone", "Email", "Address", "Last Visit"],
      ...filteredPatients.map(p => [
        p.mrn, p.fullName, p.dob, p.gender, p.phone, p.email, p.address, p.lastVisit || ""
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patients_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <DashboardLayout><div className="p-6 text-center">Loading patients...</div></DashboardLayout>;
  if (error) return <DashboardLayout><div className="p-6 text-center text-destructive">Error: {error}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Patient Directory</h1>
            <p className="text-muted-foreground mt-1">Manage and view all patient records</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                Register New Patient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedPatient ? "Edit Patient" : "Register New Patient"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Full Name</FormLabel>
                        <FormControl className="col-span-3">
                          <Input placeholder="Patient's Full Name" {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  {/* MRN is assigned automatically by the system on creation */}
                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Date of Birth</FormLabel>
                        <FormControl className="col-span-3">
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl className="col-span-3">
                            <SelectTrigger>
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Phone</FormLabel>
                        <FormControl className="col-span-3">
                          <Input placeholder="Phone Number" {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Email</FormLabel>
                        <FormControl className="col-span-3">
                          <Input placeholder="Email Address" {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Address</FormLabel>
                        <FormControl className="col-span-3">
                          <Input placeholder="Patient's Address" {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">
                      {selectedPatient ? "Save Changes" : "Register Patient"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, MRN, or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div>
                <select
                  className="w-full rounded-md border bg-background p-2"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value as any)}
                >
                  <option value="All">All genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center justify-end">
                <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MRN</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No patients found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.mrn}</TableCell>
                      <TableCell>{patient.fullName}</TableCell>
                      <TableCell>{patient.dob}</TableCell>
                      <TableCell>{patient.gender}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.email}</TableCell>
                      <TableCell>{patient.lastVisit}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => navigate(`/patients/${patient.id}`)}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/records/${patient.id}`)}>
                              View Clinical Records
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(patient)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Patient
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(patient.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Patient
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredPatients.length)} of {filteredPatients.length}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border bg-background p-2"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Prev
                  </Button>
                  <span className="text-sm">Page {page} / {Math.max(1, Math.ceil(filteredPatients.length / pageSize))}</span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(Math.ceil(filteredPatients.length / pageSize), p + 1))}
                    disabled={page >= Math.ceil(filteredPatients.length / pageSize)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Patients;
