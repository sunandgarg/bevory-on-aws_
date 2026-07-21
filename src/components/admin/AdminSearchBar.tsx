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
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
        className="h-11 rounded-xl pl-11 text-base"
      />
    </div>
  );
};

export default AdminSearchBar;
