/* ==============================================================
   TAJWID.JS - 14 HUKUM TAJWID DATABASE & REGEX FIXED
   ============================================================== */

const tajwidDatabase = [
    { id: "Hamzah Wasl", arab: "هَمْزَةُ الْوَصْلِ", color: "#9ca3af", class: "tj-hamzah", penjelasan: "Hamzah yang dibaca di awal kata saat memulai bacaan, tetapi tidak dibaca ketika menyambung dari kata sebelumnya.", cara: "Jika memulai bacaan dari hamzah wasl, baca dengan harakat yang sesuai. Jika menyambung, hamzah ini tidak dibaca.", contoh: "ٱلْحَمْدُ - Alif-lam di awal tidak dibaca jika menyambung" },
    { id: "Idgham Syamsiyah", arab: "لَام شَمْسِيَّة", color: "#3b82f6", class: "tj-idgham-syam", penjelasan: "Lam Syamsiyah terjadi ketika huruf lam pada 'ال' bertemu huruf syamsiyah. Lam tidak dibaca dan huruf setelahnya ditasydidkan.", cara: "Tidak membunyikan huruf lam, langsung membaca huruf setelahnya dengan tasydid.", contoh: "الشَّمْسُ - dibaca 'asy-syams'" },
    { id: "Ghunnah (Dengung)", arab: "غُنَّة", color: "#f97316", class: "tj-ghunnah", penjelasan: "Ghunnah adalah dengung dari pangkal hidung (2 harakat) pada nun dan mim bertasydid.", cara: "Keluarkan suara dengung dari hidung selama 2 harakat.", contoh: "إِنَّ - nun bertasydid, dengungkan 2 ketukan" },
    { id: "Ikhfa", arab: "إِخْفَاء حَقِيقِي", color: "#ec4899", class: "tj-ikhfa", penjelasan: "Nun mati/tanwin bertemu 15 huruf ikhfa. Disamarkan antara izhar dan idgham disertai ghunnah.", cara: "Bacaan disamarkan dengan dengung 2 harakat.", contoh: "مِنْ قَبْلُ - samarkan dengan ghunnah" },
    { id: "Madd (Panjang)", arab: "مَدّ", color: "#ef4444", class: "tj-mad", penjelasan: "Pemanjangan suara pada huruf mad (ا و ي) atau tanda bendera.", cara: "Panjangkan suara 2 hingga 6 harakat.", contoh: "قَالُوْا - panjangkan 2 harakat" },
    { id: "Qalqalah", arab: "قَلْقَلَة", color: "#10b981", class: "tj-qalqalah", penjelasan: "Pantulan suara pada huruf (ق ط ب ج د) ketika sukun/berhenti.", cara: "Bunyikan huruf dengan pantulan dari makhrajnya.", contoh: "يَخْلُقُ - pantulan 'qo'" },
    { id: "Iqlab", arab: "إِقْلَاب", color: "#8b5cf6", class: "tj-iqlab", penjelasan: "Nun mati/tanwin bertemu ba (ب). Diubah menjadi mim dan dibaca samar dengan ghunnah.", cara: "Ubah bunyi menjadi mim, samarkan dengan dengung.", contoh: "مِنْ بَعْدِ - dibaca 'mim ba'di'" },
    { id: "Idgham", arab: "إِدْغَام", color: "#06b6d4", class: "tj-idgham", penjelasan: "Memasukkan bunyi nun mati/tanwin ke huruf setelahnya (Bighunnah & Bilaghunnah).", cara: "Masukkan ke huruf berikutnya dengan atau tanpa dengung.", contoh: "مَنْ يَقُوْلُ - masuk ke ya dengan ghunnah" },
    { id: "Ikhfa Syafawi", arab: "إِخْفَاء شَفَوِي", color: "#d946ef", class: "tj-ikhfa-syaf", penjelasan: "Mim mati (مْ) bertemu huruf ba (ب). Disembunyikan dengan bibir hampir tertutup.", cara: "Rapatkan bibir tapi jangan menempel sempurna, dengungkan 2 harakat.", contoh: "تَرْمِيهِمْ بِحِجَارَةٍ - mim mati bertemu ba" },
    { id: "Saktah", arab: "سَكْتَة", color: "#64748b", class: "tj-saktah", penjelasan: "Berhenti sejenak tanpa bernapas (2 harakat) di tempat tertentu (Hafs).", cara: "Berhenti sejenak tanpa mengambil napas.", contoh: "عِوَجًا ۜ قَيِّمًا - berhenti sejenak" },
    { id: "Idgham Mutamatsilain", arab: "إِدْغَام مُتَمَاثِلَيْن", color: "#0ea5e9", class: "tj-mutamatsilain", penjelasan: "Mim mati bertemu mim berharakat. Dimasukkan dengan sempurna disertai ghunnah.", cara: "Masukkan mim pertama ke mim kedua, dengungkan 2 harakat.", contoh: "فِي قُلُوبِهِمْ مَرَضٌ - mim mati bertemu mim" },
    { id: "Idgham Mutaqaribain", arab: "إِدْغَام مُتَقَارِبَيْن", color: "#14b8a6", class: "tj-mutaqaribain", penjelasan: "Dua huruf berdekatan makhraj bertemu, huruf pertama masuk ke kedua.", cara: "Masukkan huruf pertama ke huruf kedua.", contoh: "أَلَمْ نَخْلُقْكُمْ - qaf masuk ke kaf" },
    { id: "Idgham Mutajanisain", arab: "إِدْغَام مُتَجَانِسَيْن", color: "#6366f1", class: "tj-mutajanisain", penjelasan: "Dua huruf sama makhraj tetapi beda sifat bertemu.", cara: "Masukkan huruf pertama ke kedua secara sempurna.", contoh: "قَدْ تَبَيَّنَ - dal masuk ke ta" },
    { id: "Izhar (Jelas)", arab: "إِظْهَار حَلْقِي", color: "#eab308", class: "tj-idzhar", penjelasan: "Nun mati/tanwin bertemu 6 huruf halqi. Dibaca jelas tanpa ghunnah.", cara: "Baca nun/tanwin dengan jelas tanpa dengung.", contoh: "مِنْ عِنْدِ - baca jelas tanpa ghunnah" }
];

document.addEventListener('DOMContentLoaded', () => {
    // Jalankan setelah Modal siap
    setTimeout(() => {
        const list = document.getElementById('tajwid-guide-list');
        if(!list) return;
        list.innerHTML = tajwidDatabase.map((t, i) => `
            <div class="tg-item" style="background:#1e293b; border-color:#334155; color:white;">
                <div class="tg-header" onclick="toggleTG(${i})" style="color:white;">
                    <div class="tg-color-box" style="background-color: ${t.color}; color:white; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:18px;">${t.id.charAt(0)}</div>
                    <div style="flex:1;"><div style="font-weight:bold; font-size:15px;">${t.id}</div><div class="font-arab" style="font-size:14px; color:#94a3b8; font-weight:normal;">${t.arab}</div></div>
                    <i class="fas fa-chevron-down" id="tg-icon-${i}"></i>
                </div>
                <div class="tg-body" id="tg-body-${i}" style="color:#cbd5e1;">
                    <div style="padding: 10px 0;">
                        <div style="margin-bottom:15px;"><div class="t-section-title" style="color:#60a5fa;"><i class="fas fa-info-circle"></i> Penjelasan</div><p style="font-size:13px; line-height:1.6;">${t.penjelasan}</p></div>
                        <div style="margin-bottom:15px;"><div class="t-section-title" style="color:#fbbf24;"><i class="fas fa-lightbulb"></i> Cara Membaca</div><p style="font-size:13px; line-height:1.6;">${t.cara}</p></div>
                        <div><div class="t-section-title" style="color:#34d399;"><i class="fas fa-book-open"></i> Contoh</div><p style="font-size:13px; line-height:1.6;"><span class="font-arab" style="font-size:18px;">${t.contoh.split(' - ')[0]}</span> - ${t.contoh.split(' - ')[1] || ''}</p></div>
                    </div>
                </div>
            </div>`).join('');
    }, 500);
});

window.openTajwidGuide = function() {
    document.getElementById('modal-lainnya').style.display = 'none';
    document.getElementById('modal-tajwid-guide').style.display = 'flex';
};

window.toggleTG = function(idx) {
    const b = document.getElementById(`tg-body-${idx}`); const c = document.getElementById(`tg-icon-${idx}`);
    if(b.classList.contains('open')) { b.classList.remove('open'); c.classList.replace('fa-chevron-up', 'fa-chevron-down'); } 
    else { b.classList.add('open'); c.classList.replace('fa-chevron-down', 'fa-chevron-up'); }
};

// --- FUNGSI MUNCULIN POPUP SAAT BACA AL-QURAN ---
window.showTajwidInfo = function(event, jenis, huruf) {
    event.stopPropagation(); // Mencegah bentrok dengan klik lainnya
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
    return text
        .replace(/([نم])[\u0651]/g, `<span class="t-rule tj-ghunnah" onclick="window.showTajwidInfo(event, 'Ghunnah', this.innerText)">$&</span>`)
        .replace(/([بجدطق])\u0652/g, `<span class="t-rule tj-qalqalah" onclick="window.showTajwidInfo(event, 'Qalqalah', this.innerText)">$&</span>`)
        .replace(/[\u0653]/g, `<span class="t-rule tj-mad" onclick="window.showTajwidInfo(event, 'Madd', this.innerText)">$&</span>`)
        .replace(/[\u06E2]/g, `<span class="t-rule tj-iqlab" onclick="window.showTajwidInfo(event, 'Iqlab', this.innerText)">$&</span>`)
        .replace(/[\u064B\u064C\u064D]/g, `<span class="t-rule tj-ikhfa" onclick="window.showTajwidInfo(event, 'Ikhfa', this.innerText)">$&</span>`);
};
