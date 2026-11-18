import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export type PageLink = { url: string | null; label: string; active: boolean };

export type Paginator<T> = {
    data: T[];
    links: PageLink[];
    total: number;
    from: number | null;
    to: number | null;
};

export function formatTanggal(iso?: string | null): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatTanggalSaja(iso?: string | null): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'medium' });
}

// Sisa hari sampai tanggal berakhir (hari terakhir dihitung 1 hari)
export function sisaHari(iso?: string | null): number | null {
    if (!iso) return null;
    const selisih = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(selisih / 86_400_000));
}

export function formatRupiah(angka: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
}

// Untuk label grafik yang sempit: 35000 -> 35 rb, 1500000 -> 1,5 jt
export function ringkasRupiah(angka: number): string {
    if (angka >= 1_000_000) return `${(angka / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} jt`;
    if (angka >= 1_000) return `${Math.round(angka / 1_000)} rb`;
    return String(angka);
}

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
    return <div className={`rounded-2xl border border-[#FFD5CC] bg-white shadow-sm ${className}`}>{children}</div>;
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
    return (
        <Card className="p-5">
            <p className="text-sm font-medium text-[#9E5A50]">{label}</p>
            <p className="mt-2 text-2xl font-extrabold text-[#3A1B14] sm:text-3xl">{value}</p>
            {hint && <p className="mt-1 text-xs text-[#9E5A50]">{hint}</p>}
        </Card>
    );
}

export function StatusBadge({ premium }: { premium: boolean }) {
    return premium ? (
        <span className="inline-flex rounded-full bg-[#FC4524] px-3 py-1 text-xs font-bold text-white">PREMIUM</span>
    ) : (
        <span className="inline-flex rounded-full border border-[#FFD5CC] bg-[#FFF3F0] px-3 py-1 text-xs font-bold text-[#9E5A50]">
            GRATIS
        </span>
    );
}

// Teks masa berlaku premium. Berwarna kuning jika sisa 7 hari atau kurang.
export function MasaPremium({ premiumUntil }: { premiumUntil: string | null }) {
    if (!premiumUntil) {
        return <span className="text-xs text-[#9E5A50]">tanpa batas waktu</span>;
    }

    const sisa = sisaHari(premiumUntil) ?? 0;
    const segera = sisa <= 7;

    return (
        <span className={`text-xs ${segera ? 'font-semibold text-[#B26A00]' : 'text-[#9E5A50]'}`}>
            sampai {formatTanggalSaja(premiumUntil)} ({sisa > 0 ? `sisa ${sisa} hari` : 'berakhir'})
            {segera ? ' - segera berakhir' : ''}
        </span>
    );
}

export type BarItem = { key: string; label: string; value: number };

export function BarChart({ data, format }: { data: BarItem[]; format?: (n: number) => string }) {
    const max = Math.max(1, ...data.map((d) => d.value));
    const tampil = format ?? String;

    return (
        <div className="flex items-end gap-3">
            {data.map((d) => (
                <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-32 w-full flex-col items-center justify-end gap-1">
                        <span className="text-[11px] font-semibold text-[#3A1B14]">{d.value > 0 ? tampil(d.value) : '0'}</span>
                        <div
                            className="w-full max-w-12 rounded-t-lg bg-[#FC4524]"
                            style={{ height: Math.max(Math.round((d.value / max) * 100), 4) }}
                        />
                    </div>
                    <span className="text-xs text-[#9E5A50]">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

function terjemahkan(label: string): string {
    return label.replace('Previous', 'Sebelumnya').replace('Next', 'Berikutnya');
}

export function Pagination({ links }: { links: PageLink[] }) {
    if (links.length <= 3) return null;

    return (
        <nav className="flex flex-wrap items-center gap-1">
            {links.map((link, i) =>
                link.url ? (
                    <Link
                        key={i}
                        href={link.url}
                        preserveScroll
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                            link.active
                                ? 'border-[#FC4524] bg-[#FC4524] text-white'
                                : 'border-[#FFD5CC] bg-white text-[#3A1B14] hover:bg-[#FFF3F0]'
                        }`}
                        dangerouslySetInnerHTML={{ __html: terjemahkan(link.label) }}
                    />
                ) : (
                    <span
                        key={i}
                        className="rounded-lg border border-[#FFD5CC] bg-white/60 px-3 py-1.5 text-sm text-[#9E5A50]/60"
                        dangerouslySetInnerHTML={{ __html: terjemahkan(link.label) }}
                    />
                ),
            )}
        </nav>
    );
}
