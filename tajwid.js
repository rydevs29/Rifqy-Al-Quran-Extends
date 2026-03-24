/* ==============================================================
   TAJWID.JS - 14 HUKUM LENGKAP (SESUAI UI QARI.MY.ID)
   ============================================================== */

const tajwidDatabase = [
    { id: "Hamzah Wasl", arab: "هَمْزَةُ الْوَصْلِ", color: "#9ca3af", class: "tj-hamzah",
      penjelasan: "Hamzah Wasl adalah hamzah yang dibaca di awal kata saat memulai bacaan, tetapi tidak dibaca ketika menyambung dari kata sebelumnya.",
      cara: "Jika memulai bacaan dari hamzah wasl, baca dengan harakat yang sesuai. Jika menyambung dari kata sebelumnya, hamzah ini tidak dibaca.",
      contoh: "ٱلْحَمْدُ - Alif-lam di awal tidak dibaca jika menyambung" },
    { id: "Idgham Syamsiyah", arab: "لَام شَمْسِيَّة", color: "#3b82f6", class: "tj-idgham_syam",
      penjelasan: "Lam Syamsiyah terjadi ketika huruf lam pada 'ال' bertemu dengan salah satu dari 14 huruf syamsiyah. Lam tidak dibaca dan huruf setelahnya dibaca dengan tasydid.",
      cara: "Tidak membunyikan huruf lam, langsung membaca huruf setelahnya dengan tasydid (penekanan ganda).",
      contoh: "الشَّمْسُ - dibaca 'asy-syams' bukan 'al-syams'" },
    { id: "Ghunnah (Dengung)", arab: "غُنَّة", color: "#f97316", class: "tj-ghunnah",
      penjelasan: "Ghunnah adalah dengung yang keluar dari pangkal hidung. Panjangnya sekitar 2 harakat. Ghunnah muncul pada nun dan mim yang bertasydid.",
      cara: "Keluarkan suara dengung dari hidung selama 2 harakat sambil mulut tertutup untuk mim atau terbuka sesuai harakat untuk nun.",
      contoh: "إِنَّ - nun bertasydid, dengungkan selama 2 ketukan" },
    { id: "Ikhfa", arab: "إِخْفَاء حَقِيقِي", color: "#ec4899", class: "tj-ikhfa",
      penjelasan: "Ikhfa Haqiqi terjadi ketika nun mati atau tanwin bertemu dengan 15 huruf ikhfa. Bacaannya disamarkan antara izhar dan idgham dengan disertai ghunnah.",
      cara: "Bacaan nun/tanwin disamarkan (tidak jelas) dengan disertai dengung 2 harakat. Lidah diposisikan mendekati makhraj huruf setelahnya.",
      contoh: "مِنْ قَبْلُ - nun mati bertemu qaf, samarkan dengan ghunnah" },
    { id: "Madd (Panjang)", arab: "مَدّ", color: "#ef4444", class: "tj-mad",
      penjelasan: "Madd adalah pemanjangan suara pada huruf mad (ا و ي). Panjangnya bervariasi dari 2 hingga 6 harakat tergantung jenis madd-nya.",
      cara: "Panjangkan suara pada huruf mad sesuai dengan jenis madd-nya. Thabi'i = 2 harakat, Wajib/Jaiz = 4-5 harakat, Lazim = 6 harakat.",
      contoh: "قَالُوْا - alif setelah qaf, panjangkan 2 harakat" },
    { id: "Qalqalah", arab: "قَلْقَلَة", color: "#10b981", class: "tj-qalqalah",
      penjelasan: "Qalqalah adalah pantulan suara yang terjadi pada 5 huruf qalqalah (ق ط ب ج د) ketika huruf tersebut mati atau berhenti.",
      cara: "Bunyikan huruf dengan pantulan atau getaran pendek dari makhrajnya. Qalqalah di akhir ayat (Kubra) lebih kuat dari di tengah kata (Sughra).",
      contoh: "يَخْلُقُ - qaf mati di akhir, beri pantulan 'qo'" },
    { id: "Iqlab", arab: "إِقْلَاب", color: "#8b5cf6", class: "tj-iqlab",
      penjelasan: "Iqlab terjadi ketika nun mati atau tanwin bertemu dengan huruf ba (ب). Nun/tanwin diubah menjadi bunyi mim dan dibaca ikhfa (samar) dengan ghunnah.",
      cara: "Ubah bunyi nun/tanwin menjadi mim, lalu samarkan bacaannya dengan dengung 2 harakat sebelum huruf ba.",
      contoh: "مِنْ بَعْدِ - dibaca 'mim ba\\'di' dengan ghunnah" },
    { id: "Idgham", arab: "إِدْغَام", color: "#06b6d4", class: "tj-idgham",
      penjelasan: "Idgham adalah memasukkan bunyi nun mati/tanwin ke dalam huruf setelahnya sehingga menjadi satu bunyi. Terdiri dari Bi Ghunnah (dengung) dan Bila Ghunnah (tanpa dengung).",
      cara: "Masukkan nun/tanwin ke huruf berikutnya dengan dengung 2 harakat (untuk Ya, Nun, Mim, Waw). Untuk Lam dan Ra langsung tanpa dengung.",
      contoh: "مَنْ يَقُوْلُ - nun masuk ke ya dengan ghunnah" },
    { id: "Ikhfa Syafawi", arab: "إِخْفَاء شَفَوِي", color: "#d946ef", class: "tj-ikhfa_syaf",
      penjelasan: "Ikhfa Syafawi terjadi ketika mim mati (مْ) bertemu dengan huruf ba (ب). Mim disembunyikan (disamarkan) dengan bibir hampir tertutup disertai ghunnah.",
      cara: "Rapatkan bibir tapi jangan sampai menempel sempurna, keluarkan suara dengung dari hidung selama 2 harakat.",
      contoh: "تَرْمِيهِمْ بِحِجَارَةٍ - mim mati bertemu ba, samarkan dengan ghunnah" },
    { id: "Saktah (Berhenti Sejenak)", arab: "سَكْتَة", color: "#64748b", class: "tj-saktah",
      penjelasan: "Saktah adalah berhenti sejenak tanpa bernapas (sekitar 2 harakat) di tempat-tempat tertentu dalam Al-Quran (Riwayat Hafs).",
      cara: "Berhenti sejenak tanpa mengambil napas, cukup potong suara sesaat kemudian lanjutkan bacaan.",
      contoh: "عِوَجًا ۜ قَيِّمًا - berhenti sejenak sebelum melanjutkan" },
    { id: "Idgham Mutamatsilain", arab: "إِدْغَام مُتَمَاثِلَيْن", color: "#0ea5e9", class: "tj-mutamatsilain",
      penjelasan: "Idgham Mutamatsilain (Idgham Mimi) terjadi ketika mim mati bertemu dengan mim berharakat. Mim pertama dimasukkan ke mim kedua.",
      cara: "Masukkan mim pertama ke mim kedua secara sempurna, lalu dengungkan selama 2 harakat.",
      contoh: "فِي قُلُوبِهِمْ مَرَضٌ - mim mati bertemu mim" },
    { id: "Idgham Mutaqaribain", arab: "إِدْغَام مُتَقَارِبَيْن", color: "#14b8a6", class: "tj-mutaqaribain",
      penjelasan: "Idgham Mutaqaribain terjadi ketika dua huruf yang berdekatan makhrajnya bertemu, sehingga huruf pertama dimasukkan ke huruf kedua (contoh Qaf+Kaf).",
      cara: "Masukkan huruf pertama ke huruf kedua karena makhraj keduanya berdekatan.",
      contoh: "أَلَمْ نَخْلُقْكُمْ - qaf masuk ke kaf" },
    { id: "Idgham Mutajanisain", arab: "إِدْغَام مُتَجَانِسَيْن", color: "#6366f1", class: "tj-mutajanisain",
      penjelasan: "Idgham Mutajanisain terjadi ketika dua huruf yang sama makhrajnya tetapi berbeda sifatnya bertemu.",
      cara: "Masukkan huruf pertama ke huruf kedua secara sempurna karena makhraj keduanya sama.",
      contoh: "قَدْ تَبَيَّنَ - dal masuk ke ta" },
    { id: "Izhar (Jelas)", arab: "إِظْهَار حَلْقِي", color: "#eab308", class: "tj-idzhar",
      penjelasan: "Izhar Halqi terjadi ketika nun mati atau tanwin bertemu dengan salah satu dari 6 huruf halqi (ء ه ع ح غ خ).",
      cara: "Baca nun mati atau tanwin dengan jelas tanpa dengung. Langsung bunyikan huruf halqi setelahnya.",
      contoh: "مِنْ عِنْدِ - nun mati bertemu ain, baca jelas" }
];

document.addEventListener('DOMContentLoaded', () => { renderTajwidGuide(); });

window.openTajwidGuide = function() {
    document.getElementById('modal-tajwid-guide').style.display = 'flex';
};

function renderTajwidGuide() {
    const list = document.getElementById('tajwid-guide-list');
    if(!list) return;
    list.innerHTML = tajwidDatabase.map((t, i) => `
        <div class="tg-item" style="background:#1e293b; border-color:#334155; color:white;">
            <div class="tg-header" onclick="toggleTG(${i})" style="color:white;">
                <div class="tg-color-box" style="background-color: ${t.color}; color:white; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:18px;">${t.id.charAt(0)}</div>
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:15px;">${t.id}</div>
                    <div class="font-arab" style="font-size:14px; color:#94a3b8; font-weight:normal;">${t.arab}</div>
                </div>
                <i class="fas fa-chevron-down" id="tg-icon-${i}"></i>
            </div>
            <div class="tg-body" id="tg-body-${i}" style="color:#cbd5e1;">
                <div style="padding: 10px 0;">
                    <div style="margin-bottom:15px;">
                        <div class="t-section-title" style="color:#60a5fa;"><i class="fas fa-info-circle"></i> Penjelasan</div>
                        <p style="font-size:13px; line-height:1.6;">${t.penjelasan}</p>
                    </div>
                    <div style="margin-bottom:15px;">
                        <div class="t-section-title" style="color:#fbbf24;"><i class="fas fa-lightbulb"></i> Cara Membaca</div>
                        <p style="font-size:13px; line-height:1.6;">${t.cara}</p>
                    </div>
                    <div>
                        <div class="t-section-title" style="color:#34d399;"><i class="fas fa-book-open"></i> Contoh</div>
                        <p style="font-size:13px; line-height:1.6;"><span class="font-arab" style="font-size:18px;">${t.contoh.split(' - ')[0]}</span> - ${t.contoh.split(' - ')[1] || ''}</p>
                    </div>
                </div>
            </div>
        </div>`).join('');
}

function toggleTG(idx) {
    const b = document.getElementById(`tg-body-${idx}`); const c = document.getElementById(`tg-icon-${idx}`);
    if(b.classList.contains('open')) { b.classList.remove('open'); c.classList.replace('fa-chevron-up', 'fa-chevron-down'); } 
    else { b.classList.add('open'); c.classList.replace('fa-chevron-down', 'fa-chevron-up'); }
}

// --- FUNGSI MUNCULIN POPUP SAAT BACA AL-QURAN ---
window.showTajwidInfo = function(jenis, huruf) {
    const tData = tajwidDatabase.find(t => t.id.includes(jenis) || jenis.includes(t.id)) || tajwidDatabase[0];
    
    document.getElementById('t-info-icon').innerText = tData.id.charAt(0);
    document.getElementById('t-info-icon').style.backgroundColor = tData.color;
    document.getElementById('t-info-title').innerText = tData.id;
    document.getElementById('t-info-arab').innerText = tData.arab;
    
    document.getElementById('t-info-desc').innerText = tData.penjelasan;
    document.getElementById('t-info-cara').innerText = tData.cara;
    
    const contohParts = tData.contoh.split(' - ');
    document.getElementById('t-info-contoh').innerText = contohParts[0];
    document.getElementById('t-info-contoh-desc').innerText = contohParts[1] || '';
    
    document.getElementById('t-info-letters').innerText = huruf;
    document.getElementById('modal-tajwid-info').style.display = 'flex';
};

// --- REGEX DETEKSI TAJWID PADA TEKS ARAB ---
window.applyTajwid = function(text) {
    return text.replace(/([نم])[\u0651]/g, `<span class="t-rule tj-ghunnah" onclick="showTajwidInfo('Ghunnah', '$&')">$&</span>`)
            .replace(/([بجدطق])\u0652/g, `<span class="t-rule tj-qalqalah" onclick="showTajwidInfo('Qalqalah', '$&')">$&</span>`)
            .replace(/[\u0653]/g, `<span class="t-rule tj-mad" onclick="showTajwidInfo('Madd', '$&')">$&</span>`)
            .replace(/[\u06E2]/g, `<span class="t-rule tj-iqlab" onclick="showTajwidInfo('Iqlab', '$&')">$&</span>`)
            .replace(/[\u064B\u064C\u064D]/g, `<span class="t-rule tj-ikhfa" onclick="showTajwidInfo('Ikhfa', '$&')">$&</span>`);
};
