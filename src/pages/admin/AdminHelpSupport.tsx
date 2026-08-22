import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import FormField from "@/components/admin/FormField";

interface HelpItem {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  link_url: string | null;
  link_type: string;
  order_index: number;
  is_active: boolean;
}

const ICONS = [
  "HelpCircle",
  "Mail",
  "AlertCircle",
  "Shield",
  "FileText",
  "Phone",
  "MessageCircle",
  "Book",
  "Settings",
  "Info",
];

const LINK_TYPES = [
  { value: "internal", label: "Internal Link (within app)" },
  { value: "external", label: "External URL" },
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" },
];

const AdminHelpSupport = () => {
  const [items, setItems] = useState<HelpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<HelpItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    const { data } = await apiClient
      .from("help_support_items")
      .select("*")
      .order("order_index");
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSave = async () => {
    if (!editItem) return;

    const toSave = {
      title: editItem.title,
      description: editItem.description || null,
      icon: editItem.icon,
      link_url: editItem.link_url || null,
      link_type: editItem.link_type,
      order_index: editItem.order_index,
      is_active: editItem.is_active,
    };

    let error;
    if (editItem.id) {
      const result = await apiClient.from("help_support_items").update(toSave).eq("id", editItem.id);
      error = result.error;
    } else {
      const result = await apiClient.from("help_support_items").insert(toSave);
      error = result.error;
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Help item saved!" });
      setShowDialog(false);
      setEditItem(null);
      fetchItems();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this help item?")) return;
    await apiClient.from("help_support_items").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchItems();
  };

  const newItem: HelpItem = {
    id: "",
    title: "",
    description: "",
    icon: "HelpCircle",
    link_url: "",
    link_type: "internal",
    order_index: items.length + 1,
    is_active: true,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Help & Support Items</h2>
        <Button size="sm" onClick={() => { setEditItem(newItem); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-2">ℹ️ About Help & Support</h3>
        <p className="text-sm text-muted-foreground">
          These items appear on the Help & Support page for all users. You can add FAQs, contact options, policies, and more.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-sm">
                {item.icon.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{item.title}</p>
                  {!item.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {item.description || item.link_url}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{item.link_type}</span>
              <Button size="icon" variant="ghost" onClick={() => { setEditItem(item); setShowDialog(true); }}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No help items yet. Add your first one!
            </div>
          )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Edit" : "Add"} Help Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Title" required>
              <Input
                placeholder="e.g., FAQs, Contact Us"
                value={editItem?.title || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, title: e.target.value } : p))}
              />
            </FormField>
            <FormField label="Description">
              <Input
                placeholder="Short description"
                value={editItem?.description || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, description: e.target.value } : p))}
              />
            </FormField>
            <FormField label="Icon">
              <Select
                value={editItem?.icon || "HelpCircle"}
                onValueChange={(v) => setEditItem((p) => (p ? { ...p, icon: v } : p))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Link Type">
              <Select
                value={editItem?.link_type || "internal"}
                onValueChange={(v) => setEditItem((p) => (p ? { ...p, link_type: v } : p))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Link URL">
              <Input
                placeholder={
                  editItem?.link_type === "email"
                    ? "mailto:support@example.com"
                    : editItem?.link_type === "phone"
                    ? "+1234567890"
                    : "/help/faq"
                }
                value={editItem?.link_url || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, link_url: e.target.value } : p))}
              />
            </FormField>
            <FormField label="Order Index">
              <Input
                type="number"
                value={editItem?.order_index || 0}
                onChange={(e) =>
                  setEditItem((p) => (p ? { ...p, order_index: parseInt(e.target.value) || 0 } : p))
                }
              />
            </FormField>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active (visible to users)</span>
              <Switch
                checked={editItem?.is_active || false}
                onCheckedChange={(v) => setEditItem((p) => (p ? { ...p, is_active: v } : p))}
              />
            </div>
            <Button className="w-full" onClick={handleSave}>
              Save Help Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHelpSupport;
