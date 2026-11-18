// Paket siap-browser exceljs tidak punya tipe sendiri; tipenya sama dengan paket utamanya.
declare module 'exceljs/dist/exceljs.min.js' {
    export * from 'exceljs';
}
