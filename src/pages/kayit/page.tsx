import { useState } from 'react';
import { auth, profiles } from '../../lib/api';

export default function KayitPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data, error: registerError } = await auth.register(
        formData.email.trim(),
        formData.password,
        formData.companyName.trim()
      );

      if (registerError) {
        setError(registerError);
        return;
      }

      if (data?.user) {
        // Başarılı - token zaten kaydedildi
        setSuccess('✅ Kullanıcı başarıyla oluşturuldu! E-posta: ' + formData.email);
        setFormData({
          email: '',
          password: '',
          companyName: '',
        });
      }
    } catch (err) {
      console.error('Kayıt hatası:', err);
      setError('Beklenmeyen bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Başlık */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl mb-4 shadow-lg">
            <i className="ri-user-add-line text-4xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Kullanıcı Oluştur</h1>
          <p className="text-gray-600">Admin Paneli</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hata Mesajı */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <i className="ri-error-warning-line text-xl text-red-600 mt-0.5"></i>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Başarı Mesajı */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <i className="ri-checkbox-circle-line text-xl text-green-600 mt-0.5"></i>
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* E-posta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi (Ortak kullanım için virgülle ayırın) *
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="ornek1@email.com, ornek2@email.com"
              />
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre *
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Minimum 6 karakter"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Bu şifreyi kullanıcıya vereceksiniz. Minimum 6 karakter olmalıdır.
              </p>
            </div>

            {/* Şirket Adı (Opsiyonel) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şirket/Kullanıcı Adı (Opsiyonel)
              </label>
              <input
                type="text"
                disabled={loading}
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Boş bırakılırsa e-posta kullanılır"
              />
            </div>

            {/* Butonlar */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                disabled={loading}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <i className="ri-user-add-line text-xl"></i>
                    Kullanıcı Oluştur
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Uyarı */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-xl text-yellow-600 mt-0.5"></i>
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Önemli:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>E-posta ve şifreyi kullanıcıya iletmeyi unutmayın</li>
                <li>Kullanıcı bu bilgilerle giriş yapabilecek</li>
                <li>Şirket adı sonradan profil ayarlarından değiştirilebilir</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
