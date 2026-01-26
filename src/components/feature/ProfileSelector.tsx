
import { useProfile } from '../../contexts/ProfileContext';

export default function ProfileSelector() {
  const { selectedProfile, loading } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center gap-4 px-5 py-3 bg-white/5 rounded-2xl border border-white/5 animate-pulse">
        <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded w-20"></div>
          <div className="h-2 bg-white/10 rounded w-12"></div>
        </div>
      </div>
    );
  }

  if (!selectedProfile) return null;

  return (
    <div className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 group cursor-default shadow-lg shadow-black/20">
      <div className="flex items-center gap-3">
        {selectedProfile.logo_url ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white shadow-inner">
            <img
              src={selectedProfile.logo_url}
              alt={selectedProfile.name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <i className="ri-building-2-line text-lg text-white"></i>
          </div>
        )}
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Şirket Profili</p>
          <p className="text-sm font-bold text-white truncate tracking-tight">
            {selectedProfile.name}
          </p>
        </div>
      </div>
    </div>
  );
}
