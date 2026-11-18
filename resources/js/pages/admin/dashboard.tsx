import { BarChart, Card, StatCard, StatusBadge, formatRupiah, formatTanggal, ringkasRupiah } from '@/components/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { Link } from '@inertiajs/react';

type Props = {
    stats: {
        total_pengguna: number;
        premium: number;
        segera_berakhir: number;
        total_scan: number;
        scan_hari_ini: number;
    };
    keuangan: { hari_ini: number; bulan_ini: number; total: number; transaksi_bulan_ini: number };
    chart: { tanggal: string; label: string; total: number }[];
    chart_keuangan: { bulan: string; label: string; total: number }[];
    scan_terbaru: { id: number; user: string | null; email: string | null; jumlah: number; tanggal: string | null }[];
    pengguna_terbaru: { id: number; name: string; email: string; premium_aktif: boolean; created_at: string | null }[];
};

export default function Dashboard({ stats, keuangan, chart, chart_keuangan, scan_terbaru, pengguna_terbaru }: Props) {
    const angka = (n: number) => n.toLocaleString('id-ID');

    return (
        <AdminLayout title="Dashboard">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#3A1B14]">Dashboard</h1>
                    <p className="text-sm text-[#9E5A50]">Ringkasan penggunaan dan keuangan DagingKu.</p>
                </div>
                <Link
                    href="/admin/penjualan"
                    className="rounded-xl bg-[#FC4524] px-5 py-2.5 text-center text-sm font-bold text-white hover:bg-[#e63c1d]"
                >
                    Buka Penjualan
                </Link>
            </div>

            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#9E5A50]">Keuangan</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Pendapatan hari ini" value={formatRupiah(keuangan.hari_ini)} />
                <StatCard
                    label="Pendapatan bulan ini"
                    value={formatRupiah(keuangan.bulan_ini)}
                    hint={`${angka(keuangan.transaksi_bulan_ini)} transaksi`}
                />
                <StatCard label="Total pendapatan" value={formatRupiah(keuangan.total)} />
                <StatCard
                    label="Premium aktif"
                    value={angka(stats.premium)}
                    hint={
                        stats.segera_berakhir > 0
                            ? `${angka(stats.segera_berakhir)} berakhir dalam 7 hari`
                            : 'Tidak ada yang berakhir dalam 7 hari'
                    }
                />
            </div>

            <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-[#9E5A50]">Penggunaan</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Total pengguna" value={angka(stats.total_pengguna)} />
                <StatCard label="Total scan" value={angka(stats.total_scan)} />
                <StatCard label="Scan hari ini" value={angka(stats.scan_hari_ini)} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#3A1B14]">Pendapatan 6 bulan terakhir</h2>
                        <Link href="/admin/keuangan" className="text-sm font-semibold text-[#FC4524] hover:underline">
                            Laporan
                        </Link>
                    </div>
                    <div className="mt-6">
                        <BarChart
                            data={chart_keuangan.map((d) => ({ key: d.bulan, label: d.label, value: d.total }))}
                            format={ringkasRupiah}
                        />
                    </div>
                </Card>

                <Card className="p-5">
                    <h2 className="text-base font-bold text-[#3A1B14]">Scan 7 hari terakhir</h2>
                    <div className="mt-6">
                        <BarChart data={chart.map((d) => ({ key: d.tanggal, label: d.label, value: d.total }))} />
                    </div>
                </Card>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="p-5">
                    <h2 className="text-base font-bold text-[#3A1B14]">Scan terbaru</h2>
                    {scan_terbaru.length === 0 ? (
                        <p className="mt-4 text-sm text-[#9E5A50]">Belum ada scan.</p>
                    ) : (
                        <ul className="mt-3 divide-y divide-[#FFD5CC]">
                            {scan_terbaru.map((s) => (
                                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#3A1B14]">{s.user ?? '-'}</p>
                                        <p className="truncate text-xs text-[#9E5A50]">{s.email ?? '-'}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-bold text-[#3A1B14]">{s.jumlah}x</p>
                                        <p className="text-xs text-[#9E5A50]">{formatTanggal(s.tanggal)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card className="p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#3A1B14]">Pengguna terbaru</h2>
                        <Link href="/admin/users" className="text-sm font-semibold text-[#FC4524] hover:underline">
                            Lihat semua
                        </Link>
                    </div>
                    {pengguna_terbaru.length === 0 ? (
                        <p className="mt-4 text-sm text-[#9E5A50]">Belum ada pengguna.</p>
                    ) : (
                        <ul className="mt-3 divide-y divide-[#FFD5CC]">
                            {pengguna_terbaru.map((u) => (
                                <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <Link
                                            href={`/admin/users/${u.id}`}
                                            className="block truncate text-sm font-semibold text-[#3A1B14] hover:text-[#FC4524]"
                                        >
                                            {u.name}
                                        </Link>
                                        <p className="truncate text-xs text-[#9E5A50]">{u.email}</p>
                                    </div>
                                    <StatusBadge premium={u.premium_aktif} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
