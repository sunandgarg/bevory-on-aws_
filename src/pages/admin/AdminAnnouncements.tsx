import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Send, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import FormField from "@/components/admin/FormField";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  message: string;
  notification_channel: string;
  is_active: boolean;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const fetchAnnouncements = async () => {
    const { data } = await apiClient
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSave = async () => {
    if (!editItem) return;

    const toSave = {
      title: editItem.title,
      message: editItem.message,
      notification_channel: editItem.notification_channel,
      is_active: editItem.is_active,
      scheduled_at: editItem.scheduled_at || null,
    };

    let error;
    if (editItem.id) {
      const result = await apiClient.from("announcements").update(toSave).eq("id", editItem.id);
      error = result.error;
    } else {
      const result = await apiClient.from("announcements").insert(toSave);
      error = result.error;
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Announcement saved!" });
      setShowDialog(false);
      setEditItem(null);
      fetchAnnouncements();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await apiClient.from("announcements").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchAnnouncements();
  };

  const handleSendNow = async (announcement: Announcement) => {
    if (!confirm("Send this announcement to all users now?")) return;

    // Get all user IDs
    const { data: profiles } = await apiClient.from("profiles").select("id");
    if (!profiles || profiles.length === 0) {
      toast({ title: "No users to notify", variant: "destructive" });
      return;
    }

    // Create notifications for each user
    const notifications = profiles.map((p) => ({
      user_id: p.id,
      title: announcement.title,
      message: announcement.message,
      type: "announcement",
      notification_channel: announcement.notification_channel,
    }));

    const { error } = await apiClient.from("notifications").insert(notifications);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Mark as sent
    await apiClient
      .from("announcements")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", announcement.id);

    toast({ title: "Success", description: `Sent to ${profiles.length} users!` });
    fetchAnnouncements();
  };

  const newItem: Announcement = {
    id: "",
    title: "",
    message: "",
    notification_channel: "app",
    is_active: true,
    scheduled_at: null,
    sent_at: null,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Announcements</h2>
        <Button size="sm" onClick={() => { setEditItem(newItem); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Announcement
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-2">📢 How Announcements Work</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Create announcements and choose the notification channel (App, Mobile, or Both)</li>
          <li>• Click "Send Now" to push notifications to all users</li>
          <li>• Users will see notifications in their Notifications page</li>
        </ul>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{a.title}</p>
                  <Badge variant={a.notification_channel === "mobile" ? "secondary" : "outline"}>
                    {a.notification_channel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{a.message}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  {a.sent_at ? (
                    <span className="text-green-600">✓ Sent {format(new Date(a.sent_at), "MMM d, h:mm a")}</span>
                  ) : a.scheduled_at ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Scheduled: {format(new Date(a.scheduled_at), "MMM d, h:mm a")}
                    </span>
                  ) : (
                    <span>Draft</span>
                  )}
                </div>
              </div>
              {!a.sent_at && (
                <Button size="sm" variant="outline" onClick={() => handleSendNow(a)}>
                  <Send className="w-4 h-4 mr-1" /> Send Now
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => { setEditItem(a); setShowDialog(true); }}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(a.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No announcements yet. Create your first one!
            </div>
          )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Edit" : "New"} Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Title" required>
              <Input
                placeholder="Announcement title"
                value={editItem?.title || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, title: e.target.value } : p))}
              />
            </FormField>
            <FormField label="Message" required>
              <Textarea
                placeholder="Announcement message..."
                value={editItem?.message || ""}
                rows={4}
                onChange={(e) => setEditItem((p) => (p ? { ...p, message: e.target.value } : p))}
              />
            </FormField>
            <FormField label="Notification Channel">
              <Select
                value={editItem?.notification_channel || "app"}
                onValueChange={(v) => setEditItem((p) => (p ? { ...p, notification_channel: v } : p))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="app">App/Website Only</SelectItem>
                  <SelectItem value="mobile">Mobile Push Only</SelectItem>
                  <SelectItem value="both">Both App & Mobile</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active</span>
              <Switch
                checked={editItem?.is_active || false}
                onCheckedChange={(v) => setEditItem((p) => (p ? { ...p, is_active: v } : p))}
              />
            </div>
            <Button className="w-full" onClick={handleSave}>
              Save Announcement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;
