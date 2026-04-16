import { Link } from "react-router-dom";
import BrandingDisplay from "@/components/layout/BrandingDisplay";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-6 max-w-sm">
        <div className="flex justify-center mb-8">
          <BrandingDisplay variant="auth" />
        </div>
        <div className="text-6xl font-display font-bold text-muted-foreground/30 mb-4">404</div>
        <h1 className="text-xl font-semibold mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild>
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
