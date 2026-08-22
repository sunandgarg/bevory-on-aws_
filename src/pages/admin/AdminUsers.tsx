import { useState, useEffect, useMemo } from "react";
import { User, Plus, Trash2, UserCog, Filter, UserPlus, Send, RefreshCw, Settings2, Shield, Eye, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import FormField from "@/components/admin/FormField";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import { useFormValidation, ValidationSchema } from "@/hooks/useFormValidation";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "user" | "content_manager" | "content_writer";
}

interface UserPermission {
  id: string;
  user_id: string;
  section: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_publish: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/10 text-red-500 border-red-500/20",
  user: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  content_manager: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  content_writer: "bg-green-500/10 text-green-500 border-green-500/20",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  user: "User",
  content_manager: "Content Manager",
  content_writer: "Content Writer",
};

const ADMIN_SECTIONS = [
  { id: "products", label: "Products", icon: "📦" },
  { id: "categories", label: "Categories", icon: "📂" },
  { id: "brands", label: "Brands", icon: "🏷️" },
  { id: "cocktails", label: "Cocktails", icon: "🍸" },
  { id: "blog", label: "Blog/Guide", icon: "📝" },
  { id: "magazine", label: "Magazine", icon: "📰" },
  { id: "announcements", label: "Announcements", icon: "📢" },
  { id: "cheers_guide", label: "Cheers Guide", icon: "🎉" },
  { id: "video_reviews", label: "Video Reviews", icon: "🎬" },
  { id: "locations", label: "Locations", icon: "📍" },
  { id: "reviews", label: "Reviews", icon: "⭐" },
  { id: "help_support", label: "Help & Support", icon: "❓" },
];

const userValidationSchema: ValidationSchema = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 6,
  },
};

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("user");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [addUserTab, setAddUserTab] = useState<"create" | "invite">("create");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const { toast } = useToast();
  const { errors, validate, clearErrors, clearError } = useFormValidation(userValidationSchema);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, permissionsRes] = await Promise.all([
      apiClient.from("profiles").select("*").order("created_at", { ascending: false }),
      apiClient.from("user_roles").select("*"),
      apiClient.from("user_permissions").select("*"),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (rolesRes.data) setUserRoles(rolesRes.data as UserRole[]);
    if (permissionsRes.data) setUserPermissions(permissionsRes.data as UserPermission[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getUserRoles = (userId: string) => {
    return userRoles.filter((r) => r.user_id === userId);
  };

  const getUserPermissions = (userId: string) => {
    return userPermissions.filter((p) => p.user_id === userId);
  };

  const filteredProfiles = useMemo(() => {
    let result = profiles;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.email?.toLowerCase().includes(query) ||
          p.full_name?.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((p) => {
        const roles = getUserRoles(p.id);
        if (roleFilter === "no_role") {
          return roles.length === 0;
        }
        return roles.some((r) => r.role === roleFilter);
      });
    }

    return result;
  }, [profiles, searchQuery, roleFilter, userRoles]);

  const managers = useMemo(() => {
    return profiles.filter((p) => {
      const roles = getUserRoles(p.id);
      return roles.some((r) => r.role === "admin" || r.role === "content_manager");
    });
  }, [profiles, userRoles]);

  const stats = useMemo(() => {
    const adminCount = profiles.filter(p => getUserRoles(p.id).some(r => r.role === "admin")).length;
    const userCount = profiles.filter(p => getUserRoles(p.id).some(r => r.role === "user")).length;
    const managerCount = profiles.filter(p => getUserRoles(p.id).some(r => r.role === "content_manager")).length;
    const writerCount = profiles.filter(p => getUserRoles(p.id).some(r => r.role === "content_writer")).length;
    const noRoleCount = profiles.filter(p => getUserRoles(p.id).length === 0).length;
    
    return { adminCount, userCount, managerCount, writerCount, noRoleCount, total: profiles.length };
  }, [profiles, userRoles]);

  const addRole = async () => {
    if (!selectedUserId || !newRole) return;

    const existingRole = userRoles.find(
      (r) => r.user_id === selectedUserId && r.role === newRole
    );
    if (existingRole) {
      toast({ title: "Role already exists", variant: "destructive" });
      return;
    }

    const { error } = await apiClient.from("user_roles").insert([
      {
        user_id: selectedUserId,
        role: newRole as "admin" | "user" | "content_manager" | "content_writer",
      },
    ]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // If content_writer role, create default permissions
      if (newRole === "content_writer") {
        const defaultSections = ["blog", "cocktails"];
        for (const section of defaultSections) {
          await apiClient.from("user_permissions").upsert({
            user_id: selectedUserId,
            section,
            can_view: true,
            can_create: true,
            can_edit: true,
            can_delete: false,
            can_publish: false,
          }, { onConflict: "user_id,section" });
        }
      }
      toast({ title: "Role added!" });
      setShowRoleDialog(false);
      fetchData();
    }
  };

  const removeRole = async (roleId: string) => {
    if (!confirm("Remove this role?")) return;

    const { error } = await apiClient.from("user_roles").delete().eq("id", roleId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role removed" });
      fetchData();
    }
  };

  const updatePermission = async (
    userId: string,
    section: string,
    permission: "can_view" | "can_create" | "can_edit" | "can_delete" | "can_publish",
    value: boolean
  ) => {
    const existing = userPermissions.find((p) => p.user_id === userId && p.section === section);
    
    if (existing) {
      await apiClient.from("user_permissions").update({ [permission]: value }).eq("id", existing.id);
    } else {
      await apiClient.from("user_permissions").insert({
        user_id: userId,
        section,
        can_view: permission === "can_view" ? value : true,
        can_create: permission === "can_create" ? value : false,
        can_edit: permission === "can_edit" ? value : false,
        can_delete: permission === "can_delete" ? value : false,
        can_publish: permission === "can_publish" ? value : false,
      });
    }
    fetchData();
  };

  const getPermissionValue = (userId: string, section: string, permission: keyof UserPermission) => {
    const perm = userPermissions.find((p) => p.user_id === userId && p.section === section);
    if (!perm) return false;
    return perm[permission] as boolean;
  };

  const createUser = async () => {
    if (!validate({ email: newUserEmail, password: newUserPassword })) {
      toast({ title: "Validation Error", description: "Please fill all required fields correctly", variant: "destructive" });
      return;
    }

    setCreating(true);
    
    try {
      const { data, error } = await apiClient.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserName || null,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        if (newUserRole !== "user") {
          await apiClient.from("user_roles").insert({
            user_id: data.user.id,
            role: newUserRole as "admin" | "user" | "content_manager" | "content_writer",
          });
        }

        toast({ 
          title: "User Created!", 
          description: `${newUserEmail} has been added with ${ROLE_LABELS[newUserRole]} role` 
        });
        setShowAddUserDialog(false);
        resetAddUserForm();
        fetchData();
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create user", 
        variant: "destructive" 
      });
    }
    
    setCreating(false);
  };

  const sendInvite = async () => {
    if (!validate({ email: newUserEmail })) {
      toast({ title: "Validation Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    const inviteLink = `${window.location.origin}/auth?email=${encodeURIComponent(newUserEmail)}`;
    await navigator.clipboard.writeText(inviteLink);

    toast({
      title: "Invite Link Copied!",
      description: `Share this link with ${newUserEmail}. Once they sign up, assign their role.`,
    });
    setShowAddUserDialog(false);
    resetAddUserForm();
  };

  const resetAddUserForm = () => {
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserName("");
    setNewUserRole("user");
    setSelectedManager(null);
    clearErrors();
  };

  const openAddUserDialog = () => {
    resetAddUserForm();
    setShowAddUserDialog(true);
  };

  const syncProfiles = async () => {
    setSyncing(true);
    toast({ title: "Syncing users...", description: "This may take a moment" });
    
    await fetchData();
    
    setSyncing(false);
    toast({ title: "Sync complete!", description: `Found ${profiles.length} users` });
  };

  const selectedUserProfile = profiles.find((p) => p.id === selectedUserId);
  const selectedUserRoles = selectedUserId ? getUserRoles(selectedUserId) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Users & Roles ({stats.total})</h2>
        <div className="flex items-center gap-2">
          <AdminSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search users..."
          />
          <Button size="sm" variant="outline" onClick={syncProfiles} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button size="sm" onClick={openAddUserDialog}>
            <UserPlus className="w-4 h-4 mr-1" /> Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <button
          onClick={() => setRoleFilter("all")}
          className={`p-3 rounded-lg border text-center transition-colors ${
            roleFilter === "all" ? "bg-accent text-accent-foreground border-accent" : "bg-card border-border hover:bg-secondary"
          }`}
        >
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">All Users</p>
        </button>
        <button
          onClick={() => setRoleFilter("admin")}
          className={`p-3 rounded-lg border text-center transition-colors ${
            roleFilter === "admin" ? "bg-red-500/20 border-red-500" : "bg-card border-border hover:bg-secondary"
          }`}
        >
          <p className="text-2xl font-bold text-red-500">{stats.adminCount}</p>
          <p className="text-xs text-muted-foreground">Admins</p>
        </button>
        <button
          onClick={() => setRoleFilter("content_manager")}
          className={`p-3 rounded-lg border text-center transition-colors ${
            roleFilter === "content_manager" ? "bg-purple-500/20 border-purple-500" : "bg-card border-border hover:bg-secondary"
          }`}
        >
          <p className="text-2xl font-bold text-purple-500">{stats.managerCount}</p>
          <p className="text-xs text-muted-foreground">Managers</p>
        </button>
        <button
          onClick={() => setRoleFilter("content_writer")}
          className={`p-3 rounded-lg border text-center transition-colors ${
            roleFilter === "content_writer" ? "bg-green-500/20 border-green-500" : "bg-card border-border hover:bg-secondary"
          }`}
        >
          <p className="text-2xl font-bold text-green-500">{stats.writerCount}</p>
          <p className="text-xs text-muted-foreground">Writers</p>
        </button>
        <button
          onClick={() => setRoleFilter("user")}
          className={`p-3 rounded-lg border text-center transition-colors ${
            roleFilter === "user" ? "bg-blue-500/20 border-blue-500" : "bg-card border-border hover:bg-secondary"
          }`}
        >
          <p className="text-2xl font-bold text-blue-500">{stats.userCount}</p>
          <p className="text-xs text-muted-foreground">Users</p>
        </button>
        <button
          onClick={() => setRoleFilter("no_role")}
          className={`p-3 rounded-lg border text-center transition-colors ${
            roleFilter === "no_role" ? "bg-muted border-muted-foreground" : "bg-card border-border hover:bg-secondary"
          }`}
        >
          <p className="text-2xl font-bold text-muted-foreground">{stats.noRoleCount}</p>
          <p className="text-xs text-muted-foreground">No Role</p>
        </button>
      </div>

      {/* Role Filter Dropdown */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="admin">Admins Only</SelectItem>
            <SelectItem value="content_manager">Content Managers</SelectItem>
            <SelectItem value="content_writer">Content Writers</SelectItem>
            <SelectItem value="user">Regular Users</SelectItem>
            <SelectItem value="no_role">No Role Assigned</SelectItem>
          </SelectContent>
        </Select>
        {roleFilter !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => setRoleFilter("all")}>
            Clear Filter
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No users found</p>
          {roleFilter !== "all" && (
            <Button variant="link" onClick={() => setRoleFilter("all")}>
              Clear filter
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProfiles.map((p) => {
            const roles = getUserRoles(p.id);
            const permissions = getUserPermissions(p.id);
            const hasPermissions = permissions.length > 0;
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.full_name || "User"}</p>
                  <p className="text-sm text-muted-foreground truncate">{p.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {roles.length === 0 ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      No Role
                    </Badge>
                  ) : (
                    roles.map((role) => (
                      <div key={role.id} className="flex items-center gap-1">
                        <Badge className={ROLE_COLORS[role.role]}>{ROLE_LABELS[role.role]}</Badge>
                        {role.role !== "user" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => removeRole(role.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                  {hasPermissions && (
                    <Badge variant="outline" className="text-xs">
                      <Settings2 className="w-3 h-3 mr-1" />
                      {permissions.length} sections
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setSelectedUserId(p.id);
                      setShowPermissionsDialog(true);
                    }}
                    title="Manage Permissions"
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setSelectedUserId(p.id);
                      setNewRole("content_writer");
                      setShowRoleDialog(true);
                    }}
                    title="Add Role"
                  >
                    <UserCog className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Select Role">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin - Full access</SelectItem>
                  <SelectItem value="content_manager">Content Manager - Manage all content & approve drafts</SelectItem>
                  <SelectItem value="content_writer">Content Writer - Create & edit content (needs approval)</SelectItem>
                  <SelectItem value="user">User - Basic access</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            
            {newRole === "content_writer" && (
              <FormField label="Assign Manager (optional)">
                <Select value={selectedManager || ""} onValueChange={setSelectedManager}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager for approval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific manager</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name || m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
            
            <div className="p-3 rounded-lg bg-secondary/50 text-sm">
              <p className="font-medium mb-1">Role Permissions:</p>
              {newRole === "admin" && (
                <p className="text-muted-foreground">Full access to all admin features</p>
              )}
              {newRole === "content_manager" && (
                <p className="text-muted-foreground">
                  Can manage all content, approve writer submissions, publish content
                </p>
              )}
              {newRole === "content_writer" && (
                <p className="text-muted-foreground">
                  Can create and edit content in assigned sections. Cannot publish - requires manager approval.
                </p>
              )}
              {newRole === "user" && (
                <p className="text-muted-foreground">Basic user access only</p>
              )}
            </div>
            <Button className="w-full" onClick={addRole}>
              Add Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Section Permissions - {selectedUserProfile?.full_name || selectedUserProfile?.email}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              <p className="text-sm text-muted-foreground">
                Configure which admin sections this user can access and what actions they can perform.
              </p>
              
              {selectedUserRoles.some(r => r.role === "admin") ? (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="font-medium text-red-500">Admin Role Active</p>
                  <p className="text-sm text-muted-foreground">
                    Admins have full access to all sections. Remove admin role to set custom permissions.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground px-3 py-2 bg-secondary/50 rounded-lg">
                    <div className="col-span-2">Section</div>
                    <div className="text-center">View</div>
                    <div className="text-center">Create</div>
                    <div className="text-center">Edit</div>
                    <div className="text-center">Publish</div>
                  </div>
                  
                  {ADMIN_SECTIONS.map((section) => (
                    <div key={section.id} className="grid grid-cols-6 gap-2 items-center px-3 py-2 rounded-lg hover:bg-secondary/30">
                      <div className="col-span-2 flex items-center gap-2">
                        <span>{section.icon}</span>
                        <span className="text-sm font-medium">{section.label}</span>
                      </div>
                      <div className="flex justify-center">
                        <Switch
                          checked={getPermissionValue(selectedUserId!, section.id, "can_view")}
                          onCheckedChange={(v) => updatePermission(selectedUserId!, section.id, "can_view", v)}
                        />
                      </div>
                      <div className="flex justify-center">
                        <Switch
                          checked={getPermissionValue(selectedUserId!, section.id, "can_create")}
                          onCheckedChange={(v) => updatePermission(selectedUserId!, section.id, "can_create", v)}
                        />
                      </div>
                      <div className="flex justify-center">
                        <Switch
                          checked={getPermissionValue(selectedUserId!, section.id, "can_edit")}
                          onCheckedChange={(v) => updatePermission(selectedUserId!, section.id, "can_edit", v)}
                        />
                      </div>
                      <div className="flex justify-center">
                        <Switch
                          checked={getPermissionValue(selectedUserId!, section.id, "can_publish")}
                          onCheckedChange={(v) => updatePermission(selectedUserId!, section.id, "can_publish", v)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>View:</strong> Can see the section • 
                  <strong>Create:</strong> Can add new items • 
                  <strong>Edit:</strong> Can modify existing items • 
                  <strong>Publish:</strong> Can publish without approval
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          
          <Tabs value={addUserTab} onValueChange={(v) => setAddUserTab(v as "create" | "invite")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="gap-1">
                <UserPlus className="w-4 h-4" /> Create User
              </TabsTrigger>
              <TabsTrigger value="invite" className="gap-1">
                <Send className="w-4 h-4" /> Invite User
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-4 mt-4">
              <FormField label="Full Name">
                <Input
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </FormField>
              <FormField label="Email Address" required error={errors.email}>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => {
                    setNewUserEmail(e.target.value);
                    clearError("email");
                  }}
                />
              </FormField>
              <FormField label="Password" required error={errors.password}>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newUserPassword}
                  onChange={(e) => {
                    setNewUserPassword(e.target.value);
                    clearError("password");
                  }}
                />
              </FormField>
              <FormField label="Assign Role">
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User - Basic access</SelectItem>
                    <SelectItem value="content_writer">Content Writer - Create content</SelectItem>
                    <SelectItem value="content_manager">Content Manager - Manage content</SelectItem>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <Button className="w-full" onClick={createUser} disabled={creating}>
                {creating ? "Creating..." : "Create User"}
              </Button>
            </TabsContent>
            
            <TabsContent value="invite" className="space-y-4 mt-4">
              <FormField label="Email Address" required error={errors.email}>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => {
                    setNewUserEmail(e.target.value);
                    clearError("email");
                  }}
                />
              </FormField>
              <FormField label="Intended Role (assign after signup)">
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content_writer">Content Writer</SelectItem>
                    <SelectItem value="content_manager">Content Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                <p className="font-medium mb-1">How it works:</p>
                <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Click "Copy Invite Link"</li>
                  <li>Share the link with the user</li>
                  <li>They sign up using the link</li>
                  <li>Come back here to assign their role</li>
                </ol>
              </div>
              <Button className="w-full" onClick={sendInvite}>
                <Send className="w-4 h-4 mr-1" /> Copy Invite Link
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
