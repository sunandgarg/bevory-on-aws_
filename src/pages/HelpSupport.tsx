import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  HelpCircle, 
  Mail, 
  AlertCircle, 
  Shield, 
  FileText,
  ChevronRight,
  ExternalLink,
  Phone
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";

interface HelpItem {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  link_url: string | null;
  link_type: string;
  order_index: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HelpCircle,
  Mail,
  AlertCircle,
  Shield,
  FileText,
  Phone,
};

const HelpSupport = () => {
  const [items, setItems] = useState<HelpItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from("help_support_items")
        .select("*")
        .eq("is_active", true)
        .order("order_index");
      
      if (data) setItems(data);
      setLoading(false);
    };
    fetchItems();
  }, []);

  const renderItem = (item: HelpItem) => {
    const IconComponent = iconMap[item.icon] || HelpCircle;
    const isExternal = item.link_type === "external";
    const isEmail = item.link_type === "email";
    const isPhone = item.link_type === "phone";

    const content = (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/30 transition-colors">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
        {isExternal ? (
          <ExternalLink className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
    );

    if (isEmail && item.link_url) {
      return (
        <a key={item.id} href={item.link_url}>
          {content}
        </a>
      );
    }

    if (isPhone && item.link_url) {
      return (
        <a key={item.id} href={`tel:${item.link_url}`}>
          {content}
        </a>
      );
    }

    if (isExternal && item.link_url) {
      return (
        <a key={item.id} href={item.link_url} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }

    if (item.link_url) {
      return (
        <Link key={item.id} to={item.link_url}>
          {content}
        </Link>
      );
    }

    return <div key={item.id}>{content}</div>;
  };

  return (
    <MobileLayout title="Help & Support" showBack>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-xl font-serif font-bold">Help & Support</h1>
            <p className="text-sm text-muted-foreground">How can we help you?</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No help items available</p>
          </div>
        ) : (
          <div className="space-y-3">{items.map(renderItem)}</div>
        )}

        <div className="mt-8 p-4 rounded-xl bg-secondary text-center">
          <p className="text-sm text-muted-foreground">
            Can't find what you're looking for?
          </p>
          <a
            href="mailto:support@bevory.com"
            className="text-accent font-medium text-sm hover:underline"
          >
            Contact us at support@bevory.com
          </a>
        </div>
      </div>
    </MobileLayout>
  );
};

export default HelpSupport;
