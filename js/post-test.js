/**
 * ==========================================================================
 * DRAFT-LAB — TES PEMAHAMAN (POST-TEST PERTEMUAN 1)
 * 20 Soal Pilihan Ganda (60 Poin) + 10 Soal Esai (40 Poin) = 100 Poin
 * Berdasarkan Instrumen: Post_Test_Pertemuan_1_Gambar_Teknik_20_PG_10_Esai_H_2B.docx
 * ==========================================================================
 */

import { getStudentSession, getScriptUrl } from './auth.js';
import { initCbtLock, enableCbtLock, disableCbtLock, cbtState, requestCbtFullscreen, showMandatoryGate, hideMandatoryGate, activateMandatoryLock } from './cbt-lock.js';

const DRAFT_STORAGE_KEY = 'draftlab_posttest_draft';
const SUBMISSIONS_STORAGE_KEY = 'draftlab_posttest_submissions';
const COMPLETED_STORAGE_KEY = 'draftlab_posttest_completed';

// Kunci Jawaban Resmi Bagian A (Pilihan Ganda)
export const POST_TEST_MCQ_KEYS = {
  1: 'B', 2: 'C', 3: 'B', 4: 'B', 5: 'A',
  6: 'A', 7: 'A', 8: 'B', 9: 'C', 10: 'B',
  11: 'B', 12: 'B', 13: 'B', 14: 'B', 15: 'A',
  16: 'B', 17: 'B', 18: 'B', 19: 'A', 20: 'A'
};

// Pedoman Pembahasan Esai & PG
export const POST_TEST_DATA = {
  mcq: [
    {
      no: 1,
      q: 'Gambar teknik manual adalah ....',
      options: {
        A: 'gambar bebas untuk memperindah benda',
        B: 'cara menyampaikan bentuk, ukuran, dan informasi benda menggunakan alat gambar',
        C: 'gambar yang hanya digunakan oleh pelukis',
        D: 'gambar yang dibuat tanpa tujuan yang jelas'
      },
      key: 'B',
      explanation: 'Gambar teknik manual adalah cara menyampaikan bentuk, ukuran, dan informasi benda kerja secara presisi menggunakan peralatan gambar tangan.'
    },
    {
      no: 2,
      q: 'Tujuan utama gambar teknik adalah ....',
      options: {
        A: 'membuat gambar terlihat menarik',
        B: 'membuat kertas terlihat penuh',
        C: 'menyampaikan informasi benda agar dapat dipahami orang lain',
        D: 'menunjukkan kemampuan menggambar seseorang'
      },
      key: 'C',
      explanation: 'Fungsi primer gambar teknik adalah sebagai media penyampai informasi teknis bentuk dan ukuran benda secara akurat kepada pihak lain.'
    },
    {
      no: 3,
      q: 'Dalam gambar teknik, hal yang lebih penting daripada sekadar gambar terlihat indah adalah ....',
      options: {
        A: 'warna',
        B: 'ketelitian dan keterbacaan',
        C: 'hiasan',
        D: 'ukuran kertas yang besar'
      },
      key: 'B',
      explanation: 'Ketelitian dimensi dan keterbacaan garis/simbol jauh lebih penting karena gambar teknik merupakan acuan pengerjaan produksi.'
    },
    {
      no: 4,
      q: 'Gambar teknik disebut sebagai bahasa komunikasi teknik karena ....',
      options: {
        A: 'hanya digunakan di sekolah',
        B: 'dapat menyampaikan informasi tentang benda kepada orang lain',
        C: 'menggunakan banyak tulisan',
        D: 'selalu dibuat dengan komputer'
      },
      key: 'B',
      explanation: 'Gambar teknik menjadi bahasa universal bagi perancang, operator mesin, dan pemeriksa kualitas tanpa batasan bahasa lisan.'
    },
    {
      no: 5,
      q: 'Salah satu fungsi gambar teknik dalam pekerjaan teknik adalah ....',
      options: {
        A: 'menjadi acuan ketika benda akan dibuat',
        B: 'menghias ruang bengkel',
        C: 'menggantikan semua alat ukur',
        D: 'mempercepat mesin tanpa operator'
      },
      key: 'A',
      explanation: 'Gambar teknik menjadi pedoman acuan kerja (blueprint) bagi teknisi/operator bengkel saat membuat benda kerja.'
    },
    {
      no: 6,
      q: 'Salah membaca ukuran pada gambar teknik dapat menyebabkan ....',
      options: {
        A: 'benda dibuat dengan ukuran yang salah',
        B: 'gambar menjadi lebih bagus',
        C: 'pekerjaan menjadi lebih mudah',
        D: 'mesin menjadi lebih cepat'
      },
      key: 'A',
      explanation: 'Kesalahan membaca dimensi berakibat fatal pada cacat produk (scrap/reject) dan benda tidak dapat dipasang/difungsikan.'
    },
    {
      no: 7,
      q: 'Salah satu manfaat mempelajari gambar teknik bagi siswa Teknik Pemesinan adalah ....',
      options: {
        A: 'terbiasa membaca informasi benda kerja dengan tepat',
        B: 'tidak perlu melakukan praktik bengkel',
        C: 'tidak perlu menggunakan alat ukur',
        D: 'dapat bekerja tanpa gambar'
      },
      key: 'A',
      explanation: 'Siswa Teknik Pemesinan harus mampu membaca informasi ukuran toleransi, bahan, dan perlakuan khusus sebelum mengoperasikan mesin.'
    },
    {
      no: 8,
      q: 'Sikap yang perlu dilatih dalam pembelajaran gambar teknik adalah ....',
      options: {
        A: 'cepat, bebas, dan santai',
        B: 'teliti, rapi, disiplin, dan bertanggung jawab',
        C: 'berani, keras, dan terburu-buru',
        D: 'diam dan tidak bertanya'
      },
      key: 'B',
      explanation: 'Sikap kerja standar industri: ketelitian tinggi, kerapian garis, kedisiplinan aturan ISO, serta tanggung jawab terhadap hasil kerja.'
    },
    {
      no: 9,
      q: 'Ketika hasil gambar belum sesuai, sikap yang sebaiknya dilakukan adalah ....',
      options: {
        A: 'langsung dibuang',
        B: 'menyalin pekerjaan teman',
        C: 'diperiksa dan diperbaiki',
        D: 'dibiarkan saja'
      },
      key: 'C',
      explanation: 'Pemeriksaan mandiri (evaluasi) dan perbaikan kesalahan merupakan proses belajar utama untuk mencapai standar ketelitian.'
    },
    {
      no: 10,
      q: 'Dalam proses dari ide menjadi benda, gambar berfungsi sebagai ....',
      options: {
        A: 'penghias pekerjaan',
        B: 'penghubung antara ide dan pekerjaan nyata',
        C: 'pengganti material',
        D: 'pengganti mesin'
      },
      key: 'B',
      explanation: 'Gambar teknik adalah jembatan konkret yang mengubah gagasan/ide rancangan konseptual menjadi instruksi pembuatan fisik.'
    },
    {
      no: 11,
      q: 'Sebelum mulai menggambar, siswa sebaiknya ....',
      options: {
        A: 'langsung menggunakan alat',
        B: 'mengikuti instruksi terlebih dahulu',
        C: 'meminjam semua alat teman',
        D: 'melipat kertas gambar'
      },
      key: 'B',
      explanation: 'Mendengarkan dan memahami instruksi kerja, ukuran kertas, serta spesifikasi tugas sangat penting sebelum mulai menggores.'
    },
    {
      no: 12,
      q: 'Kertas gambar sebaiknya dijaga agar ....',
      options: {
        A: 'selalu dilipat',
        B: 'bersih, rata, dan tidak kusut',
        C: 'diberi banyak coretan',
        D: 'mudah digulung'
      },
      key: 'B',
      explanation: 'Kertas gambar harus dijaga kebersihannya, tidak kusut atau terlipat agar hasil cetakan garis akurat dan terbaca jelas.'
    },
    {
      no: 13,
      q: 'Fungsi papan gambar adalah ....',
      options: {
        A: 'menyimpan pensil',
        B: 'menyediakan permukaan kerja yang rata dan stabil',
        C: 'menghapus garis',
        D: 'membuat lingkaran'
      },
      key: 'B',
      explanation: 'Papan gambar memberikan landasan bidang datar sempurna tanpa gelombang untuk menempelkan kertas gambar.'
    },
    {
      no: 14,
      q: 'Pensil dengan kode H memiliki karakteristik ....',
      options: {
        A: 'lebih lunak dan menghasilkan goresan lebih gelap',
        B: 'lebih keras dan menghasilkan goresan cenderung lebih ringan',
        C: 'digunakan khusus untuk mewarnai',
        D: 'hanya digunakan untuk menulis'
      },
      key: 'B',
      explanation: 'Kategori H (Hard) mengandung lebih banyak lempung, menghasilkan inti grafit keras dengan garis abu-abu tipis presisi.'
    },
    {
      no: 15,
      q: 'Pensil 2B memiliki karakteristik ....',
      options: {
        A: 'lebih lunak dan menghasilkan goresan lebih gelap',
        B: 'lebih keras dan menghasilkan goresan sangat tipis',
        C: 'sama persis dengan pensil H',
        D: 'tidak dapat digunakan untuk menggambar'
      },
      key: 'A',
      explanation: 'Kategori B (Black) bersifat lunak dan menghasilkan goresan hitam pekat, cocok untuk garis gambar nyata dan tulisan.'
    },
    {
      no: 16,
      q: 'Alat yang digunakan untuk membuat lingkaran atau busur adalah ....',
      options: {
        A: 'penghapus',
        B: 'jangka',
        C: 'kuas',
        D: 'penggaris lurus'
      },
      key: 'B',
      explanation: 'Jangka (compass) adalah instrumen khusus pembuat busur dan lingkaran berpusat akurat.'
    },
    {
      no: 17,
      q: 'Divider digunakan untuk ....',
      options: {
        A: 'menghapus garis',
        B: 'memindahkan atau membandingkan jarak',
        C: 'membuat tulisan',
        D: 'menempelkan kertas'
      },
      key: 'B',
      explanation: 'Divider (jangka bagi berkaki dua jarum) digunakan untuk memindahkan dan membagi ukuran jarak tanpa menggunakan angka penggaris.'
    },
    {
      no: 18,
      q: 'Sepasang penggaris segitiga yang umum digunakan adalah ....',
      options: {
        A: '20° dan 40°',
        B: '45° dan 30°/60°',
        C: '10° dan 20°',
        D: '15° dan 75°'
      },
      key: 'B',
      explanation: 'Sepasang segitiga gambar teknik terdiri dari segitiga siku-siku sama kaki 45°-45°-90° dan segitiga 30°-60°-90°.'
    },
    {
      no: 19,
      q: 'Busur derajat digunakan untuk ....',
      options: {
        A: 'membuat atau membaca arah sudut',
        B: 'membuat lingkaran besar',
        C: 'menghapus garis',
        D: 'memotong kertas'
      },
      key: 'A',
      explanation: 'Busur derajat (protractor) digunakan untuk mengukur besar derajat sudut atau menggambar sudut non-standar.'
    },
    {
      no: 20,
      q: 'Untuk pertemuan gambar teknik berikutnya, alat dan bahan minimal yang perlu disiapkan adalah ....',
      options: {
        A: 'kertas gambar, pensil H dan 2B, penghapus, penggaris lurus, sepasang segitiga, jangka, dan rautan',
        B: 'cat air, kuas lukis, dan palet warna',
        C: 'laptop, printer, dan speaker',
        D: 'spidol warna, gunting, dan lem'
      },
      key: 'A',
      explanation: 'Peralatan standar minimum juru gambar manual mencakup kertas, pensil H & 2B, penghapus lembut, penggaris lurus, sepasang segitiga, jangka, serta rautan.'
    }
  ],
  essay: [
    {
      no: 21,
      q: 'Jelaskan dengan bahasamu sendiri apa yang dimaksud dengan gambar teknik manual.',
      guide: 'Jelaskan pengertian, media alat yang digunakan, dan tujuannya.',
      sampleAnswer: 'Gambar teknik manual adalah cara menyampaikan bentuk, ukuran, dan informasi benda melalui gambar yang dibuat menggunakan peralatan gambar tangan secara terstandar agar dapat dipahami dan diwujudkan oleh teknisi pembuat.'
    },
    {
      no: 22,
      q: 'Mengapa gambar teknik disebut sebagai bahasa komunikasi dalam bidang teknik?',
      guide: 'Jelaskan hubungannya antara perancang, pembuat di bengkel, dan pengawas kualitas.',
      sampleAnswer: 'Karena gambar teknik menyampaikan informasi lengkap mengenai bentuk, ukuran, dan spesifikasi benda tanpa menimbulkan multi-tafsir antara perancang (designer), pembuat di bengkel (operator), maupun bagian pemeriksa kualitas (QC).'
    },
    {
      no: 23,
      q: 'Sebutkan minimal 4 fungsi gambar teknik dalam pekerjaan teknik.',
      guide: 'Tuliskan sedikitnya 4 fungsi penting (misal: penyampai informasi, acuan pengerjaan, dll).',
      sampleAnswer: '1) Bahasa komunikasi teknik, 2) Menjelaskan bentuk dan dimensi ukuran benda, 3) Menjadi acuan pembuatan/perakitan di bengkel, 4) Menjadi pedoman pengujian dan pemeriksaan mutu produk, 5) Menjadi dokumen arsip pekerjaan teknis.'
    },
    {
      no: 24,
      q: 'Mengapa siswa Teknik Pemesinan perlu mempelajari gambar teknik?',
      guide: 'Kaitkan dengan kesiapan praktik membubut, mengefrais, dan membaca lembar kerja.',
      sampleAnswer: 'Agar siswa mampu membaca gambar kerja dengan tepat sebelum membubut/mengefrais di bengkel mesin, mencegah salah ukuran benda kerja, melatih ketelitian kerja, dan memahami alur dari konsep hingga menjadi benda riil.'
    },
    {
      no: 25,
      q: 'Sebutkan 5 kebiasaan atau sikap kerja yang perlu dilatih dalam pembelajaran gambar teknik.',
      guide: 'Sebutkan 5 sikap profesional (contoh: teliti, rapi, dll).',
      sampleAnswer: '1) Teliti dalam mengukur dan menarik garis, 2) Rapi dan menjaga kebersihan kertas gambar, 3) Sabar dalam menyelesaikan konstruksi gambar, 4) Disiplin mematuhi standar ISO, 5) Bertanggung jawab atas kebenaran ukuran gambar.'
    },
    {
      no: 26,
      q: 'Jelaskan secara singkat alur dari sebuah ide sampai menjadi benda nyata.',
      guide: 'Gambarkan urutan alur tahapannya (Ide -> Gambar -> Produksi -> Pemeriksaan).',
      sampleAnswer: 'Timbul kebutuhan/ide masalah -> Ide dirancang dan ditentukan dimensinya -> Dituangkan ke dalam gambar teknik kerja -> Gambar diperiksa/disetujui -> Benda dibuat di bengkel berdasarkan gambar -> Hasil benda diukur dan diperiksa kembali.'
    },
    {
      no: 27,
      q: 'Mengapa kebersihan tangan, meja, alat, dan kertas perlu dijaga ketika melakukan pekerjaan gambar teknik?',
      guide: 'Jelaskan pengaruh noda grafit dan keringat terhadap keterbacaan gambar.',
      sampleAnswer: 'Agar kertas tidak kusam terkena keringat atau noda grafit yang tergesek penggaris, garis gambar tetap kontras dan mudah dibaca, serta menanamkan budaya kerja industri yang bersih dan profesional.'
    },
    {
      no: 28,
      q: 'Jelaskan perbedaan karakteristik pensil H dan pensil 2B.',
      guide: 'Jelaskan tingkat kekerasan grafit, kepekatan goresan, dan fungsinya.',
      sampleAnswer: 'Pensil H memiliki inti grafit keras sehingga menghasilkan goresan abu-abu terang dan tipis (cocok untuk garis bantu konstruksi). Pensil 2B memiliki inti grafit lunak dan pekat sehingga menghasilkan goresan hitam tegas (cocok untuk garis benda nyata dan tulisan etiket).'
    },
    {
      no: 29,
      q: 'Sebutkan minimal 6 alat gambar teknik manual beserta fungsinya.',
      guide: 'Sebutkan nama 6 alat beserta fungsinya masing-masing.',
      sampleAnswer: '1) Pensil gambar: membuat garis goresan, 2) Mistar/penggaris lurus: mengukur dan memandu garis lurus, 3) Sepasang segitiga: membuat garis tegak, miring, dan sejajar, 4) Jangka: menggambar busur dan lingkaran, 5) Penghapus: menghapus kesalahan garis tanpa merusak kertas, 6) Papan gambar: alas kerja yang datar dan stabil.'
    },
    {
      no: 30,
      q: 'Tuliskan alat dan bahan minimal yang perlu kalian siapkan untuk pertemuan gambar teknik berikutnya.',
      guide: 'Sebutkan kelengkapan mandiri yang wajib dibawa ke ruang gambar.',
      sampleAnswer: 'Kertas gambar (A4/A3), pensil gambar grade H dan 2B, penghapus pensil lembut, penggaris lurus, sepasang penggaris segitiga (45° dan 30°/60°), jangka gambar, dan rautan pensil berwadah.'
    },
    {
      no: 31,
      q: 'Jelaskan fungsi etiket pada gambar teknik dan mengapa etiket biasanya ditempatkan di sudut kanan bawah lembar gambar.',
      guide: 'Jelaskan fungsi etiket sebagai identitas resmi gambar dan alasan penempatannya di sudut kanan bawah (kemudahan membaca saat lembaran dilipat/diarsipkan).',
      sampleAnswer: 'Fungsi etiket (kepala gambar) adalah memuat seluruh identitas resmi dan informasi penting gambar kerja (judul, skala, instansi, pembuat, tanggal, dsb). Ditempatkan di sudut kanan bawah agar informasi identitas gambar tetap terlihat langsung di halaman depan saat lembar gambar dilipat atau diarsipkan dalam map binder.'
    },
    {
      no: 32,
      q: 'Sebutkan minimal 5 informasi yang biasanya dicantumkan di dalam etiket gambar teknik.',
      guide: 'Sebutkan 5 elemen informasi (contoh: judul gambar, nama instansi/sekolah, skala, nama pembuat, tanggal, nomor gambar, ukuran kertas, proyeksi).',
      sampleAnswer: '1) Judul gambar kerja, 2) Nama instansi / sekolah, 3) Nama juru gambar / pembuat, 4) Skala gambar, 5) Tanggal pembuatan / pemeriksaan, 6) Nomor lembar gambar / ukuran kertas, 7) Simbol proyeksi sudut (Eropa/Amerika).'
    },
    {
      no: 33,
      q: 'Pada etiket terdapat kolom skala. Jelaskan arti skala 1 : 1, 1 : 2, dan 2 : 1.',
      guide: 'Jelaskan mana yang merupakan skala penuh (nyata), skala pengecilan, dan skala pembesaran beserta perbandingannya.',
      sampleAnswer: '1) Skala 1 : 1 (Skala Nyata/Penuh): ukuran gambar pada kertas sama persis dengan ukuran benda sebenarnya. 2) Skala 1 : 2 (Skala Pengecilan): ukuran gambar dibuat setengah kali (2 kali lebih kecil) dari benda sebenarnya. 3) Skala 2 : 1 (Skala Pembesaran): ukuran gambar dibuat dua kali lebih besar dari benda sebenarnya.'
    },
    {
      no: 34,
      q: 'Tuliskan ukuran kertas A0, A1, A2, A3, dan A4 dalam satuan milimeter (mm).',
      guide: 'Tuliskan dimensi lebar x panjang standar ISO seri A (A0 sampai A4) dalam mm.',
      sampleAnswer: '• A0 = 841 × 1189 mm\n• A1 = 594 × 841 mm\n• A2 = 420 × 594 mm\n• A3 = 297 × 420 mm\n• A4 = 210 × 297 mm'
    },
    {
      no: 35,
      q: 'Jelaskan hubungan ukuran kertas seri A dari A0 sampai A4. Jika satu lembar A3 dibagi dua pada sisi terpanjang, akan menjadi ukuran kertas apa?',
      guide: 'Jelaskan perbandingan luas dan rasio 1:√2, serta hasil pembagian kertas A3.',
      sampleAnswer: 'Hubungan seri A memiliki rasio aspek 1 : √2 (1 : 1,414) dan luas setiap ukuran adalah separuh (setengah) dari ukuran nomor sebelumnya. Jika satu lembar kertas A3 (297 × 420 mm) dibagi dua tepat pada sisi terpanjangnya (420 mm), maka akan menghasilkan dua lembar kertas berukuran A4 (210 × 297 mm).'
    }
  ]
};

// State Manager
let postTestState = {
  activeTab: 'mcq', // 'mcq' or 'essay'
  answers: {
    mcq: {}, // 1: 'B', 2: 'C', etc.
    essay: {} // 21: '...', 22: '...', etc.
  },
  student: {
    nama: '',
    absen: '',
    kelas: 'X T. Pemesinan',
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }
};

/**
 * Load draft from localStorage
 */
function loadSavedDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.mcq) postTestState.answers.mcq = parsed.mcq;
      if (parsed.essay) postTestState.answers.essay = parsed.essay;
    }
  } catch (e) {
    console.warn('Gagal memuat draft post-test:', e);
  }

  // Load student session from auth
  const session = getStudentSession();
  if (session && session.nama) {
    postTestState.student.nama = session.nama;
    postTestState.student.absen = session.absen || '';
    postTestState.student.kelas = session.kelas || 'X T. Pemesinan';
  } else {
    postTestState.student.nama = localStorage.getItem('draftlab_student_name') || '';
  }
}

/**
 * Save draft to localStorage
 */
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(postTestState.answers));
    const indicator = document.getElementById('posttest-save-status');
    if (indicator) {
      indicator.textContent = 'Tersimpan otomatis';
    }
  } catch (e) {
    console.warn('Gagal menyimpan draf post-test:', e);
  }
}

/**
 * Calculate scores
 */
export function calculatePostTestScore() {
  let mcqCorrectCount = 0;
  POST_TEST_DATA.mcq.forEach(item => {
    if (postTestState.answers.mcq[item.no] === item.key) {
      mcqCorrectCount++;
    }
  });

  const mcqScore = mcqCorrectCount * 3; // 20 * 3 = 60 poin maksimal

  // Hitung jumlah esai yang dijawab minimal 6 karakter
  let essayAnsweredCount = 0;
  POST_TEST_DATA.essay.forEach(item => {
    const text = (postTestState.answers.essay[item.no] || '').trim();
    if (text.length >= 6) {
      essayAnsweredCount++;
    }
  });

  return {
    mcqScore,
    mcqCorrectCount,
    mcqTotalQuestions: 20,
    mcqMaxScore: 60,
    essayAnsweredCount,
    essayTotalQuestions: 15,
    essayMaxScore: 40,
    estimatedTotalScore: mcqScore + Math.round((essayAnsweredCount / 15) * 40)
  };
}

/**
 * Update UI Indicators & Navigator Pills
 */
function updatePostTestProgressUI() {
  const mcqAnsweredCount = Object.keys(postTestState.answers.mcq).filter(k => postTestState.answers.mcq[k]).length;
  const essayAnsweredCount = Object.keys(postTestState.answers.essay).filter(k => (postTestState.answers.essay[k] || '').trim().length > 3).length;
  const totalAnswered = mcqAnsweredCount + essayAnsweredCount;
  const totalQuestions = 35;
  const percentage = Math.round((totalAnswered / totalQuestions) * 100);

  // Update Counters in Action Bar & CBT Toolbar
  const countDisplay = document.getElementById('posttest-progress-counter');
  const barFill = document.getElementById('posttest-progress-bar');
  const mcqCounter = document.getElementById('posttest-mcq-count-val');
  const essayCounter = document.getElementById('posttest-essay-count-val');

  if (countDisplay) countDisplay.textContent = `${totalAnswered} / ${totalQuestions} Terjawab (${percentage}%)`;
  if (barFill) barFill.style.width = `${percentage}%`;

  if (mcqCounter) {
    mcqCounter.textContent = `${mcqAnsweredCount} / 20`;
    if (mcqAnsweredCount === 20) mcqCounter.classList.add('complete');
    else mcqCounter.classList.remove('complete');
  }

  if (essayCounter) {
    essayCounter.textContent = `${essayAnsweredCount} / 15`;
    if (essayAnsweredCount === 15) essayCounter.classList.add('complete');
    else essayCounter.classList.remove('complete');
  }

  // Update Navigator Pills
  POST_TEST_DATA.mcq.forEach(item => {
    const pill = document.querySelector(`.posttest-nav-pill[data-target-q="${item.no}"]`);
    const card = document.getElementById(`posttest-card-q${item.no}`);
    if (pill) {
      if (postTestState.answers.mcq[item.no]) {
        pill.classList.add('answered');
      } else {
        pill.classList.remove('answered');
      }
    }
    if (card) {
      if (postTestState.answers.mcq[item.no]) {
        card.classList.add('answered');
      } else {
        card.classList.remove('answered');
      }
    }
  });

  POST_TEST_DATA.essay.forEach(item => {
    const pill = document.querySelector(`.posttest-nav-pill[data-target-q="${item.no}"]`);
    const card = document.getElementById(`posttest-card-q${item.no}`);
    const isAnswered = (postTestState.answers.essay[item.no] || '').trim().length > 3;
    if (pill) {
      if (isAnswered) {
        pill.classList.add('answered');
      } else {
        pill.classList.remove('answered');
      }
    }
    if (card) {
      if (isAnswered) {
        card.classList.add('answered');
      } else {
        card.classList.remove('answered');
      }
    }
  });
}

/**
 * Switch between Bagian A (PG) and Bagian B (Esai)
 */
function switchPostTestTab(tabName) {
  postTestState.activeTab = tabName;
  const tabBtnMcq = document.getElementById('tab-posttest-mcq');
  const tabBtnEssay = document.getElementById('tab-posttest-essay');
  const sectionMcq = document.getElementById('posttest-section-mcq');
  const sectionEssay = document.getElementById('posttest-section-essay');

  if (tabName === 'mcq') {
    tabBtnMcq?.classList.add('active');
    tabBtnEssay?.classList.remove('active');
    if (sectionMcq) sectionMcq.style.display = 'block';
    if (sectionEssay) sectionEssay.style.display = 'none';
  } else {
    tabBtnEssay?.classList.add('active');
    tabBtnMcq?.classList.remove('active');
    if (sectionMcq) sectionMcq.style.display = 'none';
    if (sectionEssay) sectionEssay.style.display = 'block';
  }
}

/**
 * Submit Post-Test
 */
export async function submitPostTest(isForced = false, forceReason = '') {
  const scores = calculatePostTestScore();
  const session = getStudentSession() || {};
  const student = {
    nama: session.nama || postTestState.student.nama || 'Siswa DRAFT-LAB',
    absen: session.absen || postTestState.student.absen || '-',
    kelas: session.kelas || postTestState.student.kelas || 'X T. Pemesinan'
  };

  const unansweredActual = (20 - Object.keys(postTestState.answers.mcq).length) + (15 - scores.essayAnsweredCount);

  if (!isForced && unansweredActual > 0) {
    const proceed = confirm(`Peringatan: Ada ${unansweredActual} soal yang belum Anda isi.\n\nApakah Anda yakin ingin menyelesaikan dan mengirimkan jawaban sekarang?`);
    if (!proceed) return;
  }

  // Deactivate CBT exam lock now that test is finished
  disableCbtLock();

  const submissionId = `DL-POST-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const now = new Date();

  const record = {
    id: submissionId,
    timestamp: now.toISOString(),
    waktu: now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }),
    student,
    scores,
    answers: JSON.parse(JSON.stringify(postTestState.answers)),
    violations: cbtState.violationCount || 0,
    violationEntries: cbtState.violations ? JSON.parse(JSON.stringify(cbtState.violations)) : [],
    isForced: !!isForced,
    forceReason: forceReason || ''
  };

  // 1. Save locally to submissions history
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    existing.unshift(record);
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Gagal menyimpan riwayat penyerahan post-test:', err);
  }

  // 2. Mark module completed in app progress tracker
  localStorage.setItem(COMPLETED_STORAGE_KEY, 'true');
  if (typeof window.completeModule === 'function') {
    window.completeModule('quiz', 'Tes Pemahaman (Post-Test Evaluasi Pertemuan 1)');
  }

  // 3. Send to Google Spreadsheet in background
  sendPostTestToSpreadsheet(record);

  // 4. Render Result Screen
  showPostTestResultCard(record);
}

/**
 * Send post-test record to Google Apps Script Web App
 */
async function sendPostTestToSpreadsheet(record) {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl || scriptUrl.includes('GANTI_DENGAN_URL')) {
    return;
  }

  if (scriptUrl.includes('sheetdb.io')) {
    const row = {
      'No': 'INCREMENT',
      'ID Tiket': record.id,
      'Waktu Selesai (WIB)': record.waktu,
      'Nama Lengkap Siswa': record.student.nama,
      'No. Absen': record.student.absen,
      'Kelas': record.student.kelas,
      'Skor PG (60)': record.scores.mcqScore,
      'Benar PG (20)': `${Math.round(record.scores.mcqScore / 3)} / 20`,
      'Esai Terisi (15)': `${record.scores.essayAnsweredCount} / 15`,
      'Nilai Esai Guru (40)': '',
      'TOTAL NILAI (100)': record.scores.estimatedTotalScore,
      'Predikat Kelulusan': record.scores.mcqScore >= 50 ? 'KOMPETEN (B) ✅' : 'CUKUP (C) ⚠️',
      'Catatan CBT': record.violations ? `⚠️ ${record.violations}x Pindah Tab` : 'Tertib (0x)'
    };

    // Columns PG 1-20
    for (let i = 1; i <= 20; i++) {
      const key = POST_TEST_MCQ_KEYS[i];
      const userAns = (record.answers.mcq && record.answers.mcq[i]) ? record.answers.mcq[i] : '-';
      const colName = `PG ${i} (K: ${key})`;
      if (userAns === '-') {
        row[colName] = '-';
      } else if (userAns === key) {
        row[colName] = `${userAns} ✅`;
      } else {
        row[colName] = `${userAns} ❌ (K: ${key})`;
      }
    }

    // Columns Esai 21-35
    const essayCols = [
      'Esai 21: Fungsi Standar ISO',
      'Esai 22: Alasan Standardisasi Internasional',
      'Esai 23: Gambar Sebagai Bahasa Teknik & Acuan',
      'Esai 24: Manfaat Gambar Sebelum Mesin',
      'Esai 25: 5 Sikap Kerja Profesional Gambar',
      'Esai 26: Alur Ide Desain ke Benda Nyata',
      'Esai 27: Menjaga Kebersihan Alat & Kertas',
      'Esai 28: Karakteristik Pensil H vs 2B',
      'Esai 29: 6 Alat Gambar Teknik & Fungsinya',
      'Esai 30: Alat & Bahan yang Harus Disiapkan',
      'Esai 31: Fungsi Etiket & Sudut Kanan Bawah',
      'Esai 32: 5 Informasi Wajib Dalam Etiket',
      'Esai 33: Arti Skala 1:1, 1:2, dan 2:1',
      'Esai 34: Ukuran Kertas A0 s.d. A4 (mm)',
      'Esai 35: Hubungan Seri A & Hasil A3 Dibagi 2'
    ];
    for (let j = 0; j < essayCols.length; j++) {
      const qNum = 21 + j;
      row[essayCols[j]] = (record.answers.essay && record.answers.essay[qNum]) ? record.answers.essay[qNum] : '-';
    }

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: [row] })
      });
      console.info('[Post-Test SheetDB] Berhasil disimpan di Spreadsheet!');
    } catch (err) {
      console.warn('[Post-Test SheetDB] Gagal mengirim:', err);
    }
    return;
  }

  // Format flattened answers for spreadsheet columns
  const payload = {
    action: 'posttest',
    id: record.id,
    timestamp: record.timestamp,
    waktuLokal: record.waktu,
    nama: record.student.nama,
    absen: record.student.absen,
    kelas: record.student.kelas,
    mcqScore: record.scores.mcqScore,
    mcqScoreFormatted: `${record.scores.mcqScore}/60`,
    mcqCorrectCount: `${Math.round(record.scores.mcqScore / 3)} / 20`,
    essayAnsweredCount: record.scores.essayAnsweredCount,
    essayCountFormatted: `${record.scores.essayAnsweredCount}/15`,
    estimatedScore: record.scores.estimatedTotalScore,
    pelanggaranTab: record.violations || 0,
    statusPengerjaan: record.isForced ? `DISUBMIT OTOMATIS (${record.forceReason})` : 'Selesai Mandiri'
  };

  // MCQ answers 1-20 with correctness indicator for Google Sheets
  for (let i = 1; i <= 20; i++) {
    const key = POST_TEST_MCQ_KEYS[i];
    const userAns = (record.answers.mcq && record.answers.mcq[i]) ? record.answers.mcq[i] : '-';
    payload['q' + i] = userAns;
    if (userAns === '-') {
      payload['pg_' + i] = '-';
    } else if (userAns === key) {
      payload['pg_' + i] = `${userAns} ✅`;
    } else {
      payload['pg_' + i] = `${userAns} ❌ (K: ${key})`;
    }
  }

  // Essay answers 21-35
  for (let j = 21; j <= 35; j++) {
    payload['q' + j] = (record.answers.essay && record.answers.essay[j]) ? record.answers.essay[j] : '-';
  }

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('[Post-Test Sync] Gagal mengirim ke Spreadsheet:', err);
  }
}

/**
 * Display Result Card (Tampilan Bersih Tanda Terima Siswa - Tanpa Bocoran Rekap/Kunci)
 */
function showPostTestResultCard(record) {
  const formWrap = document.getElementById('posttest-form-view');
  const resultWrap = document.getElementById('posttest-result-view');
  if (formWrap) formWrap.style.display = 'none';
  if (resultWrap) {
    resultWrap.style.display = 'block';

    const idEl = document.getElementById('posttest-res-id');
    const studentEl = document.getElementById('posttest-res-student');
    const timeEl = document.getElementById('posttest-res-time');
    const btnCert = document.getElementById('posttest-btn-open-cert');

    if (idEl) idEl.textContent = record.id;
    if (studentEl) studentEl.textContent = `${record.student.nama} (${record.student.kelas} • Absen: ${record.student.absen})`;
    if (timeEl) timeEl.textContent = record.waktu;

    // Sembunyikan klaim sertifikat langsung (nilai esai & rekap dipegang guru)
    if (btnCert) {
      btnCert.style.display = 'none';
    }

    // Render CBT Integrity Violation Note
    const violationRow = document.getElementById('posttest-res-violations-row');
    const violationNoteEl = document.getElementById('posttest-res-violation-note');
    if (violationRow && violationNoteEl) {
      violationRow.style.display = 'flex';
      if (record.isForced) {
        violationNoteEl.style.color = '#dc2626';
        violationNoteEl.textContent = `⚠️ Disubmit Otomatis: Melanggar batas perpindahan tab (${record.violations}x)`;
      } else if (record.violations > 0) {
        violationNoteEl.style.color = '#d97706';
        violationNoteEl.textContent = `ℹ️ ${record.violations}x Perpindahan Tab/Jendela Tercatat`;
      } else {
        violationNoteEl.style.color = '#16a34a';
        violationNoteEl.textContent = `✓ Bersih (0 Pelanggaran)`;
      }
    }

    // Sembunyikan rekap pembahasan jawaban di tampilan siswa
    const reviewBox = document.querySelector('.posttest-review-container');
    if (reviewBox) reviewBox.style.display = 'none';

    disableCbtLock();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Render Review Accordion with Explanations
 */
function renderReviewAccordion(record) {
  const container = document.getElementById('posttest-review-list');
  if (!container) return;

  container.innerHTML = POST_TEST_DATA.mcq.map(item => {
    const studentAns = record.answers.mcq[item.no] || '-';
    const isCorrect = studentAns === item.key;
    const studentAnsText = item.options[studentAns] || 'Belum dijawab';
    const keyAnsText = item.options[item.key];

    return `
      <div class="posttest-review-item ${isCorrect ? 'is-correct' : 'is-wrong'}">
        <div class="posttest-review-q">Soal ${item.no}: ${item.q}</div>
        <div class="posttest-review-ans">
          <strong>Jawaban Anda:</strong> (${studentAns}) ${studentAnsText} 
          <span style="font-weight: 800; color: ${isCorrect ? '#16a34a' : '#dc2626'};">${isCorrect ? '✓ Benar (+3)' : '✗ Salah (0)'}</span>
        </div>
        ${!isCorrect ? `
          <div class="posttest-review-key">
            <strong>Kunci Jawaban yang Benar:</strong> (${item.key}) ${keyAnsText}
          </div>
        ` : ''}
        <div style="font-size: 0.8rem; color: #475569; margin-top: 0.35rem; border-top: 1px dashed #cbd5e1; padding-top: 0.35rem;">
          💡 <em>Pembahasan:</em> ${item.explanation}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Rekap Table for Developer / Teacher Mode
 */
export function renderPostTestRekapTable() {
  const tbody = document.getElementById('rekap-posttest-table-body');
  const countBadge = document.getElementById('rekap-posttest-total-count');
  if (!tbody) return;

  let submissions = [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    submissions = raw ? JSON.parse(raw) : [];
  } catch (e) {
    submissions = [];
  }

  if (countBadge) countBadge.textContent = `${submissions.length} Jawaban Post-Test`;

  if (submissions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem; color: #94a3b8;">
          Belum ada siswa yang menyelesaikan Tes Pemahaman (Post-Test).
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = submissions.map((sub, idx) => `
    <tr>
      <td><span class="rekap-num-badge">${idx + 1}</span></td>
      <td><strong>${escapeHtml(sub.student.nama)}</strong></td>
      <td>${escapeHtml(sub.student.absen)}</td>
      <td><span class="rekap-class-pill">${escapeHtml(sub.student.kelas)}</span></td>
      <td><span style="font-weight: 800; color: #16a36a;">${sub.scores.mcqScore}/60</span></td>
      <td><span style="font-weight: 700; color: #2567b9;">${sub.scores.essayAnsweredCount}/15 Esai</span></td>
      <td style="color: #64748b; font-size: 0.76rem;">${escapeHtml(sub.waktu)}</td>
    </tr>
  `).join('');
}

/**
 * Export all Post-Test submissions to Excel CSV
 */
export function exportPostTestToCsv() {
  let submissions = [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    submissions = raw ? JSON.parse(raw) : [];
  } catch (e) {
    submissions = [];
  }

  if (submissions.length === 0) {
    alert('Belum ada data pengerjaan Post-Test untuk diunduh.');
    return;
  }

  let csv = '\uFEFF';
  // Header Columns
  csv += 'No,ID Tiket,Waktu Selesai,Nama Siswa,No. Absen,Kelas,Skor PG (60),Esai Terisi (15),Pelanggaran Tab';
  for (let i = 1; i <= 20; i++) csv += `,PG Soal ${i}`;
  for (let j = 21; j <= 35; j++) csv += `,Esai Soal ${j}`;
  csv += '\r\n';

  submissions.forEach((item, idx) => {
    const s = item.student;
    const a = item.answers;
    const sc = item.scores;

    let row = [
      idx + 1,
      `"${item.id || ''}"`,
      `"${item.waktu || ''}"`,
      `"${(s.nama || '').replace(/"/g, '""')}"`,
      `"${(s.absen || '').replace(/"/g, '""')}"`,
      `"${(s.kelas || '').replace(/"/g, '""')}"`,
      sc.mcqScore,
      `${sc.essayAnsweredCount}/15`,
      item.violations || 0
    ];

    // PG 1-20
    for (let i = 1; i <= 20; i++) {
      row.push(a.mcq ? (a.mcq[i] || '-') : '-');
    }

    // Esai 21-35
    for (let j = 21; j <= 35; j++) {
      const text = a.essay ? (a.essay[j] || '-') : '-';
      row.push(`"${text.replace(/"/g, '""')}"`);
    }

    csv += row.join(',') + '\r\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Post_Test_Pemahaman_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Initialize Post-Test Module
 */
export function initPostTest() {
  loadSavedDraft();

  // Initialize and activate CBT Exam Lock (Anti-Pindah Tab)
  initCbtLock({
    maxViolations: 3,
    onAutoSubmit: (isForced, reason) => submitPostTest(isForced, reason)
  });

  const isCompleted = localStorage.getItem(COMPLETED_STORAGE_KEY) === 'true';
  if (!isCompleted) {
    const hasStarted = localStorage.getItem('draftlab_cbt_exam_started') === 'true';
    if (!hasStarted) {
      showMandatoryGate('start');
    } else {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        showMandatoryGate('relock');
      } else {
        hideMandatoryGate();
        enableCbtLock({
          maxViolations: 3,
          onAutoSubmit: (isForced, reason) => submitPostTest(isForced, reason)
        });
      }
    }
  } else {
    hideMandatoryGate();
    disableCbtLock();
  }

  // Listen for navigation to quiz tab to ensure mandatory gate is shown
  window.addEventListener('draftlab:open-quiz', () => {
    const isNowCompleted = localStorage.getItem(COMPLETED_STORAGE_KEY) === 'true';
    if (!isNowCompleted) {
      if (!cbtState.examStarted) {
        showMandatoryGate('start');
      } else if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        showMandatoryGate('relock');
      }
    }
  });

  // 1. Sync Student Name Display in Post-Test Strip
  const studentNameDisplay = document.getElementById('posttest-student-name-display');
  const studentMetaDisplay = document.getElementById('posttest-student-meta-display');
  const studentAvatarDisplay = document.getElementById('posttest-student-avatar');

  const updateStudentDisplay = () => {
    const s = postTestState.student;
    if (studentNameDisplay) studentNameDisplay.textContent = s.nama || 'Peserta Didik (Belum Login)';
    if (studentMetaDisplay) studentMetaDisplay.textContent = `Kelas: ${s.kelas} • No. Absen: ${s.absen || '-'}`;
    if (studentAvatarDisplay) studentAvatarDisplay.textContent = (s.nama ? s.nama.charAt(0) : 'P').toUpperCase();
  };
  updateStudentDisplay();

  window.addEventListener('draftlab:student-login', (e) => {
    if (e.detail) {
      postTestState.student.nama = e.detail.nama;
      postTestState.student.absen = e.detail.absen;
      postTestState.student.kelas = e.detail.kelas;
      updateStudentDisplay();
    }
  });

  // 2. Wire Tab Switcher
  const tabMcq = document.getElementById('tab-posttest-mcq');
  const tabEssay = document.getElementById('tab-posttest-essay');

  tabMcq?.addEventListener('click', () => switchPostTestTab('mcq'));
  tabEssay?.addEventListener('click', () => switchPostTestTab('essay'));

  // 3. Wire MCQ Option Buttons (1 - 20)
  for (let i = 1; i <= 20; i++) {
    const opts = document.querySelectorAll(`.posttest-mcq-opt[data-q="${i}"]`);
    opts.forEach(btn => {
      const val = btn.getAttribute('data-val');
      if (postTestState.answers.mcq[i] === val) {
        btn.classList.add('selected');
      }

      btn.addEventListener('click', () => {
        opts.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        postTestState.answers.mcq[i] = val;
        saveDraft();
        updatePostTestProgressUI();
      });
    });
  }

  // 4. Wire Essay Textareas (21 - 35)
  for (let j = 21; j <= 35; j++) {
    const textarea = document.getElementById(`posttest-essay-q${j}`);
    const charCounter = document.getElementById(`posttest-char-count-q${j}`);
    if (textarea) {
      if (postTestState.answers.essay[j]) {
        textarea.value = postTestState.answers.essay[j];
        if (charCounter) charCounter.textContent = `${textarea.value.length} karakter`;
      }

      textarea.addEventListener('input', (e) => {
        const val = e.target.value;
        postTestState.answers.essay[j] = val;
        if (charCounter) charCounter.textContent = `${val.length} karakter`;
        saveDraft();
        updatePostTestProgressUI();
      });
    }
  }

  // 5. Wire CBT Navigation Pills (Smooth jump)
  const pills = document.querySelectorAll('.posttest-nav-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const targetQ = pill.getAttribute('data-target-q');
      const targetNum = parseInt(targetQ, 10);

      // Auto switch tab if jumping between MCQ and Essay
      if (targetNum <= 20 && postTestState.activeTab !== 'mcq') {
        switchPostTestTab('mcq');
      } else if (targetNum >= 21 && postTestState.activeTab !== 'essay') {
        switchPostTestTab('essay');
      }

      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      setTimeout(() => {
        const targetCard = document.getElementById(`posttest-card-q${targetQ}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.style.outline = '2px solid #2567b9';
          setTimeout(() => {
            targetCard.style.outline = 'none';
          }, 1500);
        }
      }, 50);
    });
  });

  // 6. Wire Final Submit Button
  const btnSubmit = document.getElementById('btn-submit-posttest');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', submitPostTest);
  }

  // 7. Wire Print Result Button
  const btnPrint = document.getElementById('posttest-btn-print-result');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // 8. Wire Retry Button
  const btnRetry = document.getElementById('posttest-btn-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      if (confirm('Apakah Anda ingin mengulang pengerjaan tes pemahaman?')) {
        const formWrap = document.getElementById('posttest-form-view');
        const resultWrap = document.getElementById('posttest-result-view');
        if (formWrap) formWrap.style.display = 'block';
        if (resultWrap) resultWrap.style.display = 'none';

        cbtState.examStarted = false;
        cbtState.isSubmitted = false;
        cbtState.violationCount = 0;
        try {
          localStorage.removeItem('draftlab_cbt_exam_started');
        } catch (e) {}

        showMandatoryGate('start');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Initial UI refresh
  updatePostTestProgressUI();
}
