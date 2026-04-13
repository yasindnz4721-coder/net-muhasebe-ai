import { query } from './server/db.js';

async function listAll() {
    try {
        console.log('--- Kayıt Listesi ---');

        const pRes = await query("SELECT ad_soyad FROM personeller");
        console.log('Personeller:', pRes.rows.map(r => r.ad_soyad));

        const cRes = await query("SELECT ad FROM cariler");
        console.log('Cariler:', cRes.rows.map(r => r.ad));

        const uRes = await query("SELECT email FROM users");
        console.log('Users:', uRes.rows.map(r => r.email));

    } catch (error) {
        console.error('Sorgu hatası:', error);
    } finally {
        process.exit();
    }
}

listAll();
