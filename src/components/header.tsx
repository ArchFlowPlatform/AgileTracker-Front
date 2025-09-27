import { AgileTrackerLogo } from './agile-tracker-logo';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/95 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            {/* Logo do Agile Tracker */}
            <div className="relative group">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-200 group-hover:shadow-xl transition-all duration-300">
                <AgileTrackerLogo size="md" />
              </div>
            </div>
            
            <p className="text-xs text-[#4A4A4A] font-medium tracking-wide mt-2">Proof of Concept</p>
          </div>
        </div>
      </div>
    </header>
  );
}
