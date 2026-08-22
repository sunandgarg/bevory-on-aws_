import { useState, useEffect } from "react";
import { Flag, Trash2, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ReportedReview {
  id: string;
  product_id: string | null;
  rating: number | null;
  content: string | null;
  reviewer_name: string | null;
  report_reason: string | null;
  reported_at: string | null;
  created_at: string;
  product?: { name: string; brand: string; slug: string | null } | null;
}

const AdminReports = () => {
  const [reports, setReports] = useState<ReportedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = async () => {
    const { data } = await apiClient
      .from("product_reviews")
      .select("*, product:products(name, brand, slug)")
      .eq("is_reported", true)
      .order("reported_at", { ascending: false });

    if (data) setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const dismissReport = async (id: string) => {
    const { error } = await apiClient
      .from("product_reviews")
      .update({ is_reported: false, report_reason: null, reported_at: null })
      .eq("id", id);

    if (!error) {
      toast({ title: "Report dismissed" });
      fetchReports();
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    const { error } = await apiClient.from("product_reviews").delete().eq("id", id);
    if (!error) {
      toast({ title: "Review deleted" });
      fetchReports();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-bold">Reported Reviews</h2>
          {reports.length > 0 && (
            <Badge className="bg-red-500/10 text-red-600">{reports.length}</Badge>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Reported Reviews</h3>
          <p className="text-muted-foreground">All clear! No reviews have been reported.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="p-4 rounded-lg bg-card border border-red-200 dark:border-red-900">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-500/10 text-red-600">
                      <Flag className="w-3 h-3 mr-1" /> Reported
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      by {report.reviewer_name || "Anonymous"}
                    </span>
                  </div>
                  
                  {report.product && (
                    <p className="text-sm font-medium mb-1">
                      On: {report.product.brand} {report.product.name}
                    </p>
                  )}
                  
                  {report.content && (
                    <p className="text-sm text-muted-foreground mb-2 p-2 rounded bg-secondary/50">
                      "{report.content}"
                    </p>
                  )}
                  
                  {report.report_reason && (
                    <div className="p-2 rounded bg-red-500/10 border border-red-200 dark:border-red-900">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        <strong>Report reason:</strong> {report.report_reason}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Reported: {report.reported_at ? new Date(report.reported_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                
                <div className="flex flex-col gap-1">
                  {report.product?.slug && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/product/${report.product?.slug}`, "_blank")}
                    >
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismissReport(report.id)}
                  >
                    <Check className="w-4 h-4 mr-1" /> Dismiss
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteReview(report.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
