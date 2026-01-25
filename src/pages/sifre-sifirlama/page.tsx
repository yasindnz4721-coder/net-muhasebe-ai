
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function SifreSifirlamaPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Backend API henüz şifre sıfırlama e-postası göndermeyi desteklemiyor.
    alert('Bu özellik şu anda bakım aşamasındadır. Lütfen sistem yöneticisi ile iletişime geçin.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl mb-4 shadow-lg">
            <i className="ri-lock-password-line text-4xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Şifre Sıfırlama</h1>
          <p className="text-gray-600">Bu özellik şu anda devre dışıdır.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="ri-mail-line text-gray-400"></i>
                </div>
                <input
                  type="email"
                  disabled
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-100 cursor-not-allowed"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="w-full py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium flex items-center justify-center gap-2"
                disabled
              >
                <i className="ri-mail-send-line text-xl"></i>
                Sıfırlama Linki Gönder
              </button>
              <Link
                to="/login"
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-center"
              >
                Giriş Sayfasına Dön
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
