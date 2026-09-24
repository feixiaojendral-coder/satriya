# Bracket 93 — rekonstruksi contoh

Model ini direkonstruksi dari gambar teknik `Modeling Practice Drawings 93`.
Satuan seluruh ukuran adalah milimeter.

Ukuran yang dipakai:

- alas 72 × 35 mm;
- jarak pusat lubang alas 48 mm;
- dua lubang alas Ø12 mm;
- boss atas Ø30 mm dengan lubang Ø12 mm;
- ketebalan boss 13 mm;
- pusat boss setinggi 60 mm;
- rib tengah selebar 10 mm dengan kemiringan 60°;
- lengkungan utama R15.

## Asumsi

Gambar memperlihatkan angka 10 mm pada tampak depan dan 6 mm pada potongan
samping di area alas. Model contoh menggunakan ketebalan alas 10 mm. Nilai ini
dapat diubah pada variabel `base_thickness` di `bracket-93.FCMacro`.

## Berkas

- `bracket-93-reference.glb` untuk pratinjau di web;
- `bracket-93-reference.stl` sebagai model referensi yang dapat diimpor;
- `bracket-93.FCMacro` untuk membangun ulang solid parametrik di FreeCAD;
- `bracket-93-preview.png` sebagai gambar pratinjau.

Untuk menghasilkan berkas native FreeCAD, buka FreeCAD lalu jalankan
`bracket-93.FCMacro`. Macro akan membuat `bracket-93.FCStd`, STEP, dan STL hasil
boolean di folder yang sama.
