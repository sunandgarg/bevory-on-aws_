import { memo, ReactNode, lazy, Suspense } from "react";
import MobileHeader from "./MobileHeader";
import BottomNav from "./BottomNav";
import UniversalSearch from "@/components/UniversalSearch";

const CheersGuide = lazy(() => import("@/components/CheersGuide"));

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showLocation?: boolean;
  showBack?: boolean;
  showBottomNav?: boolean;
  showSearch?: boolean;
  showCheersGuide?: boolean;
}

const MobileLayout = memo(({
  children,
  title,
  showHeader = true,
  showLocation = true,
  showBack = false,
  showBottomNav = true,
  showSearch = true,
  showCheersGuide = true,
}: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      {showHeader && (
        <MobileHeader
          title={title}
          showLocation={showLocation}
          showBack={showBack}
        />
      )}
      
      {showSearch && (
        <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-xl px-4 py-2 border-b border-border/50">
          <UniversalSearch />
        </div>
      )}
      
      {showCheersGuide && (
        <div className="bg-background py-2.5">
          <Suspense fallback={<div className="h-20" />}>
            <CheersGuide />
          </Suspense>
        </div>
      )}
      
      <main className={showBottomNav ? "pb-16" : ""}>
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
});

MobileLayout.displayName = "MobileLayout";
export default MobileLayout;
