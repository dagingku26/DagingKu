// Membuat berkas Excel laporan keuangan (dijalankan di browser saat tombol "Unduh Excel" ditekan).
// Pustaka exceljs hanya dimuat ketika tombol ditekan, jadi tidak membebani halaman lain.

type ExcelModule = typeof import('exceljs');

export type TransaksiLaporan = {
    no: number;
    tanggal: string; // YYYY-MM-DD
    waktu: string; // HH:mm
    pengguna: string;
    email: string;
    paket: string;
    durasi_bulan: number;
    jumlah: number;
    berakhir: string | null; // YYYY-MM-DD
    catatan: string | null;
    dicatat_oleh: string;
};

export type HarianLaporan = { tanggal: string; jumlah_transaksi: number; pendapatan: number };

export type PaketLaporan = { paket: string; durasi_bulan: number; jumlah_transaksi: number; pendapatan: number };

export type LaporanData = {
    periode: { dari: string; sampai: string };
    dicetak_pada: string; // YYYY-MM-DD HH:mm
    dicetak_oleh: string;
    transaksi: TransaksiLaporan[];
    harian: HarianLaporan[];
    per_paket: PaketLaporan[];
};

const BULAN = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const WARNA_UTAMA = 'FFFC4524';
const WARNA_MUDA = 'FFFFF3F0';
const GARIS = { style: 'thin' as const, color: { argb: 'FFFFD5CC' } };
const BORDER = { top: GARIS, left: GARIS, bottom: GARIS, right: GARIS };
const FORMAT_RUPIAH = '#,##0';
const FORMAT_TANGGAL = 'dd/mm/yyyy';

function tanggalPanjang(ymd: string): string {
    const [y, m, d] = ymd.split('-').map(Number);
    return `${d} ${BULAN[m - 1]} ${y}`;
}

// Disimpan sebagai tanggal UTC supaya di Excel tidak bergeser sehari oleh zona waktu
function tanggalExcel(ymd: string): Date {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function teksPeriode(data: LaporanData): string {
    const { dari, sampai } = data.periode;
    return dari === sampai ? `Periode: ${tanggalPanjang(dari)}` : `Periode: ${tanggalPanjang(dari)} s/d ${tanggalPanjang(sampai)}`;
}

function tambahJudul(ws: import('exceljs').Worksheet, judul: string, periode: string, kolomAkhir: string) {
    ws.mergeCells(`A1:${kolomAkhir}1`);
    const t = ws.getCell('A1');
    t.value = judul;
    t.font = { bold: true, size: 16, color: { argb: WARNA_UTAMA } };
    t.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(1).height = 26;

    ws.mergeCells(`A2:${kolomAkhir}2`);
    const p = ws.getCell('A2');
    p.value = periode;
    p.font = { size: 11, color: { argb: 'FF3A1B14' } };
}

function gayaHeader(row: import('exceljs').Row, jumlahKolom: number) {
    for (let c = 1; c <= jumlahKolom; c++) {
        const cell = row.getCell(c);
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WARNA_UTAMA } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = BORDER;
    }
    row.height = 24;
}

function gayaTotal(row: import('exceljs').Row, jumlahKolom: number) {
    for (let c = 1; c <= jumlahKolom; c++) {
        const cell = row.getCell(c);
        cell.font = { bold: true, color: { argb: 'FF3A1B14' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WARNA_MUDA } };
        cell.border = BORDER;
    }
}

// Fungsi murni: menerima modul exceljs dan data, mengembalikan workbook (mudah diuji)
export function buatWorkbook(ExcelJS: ExcelModule, data: LaporanData) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'DagingKu';
    wb.created = new Date();

    const periode = teksPeriode(data);
    const n = data.transaksi.length;
    const totalPendapatan = data.transaksi.reduce((jumlah, t) => jumlah + t.jumlah, 0);

    // ───────────────── Lembar 1: Laporan Keuangan ─────────────────
    const ws = wb.addWorksheet('Laporan Keuangan', {
        views: [{ showGridLines: false }],
        pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    ws.columns = [
        { width: 6 },
        { width: 13 },
        { width: 8 },
        { width: 24 },
        { width: 30 },
        { width: 18 },
        { width: 16 },
        { width: 15 },
        { width: 28 },
        { width: 16 },
    ];

    tambahJudul(ws, 'LAPORAN KEUANGAN DAGINGKU', periode, 'J');

    ws.mergeCells('A3:J3');
    ws.getCell('A3').value = `Dicetak: ${data.dicetak_pada} oleh ${data.dicetak_oleh}`;
    ws.getCell('A3').font = { size: 10, italic: true, color: { argb: 'FF9E5A50' } };

    const HEADER = 10;
    const awal = HEADER + 1;
    const akhir = n > 0 ? HEADER + n : awal; // rentang rumus (kosong jika tidak ada transaksi)

    // Ringkasan
    ws.getCell('A5').value = 'RINGKASAN';
    ws.getCell('A5').font = { bold: true, size: 12, color: { argb: 'FF3A1B14' } };

    const ringkasan: { baris: number; label: string; nilai: { formula: string; result: number }; format: string }[] = [
        { baris: 6, label: 'Total pendapatan (Rp)', nilai: { formula: `SUM(G${awal}:G${akhir})`, result: totalPendapatan }, format: FORMAT_RUPIAH },
        { baris: 7, label: 'Jumlah transaksi', nilai: { formula: `COUNT(G${awal}:G${akhir})`, result: n }, format: '0' },
        {
            baris: 8,
            label: 'Rata-rata per transaksi (Rp)',
            nilai: { formula: 'IF(D7=0,0,D6/D7)', result: n > 0 ? totalPendapatan / n : 0 },
            format: FORMAT_RUPIAH,
        },
    ];
    for (const r of ringkasan) {
        ws.mergeCells(`A${r.baris}:C${r.baris}`);
        const label = ws.getCell(`A${r.baris}`);
        label.value = r.label;
        label.font = { bold: true };
        label.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WARNA_MUDA } };
        const nilai = ws.getCell(`D${r.baris}`);
        nilai.value = r.nilai;
        nilai.numFmt = r.format;
        nilai.font = { bold: true, size: 12 };
        nilai.alignment = { horizontal: 'right' };
        for (const sel of [label, nilai]) sel.border = BORDER;
    }

    // Tabel transaksi
    const header = ws.getRow(HEADER);
    ['No', 'Tanggal', 'Jam', 'Pengguna', 'Email', 'Paket', 'Jumlah (Rp)', 'Berlaku sampai', 'Catatan', 'Dicatat oleh'].forEach(
        (judul, i) => (header.getCell(i + 1).value = judul),
    );
    gayaHeader(header, 10);

    if (n === 0) {
        ws.mergeCells(`A${awal}:J${awal}`);
        const kosong = ws.getCell(`A${awal}`);
        kosong.value = 'Tidak ada transaksi pada periode ini.';
        kosong.font = { italic: true, color: { argb: 'FF9E5A50' } };
        kosong.alignment = { horizontal: 'center' };
        kosong.border = BORDER;
    }

    data.transaksi.forEach((t, i) => {
        const row = ws.getRow(awal + i);
        row.getCell(1).value = t.no;
        row.getCell(2).value = tanggalExcel(t.tanggal);
        row.getCell(3).value = t.waktu;
        row.getCell(4).value = t.pengguna;
        row.getCell(5).value = t.email;
        row.getCell(6).value = t.paket;
        row.getCell(7).value = t.jumlah;
        row.getCell(8).value = t.berakhir ? tanggalExcel(t.berakhir) : '-';
        row.getCell(9).value = t.catatan ?? '-';
        row.getCell(10).value = t.dicatat_oleh;

        row.getCell(2).numFmt = FORMAT_TANGGAL;
        row.getCell(7).numFmt = FORMAT_RUPIAH;
        row.getCell(8).numFmt = FORMAT_TANGGAL;
        for (const c of [1, 2, 3, 8]) row.getCell(c).alignment = { horizontal: 'center' };
        row.getCell(7).alignment = { horizontal: 'right' };
        row.getCell(9).alignment = { wrapText: true, vertical: 'top' };
        for (let c = 1; c <= 10; c++) row.getCell(c).border = BORDER;
    });

    const barisTotal = akhir + 1;
    ws.mergeCells(`A${barisTotal}:F${barisTotal}`);
    ws.getCell(`A${barisTotal}`).value = 'TOTAL PENDAPATAN';
    ws.getCell(`A${barisTotal}`).alignment = { horizontal: 'right' };
    ws.getCell(`G${barisTotal}`).value = { formula: `SUM(G${awal}:G${akhir})`, result: totalPendapatan };
    ws.getCell(`G${barisTotal}`).numFmt = FORMAT_RUPIAH;
    ws.getCell(`G${barisTotal}`).alignment = { horizontal: 'right' };
    gayaTotal(ws.getRow(barisTotal), 10);

    ws.getCell(`A${barisTotal + 2}`).value = 'Dokumen ini dibuat otomatis oleh sistem DagingKu.';
    ws.getCell(`A${barisTotal + 2}`).font = { size: 9, italic: true, color: { argb: 'FF9E5A50' } };

    // ───────────────── Lembar 2: Pendapatan Harian ─────────────────
    const wh = wb.addWorksheet('Pendapatan Harian', {
        views: [{ showGridLines: false }],
        pageSetup: { orientation: 'portrait', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    wh.columns = [{ width: 6 }, { width: 18 }, { width: 18 }, { width: 22 }];
    tambahJudul(wh, 'PENDAPATAN HARIAN', periode, 'D');

    const HH = 4;
    const hAwal = HH + 1;
    const nh = data.harian.length;
    const hAkhir = nh > 0 ? HH + nh : hAwal;

    ['No', 'Tanggal', 'Jumlah transaksi', 'Pendapatan (Rp)'].forEach((judul, i) => (wh.getRow(HH).getCell(i + 1).value = judul));
    gayaHeader(wh.getRow(HH), 4);

    if (nh === 0) {
        wh.mergeCells(`A${hAwal}:D${hAwal}`);
        const kosong = wh.getCell(`A${hAwal}`);
        kosong.value = 'Tidak ada transaksi pada periode ini.';
        kosong.font = { italic: true, color: { argb: 'FF9E5A50' } };
        kosong.alignment = { horizontal: 'center' };
        kosong.border = BORDER;
    }

    data.harian.forEach((h, i) => {
        const row = wh.getRow(hAwal + i);
        row.getCell(1).value = i + 1;
        row.getCell(2).value = tanggalExcel(h.tanggal);
        row.getCell(3).value = h.jumlah_transaksi;
        row.getCell(4).value = h.pendapatan;
        row.getCell(2).numFmt = FORMAT_TANGGAL;
        row.getCell(4).numFmt = FORMAT_RUPIAH;
        for (const c of [1, 2, 3]) row.getCell(c).alignment = { horizontal: 'center' };
        row.getCell(4).alignment = { horizontal: 'right' };
        for (let c = 1; c <= 4; c++) row.getCell(c).border = BORDER;
    });

    const hTotal = hAkhir + 1;
    wh.mergeCells(`A${hTotal}:B${hTotal}`);
    wh.getCell(`A${hTotal}`).value = 'TOTAL';
    wh.getCell(`A${hTotal}`).alignment = { horizontal: 'right' };
    wh.getCell(`C${hTotal}`).value = { formula: `SUM(C${hAwal}:C${hAkhir})`, result: n };
    wh.getCell(`D${hTotal}`).value = { formula: `SUM(D${hAwal}:D${hAkhir})`, result: totalPendapatan };
    wh.getCell(`C${hTotal}`).alignment = { horizontal: 'center' };
    wh.getCell(`D${hTotal}`).alignment = { horizontal: 'right' };
    wh.getCell(`D${hTotal}`).numFmt = FORMAT_RUPIAH;
    gayaTotal(wh.getRow(hTotal), 4);

    // ───────────────── Lembar 3: Per Paket ─────────────────
    const wp = wb.addWorksheet('Per Paket', {
        views: [{ showGridLines: false }],
        pageSetup: { orientation: 'portrait', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    wp.columns = [{ width: 28 }, { width: 18 }, { width: 22 }];
    tambahJudul(wp, 'PENDAPATAN PER PAKET', periode, 'C');

    const HP = 4;
    const pAwal = HP + 1;
    const np = data.per_paket.length;
    const pAkhir = np > 0 ? HP + np : pAwal;

    ['Paket', 'Jumlah transaksi', 'Pendapatan (Rp)'].forEach((judul, i) => (wp.getRow(HP).getCell(i + 1).value = judul));
    gayaHeader(wp.getRow(HP), 3);

    if (np === 0) {
        wp.mergeCells(`A${pAwal}:C${pAwal}`);
        const kosong = wp.getCell(`A${pAwal}`);
        kosong.value = 'Tidak ada transaksi pada periode ini.';
        kosong.font = { italic: true, color: { argb: 'FF9E5A50' } };
        kosong.alignment = { horizontal: 'center' };
        kosong.border = BORDER;
    }

    data.per_paket.forEach((p, i) => {
        const row = wp.getRow(pAwal + i);
        row.getCell(1).value = p.paket;
        row.getCell(2).value = p.jumlah_transaksi;
        row.getCell(3).value = p.pendapatan;
        row.getCell(3).numFmt = FORMAT_RUPIAH;
        row.getCell(2).alignment = { horizontal: 'center' };
        row.getCell(3).alignment = { horizontal: 'right' };
        for (let c = 1; c <= 3; c++) row.getCell(c).border = BORDER;
    });

    const pTotal = pAkhir + 1;
    wp.getCell(`A${pTotal}`).value = 'TOTAL';
    wp.getCell(`A${pTotal}`).alignment = { horizontal: 'right' };
    wp.getCell(`B${pTotal}`).value = { formula: `SUM(B${pAwal}:B${pAkhir})`, result: n };
    wp.getCell(`C${pTotal}`).value = { formula: `SUM(C${pAwal}:C${pAkhir})`, result: totalPendapatan };
    wp.getCell(`B${pTotal}`).alignment = { horizontal: 'center' };
    wp.getCell(`C${pTotal}`).alignment = { horizontal: 'right' };
    wp.getCell(`C${pTotal}`).numFmt = FORMAT_RUPIAH;
    gayaTotal(wp.getRow(pTotal), 3);

    return wb;
}

export async function unduhLaporanExcel(data: LaporanData): Promise<void> {
    // Memakai paket siap-browser dari exceljs agar aman di Vite
    const mod = await import('exceljs/dist/exceljs.min.js');
    const ExcelJS = ((mod as unknown as { default?: ExcelModule }).default ?? mod) as ExcelModule;

    const workbook = buatWorkbook(ExcelJS, data);
    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const tautan = document.createElement('a');
    tautan.href = url;
    tautan.download = `Laporan-Keuangan-DagingKu_${data.periode.dari}_sd_${data.periode.sampai}.xlsx`;
    document.body.appendChild(tautan);
    tautan.click();
    tautan.remove();
    URL.revokeObjectURL(url);
}
