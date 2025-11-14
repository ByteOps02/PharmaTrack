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

interface ProfileRecord {
  id: string;
  full_name: string;
  created_at: string;
  auth_users: { email: string; last_sign_in_at: string | null } | null;
  user_roles: Array<{ roles: { name: string } | null }>;
}

interface UserRecord {
  id: string;
  full_name: string;
  email: string | undefined;
  role: string | null;
  status: "active" | "inactive";
  joined: string;
}

const UsersAndRoles = () => {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ["users", page, 10, searchQuery, filterRole, filterStatus],
    queryFn: async () => {
      const from = page * 10;
      const to = from + 10 - 1;

      let query = supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          created_at,
          auth_users:auth.users ( email, last_sign_in_at ),
          user_roles ( roles ( name ) )
          `,
          { count: 'exact' }
        );

      if (filterRole !== "all") {
        query = query.eq("user_roles.roles.name", filterRole); // Assuming direct filtering on role name
      }

      // Filtering by status (active/inactive) based on last_sign_in_at
      // This is a simplified approach; a dedicated 'status' column in profiles might be better
      if (filterStatus === "active") {
        query = query.not("auth_users.last_sign_in_at", "is", null);
      } else if (filterStatus === "inactive") {
        query = query.is("auth_users.last_sign_in_at", null);
      }

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,auth_users.email.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Flatten the data for easier consumption
      const users: UserRecord[] = data.map((profile: ProfileRecord) => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.auth_users?.email,
        role: profile.user_roles.length > 0 ? profile.user_roles[0].roles?.name : null,
        status: profile.auth_users?.last_sign_in_at ? "active" : "inactive", // Simplified status based on last_sign_in_at
        joined: profile.created_at,
        // department: profile.department, // Assuming department is in profiles table
      }));
      return { data: users || [], count: count || 0 };
    },
  });

  const users: UserRecord[] = usersData?.data || [];
  const totalCount = usersData?.count || 0;
  const pageCount = Math.ceil(totalCount / 10);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
            <p className="text-muted-foreground">
              Manage user accounts and assign roles and permissions
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="operator">Operator</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
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
                        Error loading users
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user: UserRecord) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email || "-"}</TableCell>
                        <TableCell>{user.full_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "User"}</Badge>
                        </TableCell>
                        <TableCell>{user.department || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status?.charAt(0).toUpperCase() + user.status?.slice(1) || "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.joined ? new Date(user.joined).toLocaleDateString() : "-"}</TableCell>
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

export default UsersAndRoles;
