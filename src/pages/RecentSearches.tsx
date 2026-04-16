import { Clock, X, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const RecentSearches = () => {
  const { user, loading: authLoading } = useAuth();
  const { searches, loading, removeSearch, clearAll } = useRecentSearches();

  if (authLoading) {
    return (
      <MobileLayout title="Recent Searches" showBack>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout title="Recent Searches" showBack>
        <div className="p-4 text-center py-12">
          <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-serif font-bold mb-2">Sign in Required</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to save and view your recent searches
          </p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Recent Searches" showBack>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-accent" />
            <h1 className="text-xl font-serif font-bold">Recent Searches</h1>
          </div>
          {searches.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={clearAll}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : searches.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No recent searches yet. Start exploring!
            </p>
            <Link to="/search">
              <Button variant="outline" className="mt-4">
                Search Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {searches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
              >
                <Link
                  to={`/search?q=${encodeURIComponent(search.search_query)}`}
                  className="flex-1"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{search.search_query}</span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                      {search.search_type}
                    </span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSearch(search.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default RecentSearches;
