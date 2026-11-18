import { Card, Pagination, Paginator, StatCard, formatRupiah } from '@/components/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { LaporanData, unduhLaporanExcel } from '@/lib/laporan-keuangan';
import { Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type Paket = { id: number; nama: string; durasi_bulan: number; harga: number; aktif: boolean };

type Baris = {
    id: number;
    user_id: number | null;
    user: string | null;
    email: string | null;
    durasi_bulan: number;
    jumlah: number;
    tanggal: string | null;
    waktu: string | null;
    berakhir: string | null;
    catatan: string | null;
};

type Harian = { tanggal: string; jumlah_transaksi: number; pendapatan: number };

type Props = {
    periode: { dari: string; sampai: string };
    stats: { pendapatan: number; jumlah_transaksi: number; rata_rata: number; total: number };
    harian: Harian[];
    transaksi: Paginator<Baris>;
    pakets: Paket[];
};

const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// 'YYYY-MM-DD' -> '27 Okt 2026' (tanpa konversi zona waktu)
function tanggalPendek(ymd: string | null): string {
    if (!ymd) return '-';
    const [y, m, d] = ymd.split('-').map(Number);
    return `${d} ${BULAN_PENDEK[m - 1]} ${y}`;
}

function namaHari(ymd: string): string {
    const [y, m, d] = ymd.split('-').map(Number);
    return NAMA_HARI[new Date(y, m - 1, d).getDay()];
}

const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const PRESET: { label: string; rentang: () => [string, string] }[] = [
    {
        label: 'Hari ini',
        rentang: () => {
            const t = new Date();
            return [ymd(t), ymd(t)];
        },
    },
    {
        label: '7 hari terakhir',
        rentang: () => {
            const t = new Date();
            const s = new Date();
            s.setDate(t.getDate() - 6);
            return [ymd(s), ymd(t)];
        },
    },
    {
        label: 'Bulan ini',
        rentang: () => {
            const t = new Date();
            return [ymd(new Date(t.getFullYear(), t.getMonth(), 1)), ymd(new Date(t.getFullYear(), t.getMonth() + 1, 0))];
        },
    },
    {
        label: 'Bulan lalu',
        rentang: () => {
            const t = new Date();
            return [ymd(new Date(t.getFullYear(), t.getMonth() - 1, 1)), ymd(new Date(t.getFullYear(), t.getMonth(), 0))];
        },
    },
];

function PaketRow({ paket }: { paket: Paket }) {
    const form = useForm({ harga: String(paket.harga), aktif: paket.aktif });

    const simpan = (e: FormEvent) => {
        e.preventDefault();
        form.patch(`/admin/paket/${paket.id}`, { preserveScroll: true });
    };

    return (
        <form onSubmit={simpan} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-end">
            <div className="sm:w-48">
                <p className="text-sm font-bold text-[#3A1B14]">{paket.nama}</p>
                <p className="text-xs text-[#9E5A50]">{paket.durasi_bulan} bulan</p>
            </div>

            <div className="flex-1">
                <label htmlFor={`harga-${paket.id}`} className="text-xs font-semibold text-[#9E5A50]">
                    Harga (Rp)
                </label>
                <input
                    id={`harga-${paket.id}`}
                    type="number"
                    min={0}
                    step={1000}
                    value={form.data.harga}
                    onChange={(e) => form.setData('harga', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#FFD5CC] px-4 py-2.5 text-sm outline-none focus:border-[#FC4524] focus:ring-2 focus:ring-[#FC4524]/20"
                />
                {form.errors.harga && <p className="mt-1 text-xs text-red-600">{form.errors.harga}</p>}
            </div>

            <label className="flex items-center gap-2 pb-2.5 text-sm text-[#3A1B14]">
                <input
                    type="checkbox"
                    checked={form.data.aktif}
                    onChange={(e) => form.setData('aktif', e.target.checked)}
                    className="h-4 w-4 accent-[#FC4524]"
                />
                Dijual
            </label>

            <button
                type="submit"
                disabled={form.processing}
                className="rounded-xl bg-[#3A1B14] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2C1810] disabled:opacity-60"
            >
                Simpan
            </button>
        </form>
    );
}

export default function Keuangan({ periode, stats, harian, transaksi, pakets }: Props) {
    const [dari, setDari] = useState(periode.dari);
    const [sampai, setSampai] = useState(periode.sampai);
    const [mengunduh, setMengunduh] = useState(false);
    const [galat, setGalat] = useState<string | null>(null);

    const terapkan = (nextDari: string, nextSampai: string) => {
        setDari(nextDari);
        setSampai(nextSampai);
        router.get('/admin/keuangan', { dari: nextDari, sampai: nextSampai }, { preserveState: true, replace: true });
    };

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (dari && sampai) terapkan(dari, sampai);
    };

    // Mengunduh laporan untuk periode yang sedang ditampilkan
    const unduhExcel = async () => {
        setMengunduh(true);
        setGalat(null);

        try {
            const res = await fetch(
                `/admin/keuangan/ekspor?dari=${encodeURIComponent(periode.dari)}&sampai=${encodeURIComponent(periode.sampai)}`,
                { headers: { Accept: 'application/json' }, credentials: 'same-origin' },
            );

            if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
                throw new Error('Data laporan tidak bisa dimuat. Muat ulang halaman (sesi mungkin berakhir), lalu coba lagi.');
            }

            const data: LaporanData = await res.json();
            await unduhLaporanExcel(data);
        } catch (e) {
            setGalat(e instanceof Error ? e.message : 'Gagal membuat berkas Excel.');
        } finally {
            setMengunduh(false);
        }
    };

    const teksPeriode =
        periode.dari === periode.sampai
            ? tanggalPendek(periode.dari)
            : `${tanggalPendek(periode.dari)} - ${tanggalPendek(periode.sampai)}`;

    return (
        <AdminLayout title="Keuangan">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-[#3A1B14]">Keuangan</h1>
                <p className="text-sm text-[#9E5A50]">Pendapatan dari langganan premium, per tanggal dan per transaksi.</p>
            </div>

            {/* Filter periode dan unduh */}
            <Card className="p-4">
                <form onSubmit={onSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div>
                        <label htmlFor="dari" className="text-xs font-semibold text-[#9E5A50]">
                            Dari tanggal
                        </label>
                        <input
                            id="dari"
                            type="date"
                            value={dari}
                            onChange={(e) => setDari(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[#FFD5CC] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FC4524]"
                        />
                    </div>
                    <div>
                        <label htmlFor="sampai" className="text-xs font-semibold text-[#9E5A50]">
                            Sampai tanggal
                        </label>
                        <input
                            id="sampai"
                            type="date"
                            value={sampai}
                            onChange={(e) => setSampai(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[#FFD5CC] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FC4524]"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded-xl bg-[#FC4524] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#e63c1d]"
                    >
                        Tampilkan
                    </button>
                    <button
                        type="button"
                        onClick={unduhExcel}
                        disabled={mengunduh}
                        className="rounded-xl bg-[#1D6F42] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#185a37] disabled:opacity-60 lg:ml-auto"
                    >
                        {mengunduh ? 'Menyiapkan...' : 'Unduh Excel'}
                    </button>
                </form>

                <div className="mt-3 flex flex-wrap gap-2">
                    {PRESET.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            onClick={() => {
                                const [a, b] = p.rentang();
                                terapkan(a, b);
                            }}
                            className="rounded-lg border border-[#FFD5CC] px-3 py-1.5 text-xs font-semibold text-[#3A1B14] hover:bg-[#FFF3F0]"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <p className="mt-3 text-xs text-[#9E5A50]">
                    Periode yang tampil: <span className="font-semibold text-[#3A1B14]">{teksPeriode}</span>. Tombol Unduh Excel
                    memakai periode ini.
                </p>
                {galat && <p className="mt-2 text-sm text-red-600">{galat}</p>}
            </Card>

            {/* Ringkasan */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Pendapatan periode" value={formatRupiah(stats.pendapatan)} hint={teksPeriode} />
                <StatCard label="Jumlah transaksi" value={stats.jumlah_transaksi.toLocaleString('id-ID')} />
                <StatCard label="Rata-rata per transaksi" value={formatRupiah(stats.rata_rata)} />
                <StatCard label="Total seluruh waktu" value={formatRupiah(stats.total)} />
            </div>

            {/* Pendapatan per tanggal */}
            <Card className="mt-6 overflow-hidden">
                <div className="border-b border-[#FFD5CC] px-5 py-4">
                    <h2 className="text-base font-bold text-[#3A1B14]">Pendapatan per tanggal</h2>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-[#FFF3F0] text-xs uppercase tracking-wide text-[#9E5A50]">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Tanggal</th>
                                <th className="px-5 py-3 font-semibold">Hari</th>
                                <th className="px-5 py-3 text-right font-semibold">Transaksi</th>
                                <th className="px-5 py-3 text-right font-semibold">Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#FFD5CC]">
                            {harian.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-[#9E5A50]">
                                        Tidak ada pendapatan pada periode ini.
                                    </td>
                                </tr>
                            )}
                            {harian.map((h) => (
                                <tr key={h.tanggal}>
                                    <td className="px-5 py-3 font-semibold text-[#3A1B14]">{tanggalPendek(h.tanggal)}</td>
                                    <td className="px-5 py-3 text-[#9E5A50]">{namaHari(h.tanggal)}</td>
                                    <td className="px-5 py-3 text-right text-[#3A1B14]">{h.jumlah_transaksi}</td>
                                    <td className="px-5 py-3 text-right font-bold text-[#3A1B14]">{formatRupiah(h.pendapatan)}</td>
                                </tr>
                            ))}
                        </tbody>
                        {harian.length > 0 && (
                            <tfoot className="bg-[#FFF3F0] text-sm font-bold text-[#3A1B14]">
                                <tr>
                                    <td colSpan={2} className="px-5 py-3 text-right">
                                        Total periode
                                    </td>
                                    <td className="px-5 py-3 text-right">{stats.jumlah_transaksi}</td>
                                    <td className="px-5 py-3 text-right">{formatRupiah(stats.pendapatan)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </Card>

            {/* Daftar transaksi */}
            <Card className="mt-6 overflow-hidden">
                <div className="border-b border-[#FFD5CC] px-5 py-4">
                    <h2 className="text-base font-bold text-[#3A1B14]">Daftar transaksi</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] text-left text-sm">
                        <thead className="bg-[#FFF3F0] text-xs uppercase tracking-wide text-[#9E5A50]">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Tanggal</th>
                                <th className="px-5 py-3 font-semibold">Jam</th>
                                <th className="px-5 py-3 font-semibold">Pengguna</th>
                                <th className="px-5 py-3 font-semibold">Paket</th>
                                <th className="px-5 py-3 text-right font-semibold">Jumlah</th>
                                <th className="px-5 py-3 font-semibold">Berlaku sampai</th>
                                <th className="px-5 py-3 font-semibold">Catatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#FFD5CC]">
                            {transaksi.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-[#9E5A50]">
                                        Belum ada transaksi pada periode ini.
                                    </td>
                                </tr>
                            )}
                            {transaksi.data.map((t) => (
                                <tr key={t.id}>
                                    <td className="px-5 py-3 font-semibold text-[#3A1B14]">{tanggalPendek(t.tanggal)}</td>
                                    <td className="px-5 py-3 text-[#9E5A50]">{t.waktu ?? '-'}</td>
                                    <td className="px-5 py-3">
                                        {t.user_id ? (
                                            <Link
                                                href={`/admin/users/${t.user_id}`}
                                                className="font-semibold text-[#3A1B14] hover:text-[#FC4524]"
                                            >
                                                {t.user ?? '-'}
                                            </Link>
                                        ) : (
                                            <span className="text-[#9E5A50]">Akun dihapus</span>
                                        )}
                                        <p className="text-xs text-[#9E5A50]">{t.email ?? ''}</p>
                                    </td>
                                    <td className="px-5 py-3 text-[#3A1B14]">{t.durasi_bulan} bulan</td>
                                    <td className="px-5 py-3 text-right font-bold text-[#3A1B14]">{formatRupiah(t.jumlah)}</td>
                                    <td className="px-5 py-3 text-[#3A1B14]">{tanggalPendek(t.berakhir)}</td>
                                    <td className="px-5 py-3 text-[#9E5A50]">{t.catatan ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-[#9E5A50]">
                    {transaksi.total > 0
                        ? `Menampilkan ${transaksi.from}-${transaksi.to} dari ${transaksi.total} transaksi`
                        : ''}
                </p>
                <Pagination links={transaksi.links} />
            </div>

            {/* Harga paket */}
            <Card className="mt-6 p-5">
                <h2 className="text-base font-bold text-[#3A1B14]">Harga paket</h2>
                <p className="mt-1 text-xs text-[#9E5A50]">
                    Perubahan harga hanya berlaku untuk penjualan berikutnya. Pendapatan yang sudah tercatat tidak berubah.
                </p>
                <div className="mt-2 divide-y divide-[#FFD5CC]">
                    {pakets.map((p) => (
                        <PaketRow key={p.id} paket={p} />
                    ))}
                </div>
            </Card>
        </AdminLayout>
    );
}
