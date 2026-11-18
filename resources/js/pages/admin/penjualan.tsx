import { Card, MasaPremium, StatusBadge, formatRupiah, formatTanggal } from '@/components/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

type Pengguna = {
    id: number;
    name: string;
    email: string;
    premium_aktif: boolean;
    premium_until: string | null;
};

type Paket = { id: number; nama: string; durasi_bulan: number; harga: number };

type TransaksiTerbaru = {
    id: number;
    user: string | null;
    paket: string;
    jumlah: number;
    dibayar_pada: string | null;
};

type Props = {
    pakets: Paket[];
    terpilih: Pengguna | null;
    hasil: Pengguna[];
    transaksi_terbaru: TransaksiTerbaru[];
};

export default function Penjualan({ pakets, terpilih: terpilihDariServer, hasil, transaksi_terbaru }: Props) {
    const [terpilih, setTerpilih] = useState<Pengguna | null>(terpilihDariServer);
    const [cari, setCari] = useState('');

    const form = useForm({
        paket_id: pakets[0]?.id ?? 0,
        jumlah: String(pakets[0]?.harga ?? 0),
        catatan: '',
    });

    // Sinkron setelah halaman dimuat ulang (misalnya setelah pembayaran tersimpan)
    useEffect(() => {
        setTerpilih(terpilihDariServer);
    }, [terpilihDariServer]);

    // Cari pengguna ke server (hanya mengambil data "hasil", halaman tidak dimuat ulang)
    useEffect(() => {
        if (cari.trim().length < 2) return;

        const timer = setTimeout(() => {
            router.get(
                '/admin/penjualan',
                { cari: cari.trim() },
                { only: ['hasil'], preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [cari]);

    const pilihPaket = (p: Paket) => {
        form.setData((data) => ({ ...data, paket_id: p.id, jumlah: String(p.harga) }));
    };

    const paketDipilih = pakets.find((p) => p.id === form.data.paket_id);

    const kirim = (e: FormEvent) => {
        e.preventDefault();
        if (!terpilih || !paketDipilih) return;

        const pesan = `Aktifkan ${paketDipilih.nama} untuk ${terpilih.name} dan catat pembayaran ${formatRupiah(Number(form.data.jumlah) || 0)}?`;
        if (!window.confirm(pesan)) return;

        form.transform((data) => ({ ...data, user_id: terpilih.id }));
        form.post('/admin/penjualan', {
            preserveScroll: true,
            onSuccess: () => {
                form.setData('catatan', '');
                setCari('');
            },
        });
    };

    // WhatsApp Web memblokir iframe, jadi dibuka di jendela terpisah di sisi kiri layar
    const bukaWhatsApp = () => {
        const layar = window.screen as Screen & { availLeft?: number; availTop?: number };
        const lebar = Math.round(layar.availWidth * 0.6);
        const tinggi = layar.availHeight;
        const kiri = layar.availLeft ?? 0;
        const atas = layar.availTop ?? 0;

        const jendela = window.open(
            'https://web.whatsapp.com',
            'whatsapp-web',
            `popup=yes,width=${lebar},height=${tinggi},left=${kiri},top=${atas}`,
        );

        if (!jendela) {
            window.alert('Popup diblokir browser. Izinkan popup untuk situs ini, lalu coba lagi.');
            return;
        }
        jendela.focus();
    };

    const errorUser = (form.errors as Record<string, string | undefined>).user_id;

    return (
        <AdminLayout title="Penjualan">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-[#3A1B14]">Penjualan</h1>
                <p className="text-sm text-[#9E5A50]">
                    Lihat bukti pembayaran di WhatsApp, lalu aktifkan premium pelanggan dari sini.
                </p>
            </div>

            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6">
                {/* WhatsApp Web */}
                <Card className="p-5">
                    <h2 className="text-base font-bold text-[#3A1B14]">1. WhatsApp Web</h2>
                    <p className="mt-2 text-sm text-[#3A1B14]">
                        WhatsApp tidak mengizinkan webnya ditampilkan di dalam halaman lain, jadi WhatsApp Web dibuka di
                        jendela terpisah yang menempati sisi kiri layar. Panel ini tetap di sisi kanan.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={bukaWhatsApp}
                            className="rounded-xl bg-[#3A1B14] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2C1810]"
                        >
                            Buka WhatsApp Web di sisi kiri
                        </button>
                        <p className="text-xs text-[#9E5A50]">
                            Lalu tekan <span className="font-bold">Win + →</span> pada jendela panel ini agar menempel di
                            sisi kanan.
                        </p>
                    </div>
                </Card>

                {/* Aktivasi */}
                <Card className="p-5">
                    <h2 className="text-base font-bold text-[#3A1B14]">2. Aktifkan Premium</h2>

                    <form onSubmit={kirim} className="mt-4 space-y-5">
                        {/* Pilih pengguna */}
                        <div>
                            <label className="text-sm font-semibold text-[#3A1B14]">Pengguna</label>

                            {terpilih ? (
                                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-[#FFD5CC] bg-[#FFF3F0] p-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-[#3A1B14]">{terpilih.name}</p>
                                        <p className="truncate text-xs text-[#9E5A50]">{terpilih.email}</p>
                                        <p className="mt-1 text-xs text-[#3A1B14]">
                                            {terpilih.premium_aktif ? (
                                                <>
                                                    Premium <MasaPremium premiumUntil={terpilih.premium_until} />. Paket baru menambah
                                                    masa aktif dari tanggal itu.
                                                </>
                                            ) : (
                                                'Akun biasa.'
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <StatusBadge premium={terpilih.premium_aktif} />
                                        <button
                                            type="button"
                                            onClick={() => setTerpilih(null)}
                                            className="rounded-lg border border-[#FFD5CC] bg-white px-3 py-1.5 text-xs font-semibold text-[#3A1B14] hover:bg-white/70"
                                        >
                                            Ganti
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={cari}
                                        onChange={(e) => setCari(e.target.value)}
                                        placeholder="Ketik nama atau email pengguna..."
                                        className="mt-2 w-full rounded-xl border border-[#FFD5CC] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FC4524] focus:ring-2 focus:ring-[#FC4524]/20"
                                    />
                                    {cari.trim().length >= 2 && (
                                        <ul className="mt-2 divide-y divide-[#FFD5CC] overflow-hidden rounded-xl border border-[#FFD5CC] bg-white">
                                            {hasil.length === 0 && (
                                                <li className="px-4 py-3 text-sm text-[#9E5A50]">Tidak ada yang cocok.</li>
                                            )}
                                            {hasil.map((u) => (
                                                <li key={u.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setTerpilih(u);
                                                            setCari('');
                                                        }}
                                                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#FFF3F0]"
                                                    >
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-semibold text-[#3A1B14]">
                                                                {u.name}
                                                            </span>
                                                            <span className="block truncate text-xs text-[#9E5A50]">{u.email}</span>
                                                        </span>
                                                        <StatusBadge premium={u.premium_aktif} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                            {errorUser && <p className="mt-2 text-sm text-red-600">{errorUser}</p>}
                        </div>

                        {/* Pilih paket */}
                        <div>
                            <label className="text-sm font-semibold text-[#3A1B14]">Paket</label>
                            {pakets.length === 0 ? (
                                <p className="mt-2 text-sm text-[#9E5A50]">
                                    Belum ada paket aktif. Aktifkan paket di halaman Keuangan.
                                </p>
                            ) : (
                                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {pakets.map((p) => (
                                        <button
                                            type="button"
                                            key={p.id}
                                            onClick={() => pilihPaket(p)}
                                            className={`rounded-xl border p-4 text-left ${
                                                form.data.paket_id === p.id
                                                    ? 'border-[#FC4524] bg-[#FFF3F0] ring-2 ring-[#FC4524]/20'
                                                    : 'border-[#FFD5CC] bg-white hover:bg-[#FFF3F0]'
                                            }`}
                                        >
                                            <p className="text-sm font-bold text-[#3A1B14]">{p.nama}</p>
                                            <p className="mt-1 text-xl font-extrabold text-[#FC4524]">{formatRupiah(p.harga)}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {form.errors.paket_id && <p className="mt-2 text-sm text-red-600">{form.errors.paket_id}</p>}
                        </div>

                        {/* Jumlah */}
                        <div>
                            <label htmlFor="jumlah" className="text-sm font-semibold text-[#3A1B14]">
                                Jumlah dibayar (Rp)
                            </label>
                            <input
                                id="jumlah"
                                type="number"
                                min={0}
                                step={1000}
                                value={form.data.jumlah}
                                onChange={(e) => form.setData('jumlah', e.target.value)}
                                className="mt-2 w-full rounded-xl border border-[#FFD5CC] px-4 py-2.5 text-sm outline-none focus:border-[#FC4524] focus:ring-2 focus:ring-[#FC4524]/20"
                            />
                            <p className="mt-1 text-xs text-[#9E5A50]">
                                Terisi otomatis sesuai harga paket. Ubah jika pelanggan mendapat diskon atau membayar berbeda.
                            </p>
                            {form.errors.jumlah && <p className="mt-1 text-sm text-red-600">{form.errors.jumlah}</p>}
                        </div>

                        {/* Catatan */}
                        <div>
                            <label htmlFor="catatan" className="text-sm font-semibold text-[#3A1B14]">
                                Catatan (opsional)
                            </label>
                            <input
                                id="catatan"
                                type="text"
                                value={form.data.catatan}
                                onChange={(e) => form.setData('catatan', e.target.value)}
                                placeholder="Misalnya: transfer BCA, bukti dikirim lewat WA"
                                className="mt-2 w-full rounded-xl border border-[#FFD5CC] px-4 py-2.5 text-sm outline-none focus:border-[#FC4524] focus:ring-2 focus:ring-[#FC4524]/20"
                            />
                            {form.errors.catatan && <p className="mt-1 text-sm text-red-600">{form.errors.catatan}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={form.processing || !terpilih || !paketDipilih}
                            className="w-full rounded-xl bg-[#FC4524] px-5 py-3 text-sm font-bold text-white hover:bg-[#e63c1d] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Aktifkan Premium dan Catat Pembayaran
                        </button>
                    </form>
                </Card>

                {/* Transaksi terbaru */}
                <Card className="p-5">
                    <h2 className="text-base font-bold text-[#3A1B14]">Transaksi terbaru</h2>
                    {transaksi_terbaru.length === 0 ? (
                        <p className="mt-3 text-sm text-[#9E5A50]">Belum ada transaksi.</p>
                    ) : (
                        <ul className="mt-3 divide-y divide-[#FFD5CC]">
                            {transaksi_terbaru.map((t) => (
                                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#3A1B14]">{t.user ?? '-'}</p>
                                        <p className="text-xs text-[#9E5A50]">{t.paket}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-bold text-[#3A1B14]">{formatRupiah(t.jumlah)}</p>
                                        <p className="text-xs text-[#9E5A50]">{formatTanggal(t.dibayar_pada)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
