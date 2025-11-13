import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePatients } from "@/hooks/usePatients";
import { useClinicalRecords } from "@/hooks/useClinicalRecords";
import { useAppointments } from "@/hooks/useAppointments";
import { useVitals } from "@/hooks/useVitals";
import { useMedications } from "@/hooks/useMedications";
import { useLabResults } from "@/hooks/useLabResults";
import { useAllergies } from "@/hooks/useAllergies";
import { useConditions } from "@/hooks/useConditions";
import { PatientTimeline } from "@/components/PatientTimeline";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  Activity,
  AlertCircle,
  Heart,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";

const PatientProfile = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const patientIdNum = patientId ? parseInt(patientId) : undefined;

  const { patients } = usePatients();
  const patient = useMemo(() => patients.find(p => p.id === patientIdNum), [patients, patientIdNum]);
  
  const { patientRecords } = useClinicalRecords(patientIdNum);
  const { appointments } = useAppointments();
  const { vitals } = useVitals(patientIdNum);
  const { medications } = useMedications(patientIdNum);
  const { labResults } = useLabResults(patientIdNum);
  const { allergies } = useAllergies(patientIdNum);
  const { conditions } = useConditions(patientIdNum);

  const patientAppointments = useMemo(
    () => appointments.filter(a => a.patientId === patientIdNum),
    [appointments, patientIdNum]
  );

  const timelineEvents = useMemo(() => {
    const events: any[] = [];
    
    patientAppointments.forEach(apt => {
      events.push({
        id: `apt-${apt.id}`,
        date: `${apt.date} ${apt.time}`,
        type: "appointment",
        title: `${apt.type} - ${apt.provider}`,
        description: apt.location,
        status: apt.status
      });
    });

    patientRecords.forEach(record => {
      events.push({
        id: `record-${record.id}`,
        date: record.date,
        type: "record",
        title: record.title,
        description: record.content.substring(0, 100) + "...",
        status: record.type
      });
    });

    vitals.forEach(vital => {
      events.push({
        id: `vital-${vital.id}`,
        date: vital.recordDate,
        type: "vital",
        title: "Vital Signs Recorded",
        description: `BP: ${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}, Pulse: ${vital.pulse}`
      });
    });

    medications.forEach(med => {
      if (med.status === 'active') {
        events.push({
          id: `med-${med.id}`,
          date: med.prescribedDate,
          type: "medication",
          title: `${med.name} Prescribed`,
          description: `${med.dosage} - ${med.frequency}`,
          status: med.status
        });
      }
    });

    labResults.forEach(lab => {
      events.push({
        id: `lab-${lab.id}`,
        date: lab.testDate,
        type: "lab",
        title: lab.testName,
        description: `Result: ${lab.result} ${lab.unit}`,
        status: lab.status
      });
    });

    return events;
  }, [patientAppointments, patientRecords, vitals, medications, labResults]);

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-muted-foreground">
          Patient not found.
          <Button variant="link" onClick={() => navigate("/patients")}>
            Go to Patient Directory
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const activeMedications = medications.filter(m => m.status === 'active');
  const activeConditions = conditions.filter(c => c.status === 'active');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{patient.fullName}</h1>
            <p className="text-muted-foreground mt-1">MRN: {patient.mrn}</p>
          </div>
          <Button onClick={() => navigate(`/records/${patient.id}`)}>
            View Clinical Records
          </Button>
        </div>

        {/* Patient Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demographics</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">DOB:</span> {patient.dob}</p>
                <p className="text-sm"><span className="font-medium">Gender:</span> {patient.gender}</p>
                <p className="text-sm"><span className="font-medium">Age:</span> {
                  new Date().getFullYear() - new Date(patient.dob).getFullYear()
                } years</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contact</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <p className="text-sm">{patient.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <p className="text-sm">{patient.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <p className="text-sm">{patient.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Visit</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patient.lastVisit ? format(new Date(patient.lastVisit), "MMM dd, yyyy") : "Never"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {patientAppointments.length} total appointments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Records</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientRecords.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Clinical records on file
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {(allergies.length > 0 || activeConditions.length > 0) && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Important Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Allergies
                  </h3>
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
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    Active Conditions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {activeConditions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No active conditions</p>
                    ) : (
                      activeConditions.map((condition) => (
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
        )}

        {/* Main Content Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="timeline" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timeline">
                  <Activity className="mr-2 h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="medications">
                  <Activity className="mr-2 h-4 w-4" />
                  Medications ({activeMedications.length})
                </TabsTrigger>
                <TabsTrigger value="summary">
                  <FileText className="mr-2 h-4 w-4" />
                  Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="space-y-4">
                <PatientTimeline events={timelineEvents} />
              </TabsContent>

              <TabsContent value="medications" className="space-y-4">
                {activeMedications.length === 0 ? (
                  <p className="text-center text-muted-foreground">No active medications</p>
                ) : (
                  activeMedications.map((med) => (
                    <Card key={med.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">{med.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {med.dosage} • {med.frequency} • {med.route}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Prescribed by {med.prescribedBy} on {format(new Date(med.prescribedDate), "PPP")}
                            </p>
                            {med.instructions && (
                              <p className="text-sm mt-2">{med.instructions}</p>
                            )}
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Latest Vitals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vitals.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No vitals recorded</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Date:</span> {format(new Date(vitals[0].recordDate), "PPP")}</p>
                          {vitals[0].bloodPressureSystolic && vitals[0].bloodPressureDiastolic && (
                            <p className="text-sm"><span className="font-medium">BP:</span> {vitals[0].bloodPressureSystolic}/{vitals[0].bloodPressureDiastolic}</p>
                          )}
                          {vitals[0].pulse && (
                            <p className="text-sm"><span className="font-medium">Pulse:</span> {vitals[0].pulse} bpm</p>
                          )}
                          {vitals[0].temperature && (
                            <p className="text-sm"><span className="font-medium">Temp:</span> {vitals[0].temperature}°F</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Lab Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {labResults.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No lab results</p>
                      ) : (
                        <div className="space-y-2">
                          {labResults.slice(0, 3).map((lab) => (
                            <div key={lab.id} className="flex justify-between items-center">
                              <p className="text-sm font-medium">{lab.testName}</p>
                              <Badge variant={lab.status.toLowerCase() === "normal" ? "default" : "destructive"}>
                                {lab.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PatientProfile;
