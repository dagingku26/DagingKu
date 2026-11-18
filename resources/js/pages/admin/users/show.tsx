import { Card, MasaPremium, Pagination, Paginator, StatusBadge, formatRupiah, formatTanggal, formatTanggalSaja } from '@/components/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { Link, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type Props = {
    pengguna: {
        id: number;
        name: string;
        email: string;
        premium_aktif: boolean;
        premium_until: string | null;
        scan_limit: number;
        scan_terpakai: number;
        sisa: number | null;
        google: boolean;
        created_at: string | null;
    };
    riwayat: Paginator<{ id: number; jumlah: number; tanggal: string | null }>;
    pembayaran: {
        id: number;
        durasi_bulan: number;
        jumlah: number;
        dibayar_pada: string | null;
        berakhir: string | null;
        catatan: string | null;
    }[];
};

export default function UserShow({ pengguna, riwayat, pembayaran }: Props) {
    const form = useForm({ scan_limit: String(pengguna.scan_limit) });

    const persen =
        pengguna.scan_limit > 0 ? Math.min(100, Math.round((pengguna.scan_terpakai / pengguna.scan_limit) * 100)) : 100;

    const cabutPremium = () => {
        if (!window.confirm(`Cabut status Premium dari ${pengguna.name}? Akun kembali menjadi akun biasa.`)) return;

        router.patch(`/admin/users/${pengguna.id}/cabut-premium`, {}, { preserveScroll: true });
    };

    const simpanBatas = (e: FormEvent) => {
        e.preventDefault();
        form.patch(`/admin/users/${pengguna.id}/limit`, { preserveScroll: true });
    };

    return (
        <AdminLayout title={pengguna.name}>
            <Link href="/admin/users" className="text-sm font-semibold text-[#FC4524] hover:underline">
                &larr; Kembali ke daftar pengguna
            </Link>

            <div className="mb-6 mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#3A1B14]">{pengguna.name}</h1>
                    <p className="text-sm text-[#9E5A50]">{pengguna.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge premium={pengguna.premium_aktif} />
                    <Link
                        href={`/admin/penjualan?user=${pengguna.id}`}
                        className="rounded-xl bg-[#FC4524] px-4 py-2 text-sm font-bold text-white hover:bg-[#e63c1d]"
                    >
                        {pengguna.premium_aktif ? 'Perpanjang Premium' : 'Aktifkan Premium'}
                    </Link>
                    {pengguna.premium_aktif && (
                        <button
                            type="button"
                            onClick={cabutPremium}
                            className="rounded-xl border border-[#FFD5CC] bg-white px-4 py-2 text-sm font-semibold text-[#9E5A50] hover:bg-[#FFF3F0]"
                        >
                            Cabut Premium
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="p-5 lg:col-span-2">
                    <h2 className="text-base font-bold text-[#3A1B14]">Status dan kuota scan</h2>

                    {pengguna.premium_aktif ? (
                        <div className="mt-3 rounded-xl border border-[#FFD5CC] bg-[#FFF3F0] p-4">
                            <p className="text-sm text-[#3A1B14]">
                                Akun Premium: scan <span className="font-bold">tanpa batas</span>. Sudah memakai{' '}
                                <span className="font-bold">{pengguna.scan_terpakai}</span> scan.
                            </p>
                            <p className="mt-2 text-sm text-[#3A1B14]">
                                Masa berlaku: <MasaPremium premiumUntil={pengguna.premium_until} />
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="mt-3 text-sm text-[#3A1B14]">
                                Terpakai <span className="font-bold">{pengguna.scan_terpakai}</span> dari{' '}
                                <span className="font-bold">{pengguna.scan_limit}</span> scan (sisa{' '}
                                <span className="font-bold">{pengguna.sisa ?? 0}</span>).
                            </p>
                            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#FFF3F0]">
                                <div className="h-full rounded-full bg-[#FC4524]" style={{ width: `${persen}%` }} />
                            </div>
                        </>
                    )}

                    <form onSubmit={simpanBatas} className="mt-6 border-t border-[#FFD5CC] pt-5">
                        <label htmlFor="scan_limit" className="text-sm font-semibold text-[#3A1B14]">
                            Batas scan akun biasa
                        </label>
                        <div className="mt-2 flex gap-3">
                            <input
                                id="scan_limit"
                                type="number"
                                min={0}
                                value={form.data.scan_limit}
                                onChange={(e) => form.setData('scan_limit', e.target.value)}
                                className="w-32 rounded-xl border border-[#FFD5CC] px-4 py-2.5 text-sm outline-none focus:border-[#FC4524] focus:ring-2 focus:ring-[#FC4524]/20"
                            />
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-xl bg-[#3A1B14] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2C1810] disabled:opacity-60"
                            >
                                Simpan
                            </button>
                        </div>
                        {form.errors.scan_limit && <p className="mt-2 text-sm text-red-600">{form.errors.scan_limit}</p>}
                        <p className="mt-2 text-xs text-[#9E5A50]">Batas ini tidak berlaku selama akun Premium aktif.</p>
                    </form>
                </Card>

                <Card className="p-5">
                    <h2 className="text-base font-bold text-[#3A1B14]">Informasi akun</h2>
                    <dl className="mt-3 space-y-3 text-sm">
                        <div>
                            <dt className="text-xs text-[#9E5A50]">Metode login</dt>
                            <dd className="font-semibold text-[#3A1B14]">{pengguna.google ? 'Google' : '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-[#9E5A50]">Terdaftar</dt>
                            <dd className="font-semibold text-[#3A1B14]">{formatTanggal(pengguna.created_at)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-[#9E5A50]">ID pengguna</dt>
                            <dd className="font-semibold text-[#3A1B14]">{pengguna.id}</dd>
                        </div>
                    </dl>
                </Card>
            </div>

            <Card className="mt-6 overflow-hidden">
                <div className="border-b border-[#FFD5CC] px-5 py-4">
                    <h2 className="text-base font-bold text-[#3A1B14]">Riwayat pembayaran</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="bg-[#FFF3F0] text-xs uppercase tracking-wide text-[#9E5A50]">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Tanggal bayar</th>
                                <th className="px-5 py-3 font-semibold">Paket</th>
                                <th className="px-5 py-3 font-semibold">Jumlah</th>
                                <th className="px-5 py-3 font-semibold">Berlaku sampai</th>
                                <th className="px-5 py-3 font-semibold">Catatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#FFD5CC]">
                            {pembayaran.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-[#9E5A50]">
                                        Belum ada pembayaran.
                                    </td>
                                </tr>
                            )}
                            {pembayaran.map((t) => (
                                <tr key={t.id}>
                                    <td className="px-5 py-3 text-[#3A1B14]">{formatTanggal(t.dibayar_pada)}</td>
                                    <td className="px-5 py-3 text-[#3A1B14]">{t.durasi_bulan} bulan</td>
                                    <td className="px-5 py-3 font-semibold text-[#3A1B14]">{formatRupiah(t.jumlah)}</td>
                                    <td className="px-5 py-3 text-[#3A1B14]">{formatTanggalSaja(t.berakhir)}</td>
                                    <td className="px-5 py-3 text-[#9E5A50]">{t.catatan ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card className="mt-6 overflow-hidden">
                <div className="border-b border-[#FFD5CC] px-5 py-4">
                    <h2 className="text-base font-bold text-[#3A1B14]">Riwayat scan</h2>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#FFF3F0] text-xs uppercase tracking-wide text-[#9E5A50]">
                        <tr>
                            <th className="px-5 py-3 font-semibold">Tanggal scan</th>
                            <th className="px-5 py-3 font-semibold">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FFD5CC]">
                        {riwayat.data.length === 0 && (
                            <tr>
                                <td colSpan={2} className="px-5 py-8 text-center text-[#9E5A50]">
                                    Belum ada scan.
                                </td>
                            </tr>
                        )}
                        {riwayat.data.map((s) => (
                            <tr key={s.id}>
                                <td className="px-5 py-3 text-[#3A1B14]">{formatTanggal(s.tanggal)}</td>
                                <td className="px-5 py-3 font-semibold text-[#3A1B14]">{s.jumlah}x</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <div className="mt-4">
                <Pagination links={riwayat.links} />
            </div>
        </AdminLayout>
    );
}
