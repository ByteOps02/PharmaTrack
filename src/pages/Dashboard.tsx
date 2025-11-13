import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Activity, FileText, ArrowRight, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const recentActivities = [
    { id: 1, patient: "Sarah Johnson", action: "Appointment scheduled", time: "10 mins ago", type: "appointment" },
    { id: 2, patient: "Michael Chen", action: "Lab results ready", time: "25 mins ago", type: "lab" },
    { id: 3, patient: "Emily Rodriguez", action: "Prescription updated", time: "1 hour ago", type: "prescription" },
    { id: 4, patient: "David Thompson", action: "New patient registered", time: "2 hours ago", type: "registration" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, Dr. Admin</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your patients today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Upcoming Appointments"
            value="15"
            icon={<Calendar className="h-6 w-6" />}
            trend={{ value: "3 today", positive: true }}
          />
          <StatsCard
            title="New Patients Today"
            value="5"
            icon={<Users className="h-6 w-6" />}
            trend={{ value: "2 urgent", positive: true }}
          />
          <StatsCard
            title="Pending Tasks"
            value="8"
            icon={<Activity className="h-6 w-6" />}
            trend={{ value: "2 overdue", positive: false }}
          />
          <StatsCard
            title="Total Patients"
            value="2,847"
            icon={<FileText className="h-6 w-6" />}
            trend={{ value: "12% from last month", positive: true }}
          />
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/patients")}>
                <Users className="mr-2 h-4 w-4" />
                Register New Patient
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/appointments")}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/records")}>
                <FileText className="mr-2 h-4 w-4" />
                Create Clinical Note
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/billing")}>
                <DollarSign className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/analytics")}>
                <Activity className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/analytics")}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.patient}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>.
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
