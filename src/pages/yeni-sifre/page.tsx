
import { Link } from 'react-router-dom';

export default function YeniSifrePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl mb-4 shadow-lg">
          <i className="ri-lock-unlock-line text-4xl text-white"></i>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Şifre Belirle</h1>
        <p className="text-gray-600 mb-8">Bu özellik şu anda devre dışıdır.</p>

        <Link
          to="/login"
          className="inline-block px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium"
        >
          Giriş Sayfasına Dön
        </Link>
      </div>
    </div>
  );
}
