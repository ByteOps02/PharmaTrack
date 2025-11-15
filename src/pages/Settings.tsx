import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fetchSettings = async () => {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value");

  if (error) throw new Error(error.message);
  return data;
};

const Settings = () => {
  const { user } = useAuth();

  const {
    data: userSettings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
    enabled: !!user,
  });

  const settingsMap = userSettings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  if (settingsLoading) {
    return (
      <DashboardLayout>
        <div>Loading settings...</div>
      </DashboardLayout>
    );
  }

  if (settingsError) {
    return (
      <DashboardLayout>
        <div>Error loading settings: {settingsError.message}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage system configuration and preferences
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Update your company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      placeholder="Enter company name"
                      defaultValue={settingsMap?.company_name || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-email">Email</Label>
                    <Input
                      id="company-email"
                      type="email"
                      placeholder="Enter email"
                      defaultValue={settingsMap?.company_email || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-phone">Phone</Label>
                    <Input
                      id="company-phone"
                      placeholder="Enter phone number"
                      defaultValue={settingsMap?.company_phone || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-website">Website</Label>
                    <Input
                      id="company-website"
                      placeholder="Enter website URL"
                      defaultValue={settingsMap?.company_website || ""}
                    />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Two-Factor Authentication</Label>
                  <Switch
                    checked={settingsMap?.two_factor_auth === "true"}
                    // onChange handler would be needed here
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    defaultValue={settingsMap?.session_timeout || "30"}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Login Alerts</Label>
                  <Switch
                    checked={settingsMap?.login_alerts === "true"}
                    // onChange handler would be needed here
                  />
                </div>
                <Button>Update Security Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control your notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Email Notifications</Label>
                  <Switch
                    checked={settingsMap?.email_notifications === "true"}
                    // onChange handler would be needed here
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Low Stock Alerts</Label>
                  <Switch
                    checked={settingsMap?.low_stock_alerts === "true"}
                    // onChange handler would be needed here
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Expiry Warnings</Label>
                  <Switch
                    checked={settingsMap?.expiry_warnings === "true"}
                    // onChange handler would be needed here
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Order Updates</Label>
                  <Switch
                    checked={settingsMap?.order_updates === "true"}
                    // onChange handler would be needed here
                  />
                </div>
                <Button>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Manage system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Input
                      id="currency"
                      defaultValue={settingsMap?.default_currency || "USD"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      defaultValue={settingsMap?.timezone || "UTC"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Input
                      id="language"
                      defaultValue={settingsMap?.language || "English"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-format">Date Format</Label>
                    <Input
                      id="date-format"
                      defaultValue={settingsMap?.date_format || "MM/DD/YYYY"}
                    />
                  </div>
                </div>
                <Button>Update System Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
