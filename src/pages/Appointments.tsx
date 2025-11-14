import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
import { Input } from "@/components/ui/input";
import { Plus, Clock, User, MapPin, Phone, Trash2, Edit } from "lucide-react";
import { useAppointments } from "@/hooks/useAppointments";
import type { Appointment } from "@/hooks/useAppointments";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { usePatients } from "@/hooks/usePatients"; // To get patientId for new appointments

const formSchema = z.object({
  patientId: z.number().min(1, "Patient is required"), // New field for patient ID
  patientName: z.string().min(1, "Patient name is required"),
  mrn: z.string().min(1, "MRN is required"),
  type: z.string().min(1, "Appointment type is required"),
  provider: z.string().min(1, "Provider is required"),
  location: z.string().min(1, "Location is required"),
  phone: z.string().min(1, "Phone number is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

const Appointments = () => {
  const { appointments, loading, error, fetchAppointments, addAppointment, updateAppointment, deleteAppointment, checkInAppointment } = useAppointments();
  const { patients } = usePatients(); // To select patient for appointment
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: 0,
      patientName: "",
      mrn: "",
      type: "",
      provider: "",
      location: "",
      phone: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "09:00",
    },
  });

  useEffect(() => {
    if (selectedAppointment) {
      form.reset({
        patientId: selectedAppointment.patientId,
        patientName: selectedAppointment.patientName,
        mrn: selectedAppointment.mrn,
        type: selectedAppointment.type,
        provider: selectedAppointment.provider,
        location: selectedAppointment.location,
        phone: selectedAppointment.phone,
        date: selectedAppointment.date,
        time: selectedAppointment.time,
      });
    } else {
      form.reset({
        patientId: 0,
        patientName: "",
        mrn: "",
        type: "",
        provider: "",
        location: "",
        phone: "",
        date: format(selectedDate || new Date(), "yyyy-MM-dd"),
        time: "09:00",
      });
    }
  }, [selectedAppointment, form, selectedDate]);

  const handleOpenDialog = (appointment?: Appointment) => {
    setSelectedAppointment(appointment || null);
    setOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    let result;
    if (selectedAppointment) {
      result = await updateAppointment({ ...selectedAppointment, ...values });
    } else {
      result = await addAppointment({
        patientId: values.patientId,
        patientName: values.patientName,
        mrn: values.mrn,
        type: values.type,
        provider: values.provider,
        location: values.location,
        phone: values.phone,
        date: values.date,
        time: values.time,
        status: 'pending'
      });
    }

    if (result) {
      toast({
        title: selectedAppointment ? "Appointment updated!" : "Appointment scheduled!",
        description: `Appointment for ${values.patientName} on ${values.date} at ${values.time} has been ${selectedAppointment ? 'updated' : 'scheduled'}.`,
      });
      setOpen(false);
      form.reset();
      fetchAppointments(); // Refresh data after CRUD
    } else {
      toast({
        title: "Operation failed.",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      const success = await deleteAppointment(id);
      if (success) {
        toast({
          title: "Appointment deleted!",
          description: "The appointment has been successfully removed.",
        });
        fetchAppointments(); // Refresh data after CRUD
      } else {
        toast({
          title: "Deletion failed.",
          description: "There was an error deleting the appointment.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCheckIn = async (id: number) => {
    const result = await checkInAppointment(id);
    if (result) {
      toast({
        title: "Appointment checked in!",
        description: `Appointment for ${result.patientName} has been checked in.`,
      });
      fetchAppointments(); // Refresh data after CRUD
    } else {
      toast({
        title: "Check-in failed.",
        description: "There was an error checking in the appointment.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "checked-in":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Filter by selected date
    if (selectedDate) {
      const formattedSelectedDate = format(selectedDate, "yyyy-MM-dd");
      filtered = filtered.filter(app => app.date === formattedSelectedDate);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.mrn.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((app) => app.status === filterStatus);
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((app) => app.type === filterType);
    }

    // Sort by time
    filtered.sort((a, b) => a.time.localeCompare(b.time));

    return filtered;
  }, [appointments, selectedDate, searchTerm, filterStatus, filterType]);

  const todayAppointments = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return appointments.filter(app => app.date === today);
  }, [appointments]);

  if (loading) return <DashboardLayout><div className="p-6 text-center">Loading appointments...</div></DashboardLayout>;
  if (error) return <DashboardLayout><div className="p-6 text-center text-destructive">Error: {error}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
            <p className="text-muted-foreground mt-1">Manage patient appointments and schedules</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                Schedule Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedAppointment ? "Edit Appointment" : "Schedule New Appointment"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Patient</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const selectedPatient = patients.find(p => p.id === parseInt(value));
                            if (selectedPatient) {
                              field.onChange(parseInt(value));
                              form.setValue("patientName", selectedPatient.fullName);
                              form.setValue("mrn", selectedPatient.mrn);
                              form.setValue("phone", selectedPatient.phone);
                            }
                          }}
                          value={field.value ? String(field.value) : ""}
                        >
                          <FormControl className="col-span-3">
                            <SelectTrigger>
                              <SelectValue placeholder="Select a patient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients.map((patient) => (
                              <SelectItem key={patient.id} value={String(patient.id)}>
                                {patient.fullName} (MRN: {patient.mrn})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Patient Name</FormLabel>
                        <FormControl className="col-span-3">
                          <Input placeholder="Patient Name" {...field} disabled />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mrn"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">MRN</FormLabel>
                        <FormControl className="col-span-3">
                          <Input placeholder="MRN" {...field} disabled />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl className="col-span-3">
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Follow-up">Follow-up</SelectItem>
                            <SelectItem value="New Patient">New Patient</SelectItem>
                            <SelectItem value="Consultation">Consultation</SelectItem>
                            <SelectItem value="Annual Checkup">Annual Checkup</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Provider</FormLabel>
                        <FormControl className="col-span-3">
                          <Input placeholder="Provider Name" {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Location</FormLabel>
                        <FormControl className="col-span-3">
                          <Input placeholder="Location" {...field} />
                        </FormControl>
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
                          <Input placeholder="Phone Number" {...field} disabled />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Date</FormLabel>
                        <FormControl className="col-span-3">
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Time</FormLabel>
                        <FormControl className="col-span-3">
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">
                      {selectedAppointment ? "Save Changes" : "Schedule Appointment"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
  
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
              />
            </CardContent>
          </Card>
  
          {/* Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Today's Total</p>
                      <p className="text-3xl font-bold text-foreground">{todayAppointments.length}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
  
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Checked In</p>
                      <p className="text-3xl font-bold text-success">
                        {todayAppointments.filter(app => app.status === 'checked-in').length}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                      <User className="h-6 w-6 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>
  
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-3xl font-bold text-warning">
                        {todayAppointments.filter(app => app.status === 'pending').length}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                      <Clock className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
  
        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Appointments for {selectedDate ? format(selectedDate, "PPP") : "Today"}
            </CardTitle>
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Search by patient or MRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked-in">Checked-in</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="New Patient">New Patient</SelectItem>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Annual Checkup">Annual Checkup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>MRN</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      No appointments found for this date.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {appointment.time}
                        </div>
                      </TableCell>
                      <TableCell>{appointment.patientName}</TableCell>
                      <TableCell className="text-muted-foreground">{appointment.mrn}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{appointment.type}</Badge>
                      </TableCell>
                      <TableCell>{appointment.provider}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {appointment.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{appointment.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {appointment.status !== 'checked-in' && (
                            <Button size="sm" variant="outline" onClick={() => handleCheckIn(appointment.id)}>
                              Check In
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleOpenDialog(appointment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(appointment.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

export default Appointments;
