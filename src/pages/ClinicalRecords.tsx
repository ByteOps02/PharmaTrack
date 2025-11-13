import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, FileText, Activity, Pill, FlaskConical, Heart, AlertCircle, Edit, Trash2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { usePatients } from "@/hooks/usePatients";
import { useClinicalRecords, ClinicalRecord } from "@/hooks/useClinicalRecords";
import { useVitals } from "@/hooks/useVitals";
import { useMedications } from "@/hooks/useMedications";
import { useLabResults } from "@/hooks/useLabResults";
import { useAllergies } from "@/hooks/useAllergies";
import { useConditions } from "@/hooks/useConditions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const formSchema = z.object({
  type: z.string().min(1, "Record type is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  provider: z.string().min(1, "Provider is required"),
});

const ClinicalRecords = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const patientIdNum = patientId ? parseInt(patientId) : undefined;

  const { patients } = usePatients();
  const patient = useMemo(() => patients.find(p => p.id === patientIdNum), [patients, patientIdNum]);

  const { patientRecords, addRecord, updateRecord, deleteRecord } = useClinicalRecords(patientIdNum || 0);
  const { vitals } = useVitals(patientIdNum);
  const { medications } = useMedications(patientIdNum);
  const { labResults } = useLabResults(patientIdNum);
  const { allergies } = useAllergies(patientIdNum);
  const { conditions } = useConditions(patientIdNum);

  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecord | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      title: "",
      content: "",
      provider: "",
    },
  });

  const handleOpenDialog = (record?: ClinicalRecord) => {
    setSelectedRecord(record || null);
    if (record) {
      form.reset({
        type: record.type,
        title: record.title,
        content: record.content,
        provider: record.provider,
      });
    } else {
      form.reset({
        type: "",
        title: "",
        content: "",
        provider: "",
      });
    }
    setOpen(true);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!patientIdNum) return;

    if (selectedRecord) {
      updateRecord({ ...selectedRecord, ...values });
    } else {
      addRecord({ 
        type: values.type,
        title: values.title,
        content: values.content,
        provider: values.provider,
        patientId: patientIdNum 
      });
    }
    setOpen(false);
    form.reset();
  };


  if (!patient) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-muted-foreground">
          Patient not found.
          <Button variant="link" onClick={() => navigate("/patients")}>Go to Patient Directory</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clinical Records for {patient.fullName}</h1>
            <p className="text-muted-foreground mt-1">MRN: {patient.mrn} | DOB: {patient.dob} | Phone: {patient.phone}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                Add New Record
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedRecord ? "Edit Clinical Record" : "Add New Clinical Record"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl className="col-span-3">
                            <SelectTrigger>
                              <SelectValue placeholder="Select record type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Consultation Note">Consultation Note</SelectItem>
                            <SelectItem value="Lab Result">Lab Result</SelectItem>
                            <SelectItem value="Prescription">Prescription</SelectItem>
                            <SelectItem value="Imaging Report">Imaging Report</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Title</FormLabel>
                        <FormControl className="col-span-3">
                          <Input placeholder="Record Title" {...field} />
                        </FormControl>
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
                    name="content"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-start gap-4">
                        <FormLabel className="text-right pt-2">Content</FormLabel>
                        <FormControl className="col-span-3">
                          <Textarea placeholder="Record content..." {...field} rows={5} />
                        </FormControl>
                        <FormMessage className="col-span-4 col-start-2" />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">
                      {selectedRecord ? "Save Changes" : "Add Record"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Patient Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{patient.fullName}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  MRN: {patient.mrn} • {patient.dob} • {patient.gender} • Phone: {patient.phone}
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate(`/patients`)}>Back to Patients</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold text-foreground">Allergies</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allergies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No known allergies</p>
                  ) : (
                    allergies.map((allergy) => (
                      <Badge key={allergy.id} variant="destructive">
                        {allergy.allergen} ({allergy.severity})
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Active Conditions</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {conditions.filter(c => c.status === 'active').length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active conditions</p>
                  ) : (
                    conditions.filter(c => c.status === 'active').map((condition) => (
                      <Badge key={condition.id} variant="outline">
                        {condition.condition}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Records */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="encounters" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="encounters">
                  <FileText className="mr-2 h-4 w-4" />
                  Encounters
                </TabsTrigger>
                <TabsTrigger value="vitals">
                  <Activity className="mr-2 h-4 w-4" />
                  Vitals
                </TabsTrigger>
                <TabsTrigger value="medications">
                  <Pill className="mr-2 h-4 w-4" />
                  Medications
                </TabsTrigger>
                <TabsTrigger value="labs">
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Lab Results
                </TabsTrigger>
              </TabsList>

              <TabsContent value="encounters" className="space-y-4">
                {patientRecords.length === 0 ? (
                  <p className="text-muted-foreground text-center">No clinical records found for this patient.</p>
                ) : (
                  patientRecords.map((record) => (
                    <Card key={record.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{record.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(record.date), "PPP")} • {record.provider} • {record.type}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog(record)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteRecord(record.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{record.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="vitals" className="space-y-4">
                {vitals.length === 0 ? (
                  <p className="text-muted-foreground text-center">No vital records found for this patient.</p>
                ) : (
                  vitals.map((vital) => (
                    <Card key={vital.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{format(new Date(vital.recordDate), "PPP")}</CardTitle>
                        <p className="text-sm text-muted-foreground">Recorded by: {vital.recordedBy}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {vital.bloodPressureSystolic && vital.bloodPressureDiastolic && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Blood Pressure</p>
                              <p className="text-lg font-semibold text-foreground">
                                {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                              </p>
                            </div>
                          )}
                          {vital.pulse && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Pulse</p>
                              <p className="text-lg font-semibold text-foreground">{vital.pulse} bpm</p>
                            </div>
                          )}
                          {vital.temperature && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                              <p className="text-lg font-semibold text-foreground">{vital.temperature}°F</p>
                            </div>
                          )}
                          {vital.weight && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Weight</p>
                              <p className="text-lg font-semibold text-foreground">{vital.weight} lbs</p>
                            </div>
                          )}
                          {vital.height && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Height</p>
                              <p className="text-lg font-semibold text-foreground">{vital.height} in</p>
                            </div>
                          )}
                        </div>
                        {vital.notes && (
                          <p className="text-sm text-muted-foreground mt-4">{vital.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="medications" className="space-y-4">
                {medications.length === 0 ? (
                  <p className="text-muted-foreground text-center">No medications found for this patient.</p>
                ) : (
                  medications.map((med) => (
                    <Card key={med.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground">{med.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {med.dosage} • {med.frequency} • {med.route}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Prescribed by {med.prescribedBy} on {format(new Date(med.prescribedDate), "PPP")}
                            </p>
                            {med.instructions && (
                              <p className="text-sm text-foreground">{med.instructions}</p>
                            )}
                          </div>
                          <Badge variant={med.status === "active" ? "default" : "secondary"}>
                            {med.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="labs" className="space-y-4">
                {labResults.length === 0 ? (
                  <p className="text-muted-foreground text-center">No lab results found for this patient.</p>
                ) : (
                  labResults.map((lab) => (
                    <Card key={lab.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{lab.testName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(lab.testDate), "PPP")} • Ordered by {lab.orderedBy}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Result: {lab.result} {lab.unit}</p>
                            {lab.referenceRange && (
                              <p className="text-sm text-muted-foreground">Reference: {lab.referenceRange}</p>
                            )}
                          </div>
                          <Badge
                            variant={
                              lab.status.toLowerCase() === "normal" ? "default" :
                              lab.status.toLowerCase() === "borderline" ? "secondary" :
                              "destructive"
                            }
                          >
                            {lab.status}
                          </Badge>
                        </div>
                        {lab.notes && (
                          <p className="text-sm text-muted-foreground mt-4">{lab.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClinicalRecords;

