import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin as adminApi, User } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import ProfileSelector from '../../components/feature/ProfileSelector';

interface AdminUser extends User {
    company_name?: string;
}

export default function AdminPanel() {
    const { isAdmin } = useProfile();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isAdmin) {
            loadData();
        }
    }, [isAdmin]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, statsRes] = await Promise.all([
                adminApi.getUsers(),
                adminApi.getStats()
            ]);
            setUsers(usersRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Admin verileri yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-lock-line text-4xl text-red-600"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Erişim Engellendi</h2>
                    <p className="text-slate-600 mb-6">Bu sayfayı görüntülemek için yönetici yetkiniz olması gerekir.</p>
                    <Link to="/" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        Dashboard'a Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/">
                                <img
                                    src="https://public.readdy.ai/ai/img_res/599009ac-e967-4692-9000-451db39762de.png"
                                    alt="Logo"
                                    className="h-10 w-auto object-contain cursor-pointer"
                                />
                            </Link>
                            <div className="h-8 w-px bg-slate-300"></div>
                            <h1 className="text-xl font-bold text-slate-800">Admin Paneli - Kullanıcı Takibi</h1>
                        </div>
                        <ProfileSelector />
                    </div>
                </div>
            </header>

            <div className="flex">
                <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
                    <nav className="p-4 space-y-1">
                        <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
                            <i className="ri-dashboard-line text-xl"></i>
                            <span className="font-medium whitespace-nowrap">Dashboard</span>
                        </Link>
                        <div className="pt-4 pb-2 px-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Yönetim</p>
                        </div>
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200 transition-all cursor-pointer">
                            <i className="ri-user-settings-line text-xl"></i>
                            <span className="font-medium whitespace-nowrap">Kullanıcı Takibi</span>
                        </Link>
                    </nav>
                </aside>

                <main className="flex-1 p-8">
                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                <p className="text-sm font-medium text-slate-600 mb-1">Toplam Kullanıcı</p>
                                <h3 className="text-3xl font-bold text-slate-800">{stats.users}</h3>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                <p className="text-sm font-medium text-slate-600 mb-1">Toplam Şirket/Profil</p>
                                <h3 className="text-3xl font-bold text-slate-800">{stats.profiles}</h3>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                <p className="text-sm font-medium text-slate-600 mb-1">Toplam Fatura</p>
                                <h3 className="text-3xl font-bold text-slate-800">{stats.totalInvoices}</h3>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Sistemdeki Kullanıcılar</h2>
                            <div className="relative w-72">
                                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input
                                    type="text"
                                    placeholder="E-posta veya Şirket ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <i className="ri-loader-4-line text-4xl text-indigo-500 animate-spin"></i>
                                <p className="mt-2 text-slate-600">Veriler çekiliyor...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Kullanıcı</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Aktif Şirket</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rol</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Kayıt Tarihi</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Plan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-slate-800">{user.email}</div>
                                                    <div className="text-xs text-slate-500">{user.id}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-slate-600 font-medium">
                                                        {user.company_name || <span className="text-slate-400 italic">Henüz yok</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.subscription_tier === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {user.subscription_tier === 'pro' ? 'PRO' : 'FREE'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
