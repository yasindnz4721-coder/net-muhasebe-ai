
import { useProfile } from '../../contexts/ProfileContext';

export default function ProfileSelector() {
  const { selectedProfile, loading } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200">
        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!selectedProfile) {
    return null;
  }

  return (
    <div className="px-4 py-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        {selectedProfile.logo_url ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
            <img
              src={selectedProfile.logo_url}
              alt={selectedProfile.name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="ri-building-line text-xl text-white"></i>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {selectedProfile.name}
          </p>
          <p className="text-xs text-gray-500">Aktif Profil</p>
        </div>
      </div>
    </div>
  );
}
