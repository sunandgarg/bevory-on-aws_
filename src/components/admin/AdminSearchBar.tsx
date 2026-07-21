import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AdminSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const AdminSearchBar = ({ value, onChange, placeholder = "Search..." }: AdminSearchBarProps) => {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
        className="h-10 rounded-lg pl-9 text-sm"
      />
    </div>
  );
};

export default AdminSearchBar;
