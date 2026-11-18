import { Head, Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, useEffect, useState } from 'react';

type SharedProps = {
    auth: { user: { name: string; email: string } };
    flash?: { success?: string | null };
};

const navItems = [
    { label: 'Dashboard', href: '/admin', isActive: (url: string) => url === '/admin' || url.startsWith('/admin?') },
    { label: 'Penjualan', href: '/admin/penjualan', isActive: (url: string) => url.startsWith('/admin/penjualan') },
    { label: 'Pengguna', href: '/admin/users', isActive: (url: string) => url.startsWith('/admin/users') },
    { label: 'Keuangan', href: '/admin/keuangan', isActive: (url: string) => url.startsWith('/admin/keuangan') },
];

function SidebarContent({
    url,
    user,
    onNavigate,
}: {
    url: string;
    user: { name: string; email: string };
    onNavigate?: () => void;
}) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-[#FFD5CC] px-5 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FC4524] text-lg font-extrabold text-white">
                    D
                </div>
                <div>
                    <p className="text-base font-extrabold text-[#3A1B14]">DagingKu</p>
                    <p className="text-xs text-[#9E5A50]">Panel Admin</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={`flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                            item.isActive(url) ? 'bg-[#FC4524] text-white' : 'text-[#3A1B14] hover:bg-[#FFF3F0]'
                        }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="border-t border-[#FFD5CC] p-4">
                <p className="truncate text-sm font-bold text-[#3A1B14]">{user.name}</p>
                <p className="truncate text-xs text-[#9E5A50]">{user.email}</p>
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="mt-3 w-full rounded-xl border border-[#FFD5CC] px-4 py-2 text-sm font-semibold text-[#3A1B14] hover:bg-[#FFF3F0]"
                >
                    Keluar
                </button>
            </div>
        </div>
    );
}

export default function AdminLayout({ title, children }: PropsWithChildren<{ title: string }>) {
    const page = usePage<SharedProps>();
    const { auth, flash } = page.props;
    const url = page.url;

    const [menuOpen, setMenuOpen] = useState(false);
    const [showFlash, setShowFlash] = useState(false);

    // Pesan sukses tampil 4 detik setiap ada flash baru dari server
    useEffect(() => {
        if (!flash?.success) {
            setShowFlash(false);
            return;
        }
        setShowFlash(true);
        const timer = setTimeout(() => setShowFlash(false), 4000);
        return () => clearTimeout(timer);
    }, [flash]);

    return (
        <div className="min-h-screen bg-[#FFF3F0] text-[#2C1810]">
            <Head title={title} />

            {/* Sidebar desktop */}
            <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#FFD5CC] bg-white lg:block">
                <SidebarContent url={url} user={auth.user} />
            </aside>

            {/* Bar atas mobile */}
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#FFD5CC] bg-white px-4 py-3 lg:hidden">
                <p className="font-extrabold text-[#3A1B14]">DagingKu Admin</p>
                <button
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    className="rounded-lg border border-[#FFD5CC] px-3 py-1.5 text-sm font-semibold text-[#3A1B14]"
                >
                    Menu
                </button>
            </header>

            {/* Drawer mobile */}
            {menuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
                        <SidebarContent url={url} user={auth.user} onNavigate={() => setMenuOpen(false)} />
                    </div>
                </div>
            )}

            {/* Notifikasi */}
            {showFlash && flash?.success && (
                <div className="fixed right-4 top-4 z-50 max-w-sm rounded-xl bg-[#3A1B14] px-4 py-3 text-sm font-medium text-white shadow-lg">
                    {flash.success}
                </div>
            )}

            <div className="lg:pl-64">
                <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
