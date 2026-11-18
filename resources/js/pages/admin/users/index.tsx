import { Card, MasaPremium, Pagination, Paginator, StatusBadge, formatTanggal } from '@/components/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type UserRow = {
    id: number;
    name: string;
    email: string;
    premium_aktif: boolean;
    premium_until: string | null;
    scan_limit: number;
    scan_terpakai: number;
    created_at: string | null;
};

type Props = {
    users: Paginator<UserRow>;
    filters: { search: string; status: 'semua' | 'premium' | 'gratis' };
};

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState<string>(filters.status);

    const terapkan = (nextSearch: string, nextStatus: string) =>
        router.get(
            '/admin/users',
            {
                search: nextSearch || undefined,
                status: nextStatus === 'semua' ? undefined : nextStatus,
            },
            { preserveState: true, replace: true },
        );

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        terapkan(search, status);
    };

    const cabutPremium = (u: UserRow) => {
        if (!window.confirm(`Cabut status Premium dari ${u.name}? Akun kembali menjadi akun biasa.`)) return;

        router.patch(`/admin/users/${u.id}/cabut-premium`, {}, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Pengguna">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-[#3A1B14]">Pengguna</h1>
                <p className="text-sm text-[#9E5A50]">Kelola status premium dan batas scan setiap pengguna.</p>
            </div>

            <Card className="p-4">
                <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama atau email..."
                        className="w-full flex-1 rounded-xl border border-[#FFD5CC] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FC4524] focus:ring-2 focus:ring-[#FC4524]/20"
                    />
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            terapkan(search, e.target.value);
                        }}
                        className="rounded-xl border border-[#FFD5CC] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FC4524]"
                    >
                        <option value="semua">Semua status</option>
                        <option value="premium">Premium</option>
                        <option value="gratis">Gratis</option>
                    </select>
                    <button
                        type="submit"
                        className="rounded-xl bg-[#FC4524] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#e63c1d]"
                    >
                        Cari
                    </button>
                </form>
            </Card>

            <Card className="mt-4 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-[#FFF3F0] text-xs uppercase tracking-wide text-[#9E5A50]">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Pengguna</th>
                                <th className="px-5 py-3 font-semibold">Status</th>
                                <th className="px-5 py-3 font-semibold">Scan</th>
                                <th className="px-5 py-3 font-semibold">Terdaftar</th>
                                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#FFD5CC]">
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-[#9E5A50]">
                                        Tidak ada pengguna yang cocok.
                                    </td>
                                </tr>
                            )}
                            {users.data.map((u) => (
                                <tr key={u.id} className="hover:bg-[#FFF3F0]/50">
                                    <td className="px-5 py-3">
                                        <Link
                                            href={`/admin/users/${u.id}`}
                                            className="font-semibold text-[#3A1B14] hover:text-[#FC4524]"
                                        >
                                            {u.name}
                                        </Link>
                                        <p className="text-xs text-[#9E5A50]">{u.email}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <StatusBadge premium={u.premium_aktif} />
                                        {u.premium_aktif && (
                                            <p className="mt-1">
                                                <MasaPremium premiumUntil={u.premium_until} />
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 font-medium text-[#3A1B14]">
                                        {u.scan_terpakai} / {u.premium_aktif ? '∞' : u.scan_limit}
                                    </td>
                                    <td className="px-5 py-3 text-[#9E5A50]">{formatTanggal(u.created_at)}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/admin/users/${u.id}`}
                                                className="rounded-lg border border-[#FFD5CC] px-3 py-1.5 text-xs font-semibold text-[#3A1B14] hover:bg-[#FFF3F0]"
                                            >
                                                Detail
                                            </Link>
                                            <Link
                                                href={`/admin/penjualan?user=${u.id}`}
                                                className="rounded-lg bg-[#FC4524] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e63c1d]"
                                            >
                                                {u.premium_aktif ? 'Perpanjang' : 'Aktifkan Premium'}
                                            </Link>
                                            {u.premium_aktif && (
                                                <button
                                                    type="button"
                                                    onClick={() => cabutPremium(u)}
                                                    className="rounded-lg border border-[#FFD5CC] px-3 py-1.5 text-xs font-semibold text-[#9E5A50] hover:bg-[#FFF3F0]"
                                                >
                                                    Cabut
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-[#9E5A50]">
                    {users.total > 0 ? `Menampilkan ${users.from}-${users.to} dari ${users.total} pengguna` : ''}
                </p>
                <Pagination links={users.links} />
            </div>
        </AdminLayout>
    );
}
