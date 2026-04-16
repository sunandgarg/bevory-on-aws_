import { Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CsvButtonsProps {
  onExport: () => void;
  onImportClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const CsvButtons = ({
  onExport,
  onImportClick,
  fileInputRef,
  onFileChange,
  disabled,
}: CsvButtonsProps) => {
  return (
    <div className="flex gap-2">
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={onFileChange}
        className="hidden"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={onImportClick}
        disabled={disabled}
      >
        <Upload className="w-4 h-4 mr-1" /> Import CSV
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onExport}
        disabled={disabled}
      >
        <Download className="w-4 h-4 mr-1" /> Export CSV
      </Button>
    </div>
  );
};

export default CsvButtons;
