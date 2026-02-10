// API Client - PostgreSQL Backend ile iletişim
const API_URL = import.meta.env.VITE_API_URL || '';

// Token yönetimi
const getToken = () => localStorage.getItem('auth_token');
const setToken = (token: string) => localStorage.setItem('auth_token', token);
const removeToken = () => localStorage.removeItem('auth_token');

// Fetch wrapper
async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
    try {
        const token = getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.code === 'TRIAL_EXPIRED') {
                window.location.href = '/deneme-suresi-doldu';
            }
            return { data: null, error: data.error || 'Bir hata oluştu' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('API Error:', error);
        return { data: null, error: 'Sunucuya bağlanılamadı' };
    }
}

// Auth API
export const auth = {
    async login(email: string, password: string) {
        const result = await fetchApi<{ user: User; token: string }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (result.data?.token) {
            setToken(result.data.token);
        }

        return result;
    },

    async register(email: string, password: string, companyName?: string, paymentMethod?: string, subscription_tier?: string, isTrial?: boolean) {
        const result = await fetchApi<{ user: User; token: string }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, companyName, paymentMethod, subscription_tier, isTrial }),
        });

        if (result.data?.token) {
            setToken(result.data.token);
        }

        return result;
    },

    async getUser() {
        return fetchApi<{ user: User }>('/api/auth/user');
    },

    async updatePassword(password: string) {
        return fetchApi<{ message: string }>('/api/auth/update-password', {
            method: 'POST',
            body: JSON.stringify({ password }),
        });
    },

    async logout() {
        removeToken();
        return { data: { message: 'Çıkış başarılı' }, error: null };
    },

    isAuthenticated() {
        return !!getToken();
    },
};

// Profiles API
export const profiles = {
    async get() {
        return fetchApi<Profile>('/api/profiles');
    },

    async update(data: Partial<Profile>) {
        return fetchApi<Profile>('/api/profiles', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// Bildirimler API
export const bildirimler = {
    async getAll(profile_id: string) {
        return fetchApi<any[]>(`/api/bildirimler?profile_id=${profile_id}`);
    },

    async markAsRead(id: string) {
        return fetchApi<{ success: boolean }>(`/api/bildirimler/${id}/read`, {
            method: 'POST',
        });
    },

    async markAllAsRead(profile_id: string) {
        return fetchApi<{ success: boolean }>('/api/bildirimler/read-all', {
            method: 'POST',
            body: JSON.stringify({ profile_id }),
        });
    },
};

export const denetim = {
    async getAll(profile_id: string) {
        return fetchApi<any[]>(`/api/denetim?profile_id=${profile_id}`);
    },
};

export const giderler = {
    async getAll(profile_id: string) {
        return fetchApi<any[]>(`/api/giderler?profile_id=${profile_id}`);
    },
    async getKategoriler(profile_id: string) {
        return fetchApi<any[]>(`/api/giderler/kategoriler?profile_id=${profile_id}`);
    },
    async add(data: any) {
        return fetchApi<any>('/api/giderler', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    async delete(id: string) {
        return fetchApi<any>(`/api/giderler/${id}`, {
            method: 'DELETE',
        });
    },
};

// Cariler API
export const cariler = {
    async getAll(profile_id: string) {
        return fetchApi<Cari[]>(`/api/cariler?profile_id=${profile_id}`);
    },

    async getById(id: string) {
        return fetchApi<Cari>(`/api/cariler/${id}`);
    },

    async create(data: Omit<Cari, 'id' | 'created_at' | 'updated_at'>) {
        return fetchApi<Cari>('/api/cariler', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Cari>) {
        return fetchApi<Cari>(`/api/cariler/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return fetchApi<{ message: string; id: string }>(`/api/cariler/${id}`, {
            method: 'DELETE',
        });
    },
};

// Ürünler API
export const urunler = {
    async getAll(profile_id: string) {
        return fetchApi<Urun[]>(`/api/urunler?profile_id=${profile_id}`);
    },

    async getById(id: string) {
        return fetchApi<Urun>(`/api/urunler/${id}`);
    },

    async create(data: Omit<Urun, 'id' | 'created_at' | 'updated_at'>) {
        return fetchApi<Urun>('/api/urunler', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Urun>) {
        return fetchApi<Urun>(`/api/urunler/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return fetchApi<{ message: string; id: string }>(`/api/urunler/${id}`, {
            method: 'DELETE',
        });
    },
};

// Kategoriler API
export const kategoriler = {
    async getAll(profile_id: string) {
        return fetchApi<Kategori[]>(`/api/kategoriler?profile_id=${profile_id}`);
    },

    async create(data: { ad: string; profile_id: string }) {
        return fetchApi<Kategori>('/api/kategoriler', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return fetchApi<{ message: string; id: string }>(`/api/kategoriler/${id}`, {
            method: 'DELETE',
        });
    },
};

// Satış Faturaları API
export const satisFaturalari = {
    async getAll(profile_id: string) {
        return fetchApi<SatisFaturasi[]>(`/api/satis-faturalari?profile_id=${profile_id}`);
    },

    async create(data: Omit<SatisFaturasi, 'id' | 'created_at'>) {
        return fetchApi<SatisFaturasi>('/api/satis-faturalari', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<SatisFaturasi>) {
        return fetchApi<SatisFaturasi>(`/api/satis-faturalari/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return fetchApi<{ message: string; id: string }>(`/api/satis-faturalari/${id}`, {
            method: 'DELETE',
        });
    },
};

// Alış Faturaları API
export const alisFaturalari = {
    async getAll(profile_id: string) {
        return fetchApi<AlisFaturasi[]>(`/api/alis-faturalari?profile_id=${profile_id}`);
    },

    async create(data: Omit<AlisFaturasi, 'id' | 'created_at'>) {
        return fetchApi<AlisFaturasi>('/api/alis-faturalari', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<AlisFaturasi>) {
        return fetchApi<AlisFaturasi>(`/api/alis-faturalari/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return fetchApi<{ message: string; id: string }>(`/api/alis-faturalari/${id}`, {
            method: 'DELETE',
        });
    },
};

// Ödemeler API
export const odemeler = {
    async getAll(profile_id: string) {
        return fetchApi<Odeme[]>(`/api/odemeler?profile_id=${profile_id}`);
    },

    async create(data: Omit<Odeme, 'id' | 'created_at'>) {
        return fetchApi<Odeme>('/api/odemeler', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Odeme>) {
        return fetchApi<Odeme>(`/api/odemeler/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return fetchApi<{ message: string; id: string }>(`/api/odemeler/${id}`, {
            method: 'DELETE',
        });
    },
};

// Stok Hareketleri API
export const stokHareketleri = {
    async getAll(profile_id: string) {
        return fetchApi<StokHareketi[]>(`/api/stok?profile_id=${profile_id}`);
    },

    async create(data: Omit<StokHareketi, 'id' | 'created_at'>) {
        return fetchApi<StokHareketi>('/api/stok', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return fetchApi<{ message: string; id: string }>(`/api/stok/${id}`, {
            method: 'DELETE',
        });
    },
};

// Admin API
export const admin = {
    async getStats() {
        return fetchApi<any>('/api/admin/stats');
    },
    async getUsers() {
        return fetchApi<any[]>('/api/admin/users');
    },
    async createUser(data: { email: string; password: string; companyName?: string }) {
        return fetchApi<{ message: string; user: any }>('/api/admin/create-user', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    async approveUser(userId: string) {
        return fetchApi<{ message: string }>('/api/admin/approve-user', {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
    },
    async deleteUser(userId: string) {
        return fetchApi<{ message: string }>(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
    }
};

// Generic API for cases where specialized objects aren't available
export const api = {
    get: <T>(url: string) => fetchApi<T>(url),
    post: <T>(url: string, data: any) => fetchApi<T>(url, { method: 'POST', body: JSON.stringify(data) }),
    put: <T>(url: string, data: any) => fetchApi<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
    delete: <T>(url: string) => fetchApi<T>(url, { method: 'DELETE' }),
};

// Tip tanımlamaları
export interface User {
    id: string;
    email: string;
    role: string;
    subscription_tier?: string;
    is_approved?: boolean;
    payment_method?: string;
    trial_ends_at?: string;
    subscription_status?: string;
    created_at?: string;
}

export interface Profile {
    id: string;
    name: string;
    logo_url?: string;
    created_at?: string;
}

export interface Kasa {
    id: string;
    ad: string;
    bakiye: number;
    is_default: boolean;
    profile_id: string;
    created_at?: string;
    updated_at?: string;
}

export interface Cari {
    id: string;
    ad: string;
    telefon: string;
    email: string;
    adres: string;
    vergi_no: string;
    vergi_dairesi: string;
    profile_id?: string;
    created_at?: string;
    updated_at?: string;
    bakiye?: number;
}

export interface Kategori {
    id: string;
    ad: string;
    profile_id?: string;
    created_at?: string;
}

export interface Urun {
    id: string;
    ad: string;
    kategori_id: string;
    kategori?: string;
    birim: string;
    stok_miktari: number;
    satis_fiyati?: string | number;
    alis_fiyati?: string | number;
    profile_id?: string;
    created_at?: string;
    updated_at?: string;
    // New fields
    urun_tipi?: string;
    urun_cinsi?: string;
    urun_kodu?: string;
    urun_barkodu?: string;
    alis_kdv_dahil?: boolean;
    satis_kdv_dahil?: boolean;
    kdv_orani?: number;
    otv_orani?: number;
    oiv_orani?: number;
    stok_takibi?: boolean;
    stok_uyari_limiti?: number;
}

export interface SatisFaturasi {
    id: string;
    cari_id: string;
    cari_ad: string;
    fatura_no: string;
    tarih: string;
    tutar: number;
    kdv: number;
    toplam: number;
    durum: string;
    aciklama?: string;
    urunler?: any[];
    profile_id?: string;
    created_at?: string;
}

export interface AlisFaturasi {
    id: string;
    cari_id: string;
    cari_ad: string;
    fatura_no: string;
    tarih: string;
    tutar: number;
    kdv: number;
    toplam: number;
    durum: string;
    aciklama?: string;
    urunler?: any[];
    profile_id?: string;
    created_at?: string;
}

export interface Odeme {
    id: string;
    cari_id: string;
    cari_ad: string;
    tip: string;
    tutar: number;
    tarih: string;
    odeme_yontemi: string;
    aciklama?: string;
    profile_id?: string;
    created_at?: string;
}

export interface StokHareketi {
    id: string;
    urun_id: string;
    urun_ad: string;
    hareket_tipi: string;
    miktar: number;
    tarih: string;
    aciklama?: string;
    profile_id?: string;
    cari_id?: string;
    cari_ad?: string;
    created_at?: string;
}

// Personel API
export const personel = {
    async getAll(profile_id: string) {
        return fetchApi<Personel[]>(`/api/personel?profile_id=${profile_id}`);
    },

    async create(data: Partial<Personel>) {
        return fetchApi<Personel>('/api/personel', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<Personel>) {
        return fetchApi<Personel>(`/api/personel/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return fetchApi<{ message: string }>(`/api/personel/${id}`, {
            method: 'DELETE',
        });
    },

    async getPuantaj(id: string, yil: number, ay: number) {
        return fetchApi<PuantajRecord[]>(`/api/personel/${id}/puantaj?yil=${yil}&ay=${ay}`);
    },

    async savePuantaj(id: string, data: Partial<PuantajRecord>) {
        return fetchApi<PuantajRecord>(`/api/personel/${id}/puantaj`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getMaasOzeti(id: string, yil: number, ay: number) {
        return fetchApi<MaasOzeti>(`/api/personel/${id}/maas-ozeti?yil=${yil}&ay=${ay}`);
    },

    async getAvanslar(id: string, yil: number, ay: number) {
        return fetchApi<AvansRecord[]>(`/api/personel/${id}/avanslar?yil=${yil}&ay=${ay}`);
    },

    async saveAvans(id: string, data: Partial<AvansRecord>) {
        return fetchApi<AvansRecord>(`/api/personel/${id}/avanslar`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// Taksit API
export const taksitler = {
    async getAll(profile_id: string) {
        return fetchApi<TaksitPlan[]>(`/api/taksitler?profile_id=${profile_id}`);
    },

    async create(data: Partial<TaksitPlan>) {
        return fetchApi<TaksitPlan>('/api/taksitler', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getTakip(profile_id: string, yil?: number, ay?: number, upcoming?: boolean) {
        let url = `/api/taksitler/takip?profile_id=${profile_id}`;
        if (upcoming) url += `&upcoming=true`;
        else if (yil && ay) url += `&yil=${yil}&ay=${ay}`;
        return fetchApi<TaksitOdeme[]>(url);
    },

    async checkPayments(profile_id: string) {
        return fetchApi<{ message: string; count: number }>('/api/taksitler/check-payments', {
            method: 'POST',
            body: JSON.stringify({ profile_id }),
        });
    },

    async delete(id: string) {
        return fetchApi<{ message: string }>(`/api/taksitler/${id}`, {
            method: 'DELETE',
        });
    },
};

// Kasalar API
export const kasalar = {
    async getAll(profile_id: string) {
        return fetchApi<Kasa[]>(`/api/kasalar?profile_id=${profile_id}`);
    },

    async create(data: Partial<Kasa>) {
        return fetchApi<Kasa>('/api/kasalar', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

export interface TaksitPlan {
    id: string;
    cari_id?: string;
    cari_ad?: string;
    toplam_tutar: number;
    taksit_tutari: number;
    taksit_sayisi: number;
    odeme_gunu: number;
    baslangic_tarihi: string;
    aciklama?: string;
    durum: string;
    profile_id: string;
    created_at?: string;
}

export interface TaksitOdeme {
    id: string;
    taksit_id: string;
    vade_tarihi: string;
    tutar: number;
    durum: string;
    odeme_tarihi?: string;
    odeme_id?: string;
    cari_ad?: string;
    plan_aciklama?: string;
    profile_id: string;
}

export interface Personel {
    id: string;
    ad_soyad: string;
    unvan?: string;
    tckn?: string;
    telefon?: string;
    email?: string;
    adres?: string;
    ise_giris_tarihi?: string;
    maas: number | string;
    iban?: string;
    durum: string;
    profile_id?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PuantajRecord {
    id: string;
    personel_id: string;
    tarih: string;
    durum: string;
    notlar?: string;
    profile_id?: string;
}

export interface MaasOzeti {
    aylik_maas: number;
    eksik_gun: number;
    kesinti: number;
    toplam_avans: number;
    toplam_kesinti: number;
    odenecek_maas: number;
    yil: string;
    ay: string;
}

export interface AvansRecord {
    id: string;
    personel_id: string;
    tarih: string;
    tutar: number;
    aciklama?: string;
    profile_id?: string;
}
