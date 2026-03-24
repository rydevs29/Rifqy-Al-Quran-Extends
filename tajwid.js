/* ==============================================================
   TAJWID.JS - DATABASE 14 HUKUM & SUPER REGEX ENGINE
   ============================================================== */

const tajwidDatabase = [
    { id: "Hamzah Wasl", arab: "هَمْزَةُ الْوَصْلِ", color: "#9ca3af", class: "tj-hamzah",
      penjelasan: "Hamzah yang dibaca di awal kata saat memulai bacaan, tetapi tidak dibaca ketika menyambung dari kata sebelumnya.",
      cara: "Jika memulai bacaan dari hamzah wasl, baca dengan harakat yang sesuai. Jika menyambung, hamzah ini tidak dibaca.",
      contoh: "ٱلْحَمْدُ - Alif-lam di awal tidak dibaca jika menyambung" },
    { id: "Idgham Syamsiyah", arab: "لَام شَمْسِيَّة", color: "#3b82f6", class: "tj-idgham-syam",
      penjelasan: "Terjadi ketika Alif Lam (ال) bertemu salah satu dari 14 huruf syamsiyah. Huruf Lam tidak dibaca.",
      cara: "Tidak membunyikan huruf lam, melainkan langsung membaca huruf setelahnya dengan tasydid.",
      contoh: "الشَّمْسُ - dibaca 'asy-syams' bukan 'al-syams'" },
    { id: "Ghunnah", arab: "غُنَّة", color: "#f97316", class: "tj-ghunnah",
      penjelasan: "Ghunnah adalah dengung yang keluar dari pangkal hidung. Terjadi pada huruf Nun (ن) dan Mim (م) yang bertasydid.",
      cara: "Keluarkan suara dengung dari hidung dan tahan selama 2 harakat (ketukan).",
      contoh: "إِنَّ - nun bertasydid, dengungkan 2 ketukan" },
    { id: "Ikhfa", arab: "إِخْفَاء حَقِيقِي", color: "#ec4899", class: "tj-ikhfa",
      penjelasan: "Ikhfa Haqiqi terjadi ketika Nun Mati atau Tanwin bertemu dengan 15 huruf ikhfa (ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك).",
      cara: "Bacaan disamarkan antara izhar dan idgham, dan disertai dengan dengung (ghunnah) 2 harakat.",
      contoh: "مِنْ قَبْلُ - nun mati bertemu qaf, samarkan dengan ghunnah" },
    { id: "Madd", arab: "مَدّ", color: "#ef4444", class: "tj-mad",
      penjelasan: "Madd adalah pemanjangan suara. Ditandai dengan huruf mad atau tanda bendera (Madd Wajib/Jaiz/Lazim).",
      cara: "Panjangkan suara mulai dari 2, 4, 5, hingga 6 harakat tergantung jenis mad-nya.",
      contoh: "قَالُوْا - panjangkan 2 harakat" },
    { id: "Qalqalah", arab: "قَلْقَلَة", color: "#10b981", class: "tj-qalqalah",
      penjelasan: "Pantulan suara yang terjadi pada 5 huruf qalqalah (ق ط ب ج د) ketika huruf tersebut bersukun atau diwaqafkan (berhenti).",
      cara: "Bunyikan huruf dengan pantulan atau getaran pendek dari makhrajnya.",
      contoh: "يَخْلُقُ - qaf mati di akhir, beri pantulan 'qo'" },
    { id: "Iqlab", arab: "إِقْلَاب", color: "#8b5cf6", class: "tj-iqlab",
      penjelasan: "Terjadi ketika Nun Mati atau Tanwin bertemu dengan huruf Ba (ب). Bunyi Nun/Tanwin diubah menjadi Mim.",
      cara: "Ubah bunyi Nun/Tanwin menjadi Mim, lalu samarkan bacaannya dengan dengung 2 harakat.",
      contoh: "مِنْ بَعْدِ - dibaca 'mim ba'di' dengan ghunnah" },
    { id: "Idgham Bighunnah", arab: "إِدْغَام بِغُنَّة", color: "#06b6d4", class: "tj-idgham",
      penjelasan: "Memasukkan bunyi Nun Mati/Tanwin ke dalam huruf setelahnya (ي ن م و) disertai dengan dengung.",
      cara: "Masukkan bunyi Nun/Tanwin ke huruf berikutnya dan tahan dengan dengung 2 harakat.",
      contoh: "مَنْ يَقُوْلُ - masuk ke ya dengan ghunnah" },
    { id: "Idgham Bilaghunnah", arab: "إِدْغَام بِلَاغُنَّة", color: "#06b6d4", class: "tj-idgham",
      penjelasan: "Memasukkan bunyi Nun Mati/Tanwin ke dalam huruf Lam (ل) atau Ra (ر) tanpa disertai dengung.",
      cara: "Langsung bunyikan huruf berikutnya dengan tasydid tanpa ditahan/didengungkan.",
      contoh: "مِنْ رَبِّهِم - dibaca 'mir-rabbihim' tanpa dengung" },
    { id: "Ikhfa Syafawi", arab: "إِخْفَاء شَفَوِي", color: "#d946ef", class: "tj-ikhfa-syaf",
      penjelasan: "Terjadi ketika Mim Mati (مْ) bertemu dengan huruf Ba (ب).",
      cara: "Mim disembunyikan dengan bibir hampir tertutup dan disertai dengung (ghunnah) 2 harakat.",
      contoh: "تَرْمِيهِمْ بِحِجَارَةٍ - mim mati bertemu ba" },
    { id: "Saktah", arab: "سَكْتَة", color: "#64748b", class: "tj-saktah",
      penjelasan: "Berhenti sejenak tanpa mengambil napas baru (sekitar 2 harakat) di tempat-tempat tertentu.",
      cara: "Putus suara sejenak tanpa mengambil napas, kemudian lanjutkan bacaan.",
      contoh: "عِوَجًا ۜ قَيِّمًا - berhenti sejenak sebelum 'qayyima'" },
    { id: "Idgham Mutamatsilain", arab: "إِدْغَام مُتَمَاثِلَيْن", color: "#0ea5e9", class: "tj-mutamatsilain",
      penjelasan: "Juga disebut Idgham Mimi. Terjadi ketika Mim Mati (مْ) bertemu dengan Mim (م) berharakat.",
      cara: "Masukkan Mim pertama ke Mim kedua secara sempurna, lalu dengungkan selama 2 harakat.",
      contoh: "فِي قُلُوبِهِمْ مَرَضٌ - mim mati bertemu mim" },
    { id: "Idgham Mutaqaribain", arab: "إِدْغَام مُتَقَارِبَيْن", color: "#14b8a6", class: "tj-mutaqaribain",
      penjelasan: "Terjadi ketika dua huruf yang berdekatan makhrajnya bertemu, huruf pertama mati.",
      cara: "Masukkan huruf pertama ke dalam huruf kedua secara sempurna.",
      contoh: "أَلَمْ نَخْلُقْكُمْ - qaf masuk ke kaf" },
    { id: "Idgham Mutajanisain", arab: "إِدْغَام مُتَجَانِسَيْن", color: "#6366f1", class: "tj-mutajanisain",
      penjelasan: "Terjadi ketika dua huruf yang sama makhrajnya tetapi berbeda sifatnya bertemu.",
      cara: "Masukkan huruf pertama ke huruf kedua secara sempurna tanpa pantulan.",
      contoh: "قَدْ تَبَيَّنَ - dal masuk ke ta" },
    { id: "Izhar", arab: "إِظْهَار حَلْقِي", color: "#eab308", class: "tj-idzhar",
      penjelasan: "Izhar Halqi terjadi ketika Nun Mati atau Tanwin bertemu 6 huruf tenggorokan (ء ه ع ح غ خ).",
      cara: "Baca Nun Mati atau Tanwin dengan JELAS, tegas, dan tanpa dengung sama sekali.",
      contoh: "مِنْ عِنْدِ - baca jelas tanpa ghunnah" }
];

document.addEventListener('DOMContentLoaded', () => {
    // Generate Menu Panduan saat web dimuat
    setTimeout(renderTajwidGuide, 500);
});

// --- MENU PANDUAN LENGKAP ---
function renderTajwidGuide() {
    const list = document.getElementById('tajwid-guide-list');
    if(!list) return;
    
    list.innerHTML = tajwidDatabase.map((t, i) => `
        <div class="tg-item" style="background:#1e293b; border-color:#334155; color:white; margin-bottom: 12px; border-radius: 12px; overflow: hidden;">
            <div class="tg-header" onclick="toggleTG(${i})" style="padding: 15px; display: flex; align-items: center; cursor: pointer;">
                <div class="tg-color-box" style="background-color: ${t.color}; color:white; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:18px; width: 40px; height: 40px; border-radius: 10px; margin-right: 15px; flex-shrink: 0;">${t.id.charAt(0)}</div>
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:16px;">${t.id}</div>
                    <div class="font-arab" style="font-size:14px; color:#94a3b8; font-weight:normal; margin-top: 2px;">${t.arab}</div>
                </div>
                <i class="fas fa-chevron-down" id="tg-icon-${i}"></i>
            </div>
            <div class="tg-body" id="tg-body-${i}" style="max-height: 0; overflow: hidden; transition: 0.3s; padding: 0 15px; color:#cbd5e1; background-color:#0f172a;">
                <div style="padding: 15px 0;">
                    <div style="margin-bottom:15px;">
                        <div class="t-section-title" style="color:#60a5fa; font-weight:bold; font-size: 11px; margin-bottom: 5px;"><i class="fas fa-info-circle"></i> PENJELASAN</div>
                        <p style="font-size:13px; line-height:1.6;">${t.penjelasan}</p>
                    </div>
                    <div style="margin-bottom:15px;">
                        <div class="t-section-title" style="color:#fbbf24; font-weight:bold; font-size: 11px; margin-bottom: 5px;"><i class="fas fa-lightbulb"></i> CARA MEMBACA</div>
                        <p style="font-size:13px; line-height:1.6;">${t.cara}</p>
                    </div>
                    <div>
                        <div class="t-section-title" style="color:#34d399; font-weight:bold; font-size: 11px; margin-bottom: 5px;"><i class="fas fa-book-open"></i> CONTOH</div>
                        <p style="font-size:13px; line-height:1.6;"><span class="font-arab" style="font-size:22px; color:white;">${t.contoh.split(' - ')[0]}</span> - ${t.contoh.split(' - ')[1] || ''}</p>
                    </div>
                </div>
            </div>
        </div>`).join('');
}

window.openTajwidGuide = function() {
    document.getElementById('modal-lainnya').style.display = 'none';
    document.getElementById('modal-tajwid-guide').style.display = 'flex';
};

window.toggleTG = function(idx) {
    const b = document.getElementById(`tg-body-${idx}`); const c = document.getElementById(`tg-icon-${idx}`);
    if(b.style.maxHeight && b.style.maxHeight !== '0px') { 
        b.style.maxHeight = '0px'; 
        c.classList.replace('fa-chevron-up', 'fa-chevron-down'); 
    } else { 
        b.style.maxHeight = '500px'; 
        c.classList.replace('fa-chevron-down', 'fa-chevron-up'); 
    }
};

// --- FUNGSI MUNCULIN POPUP SAAT BACA AL-QURAN ---
window.showTajwidInfo = function(event, jenis, huruf) {
    event.stopPropagation(); // Mencegah klik bertabrakan dengan layar baca
    
    // Ambil data yang persis namanya
    const tData = tajwidDatabase.find(t => t.id === jenis || t.id.includes(jenis)) || tajwidDatabase[0];
    
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

// --- SUPER ADVANCED REGEX ENGINE (Mendeteksi Lebih Banyak & Lebih Akurat) ---
window.applyTajwid = function(text) {
    // Variabel skip: Melompati spasi, Alif pembantu, atau tag span yang mungkin ada di antaranya
    const skip = "(?:<[^>]+>)*[\\sاىأإ]*";
    
    return text
        // 1. Ghunnah (Nun/Mim + Tasydid)
        .replace(/([نم][\u064E-\u0650]?[\u0651])/g, `<span class="t-rule tj-ghunnah" onclick="window.showTajwidInfo(event, 'Ghunnah', this.innerText)">$&</span>`)
        
        // 2. Qalqalah (Qaf, Tha, Ba, Jim, Dal + Sukun)
        .replace(/([بجدطق][\u0652])/g, `<span class="t-rule tj-qalqalah" onclick="window.showTajwidInfo(event, 'Qalqalah', this.innerText)">$&</span>`)
        
        // 3. Madd (Tanda Bendera/Layar)
        .replace(/([\u0653])/g, `<span class="t-rule tj-mad" onclick="window.showTajwidInfo(event, 'Madd', this.innerText)">$&</span>`)
        
        // 4. Iqlab (Tanda Mim Kecil di atas)
        .replace(/([\u06E2])/g, `<span class="t-rule tj-iqlab" onclick="window.showTajwidInfo(event, 'Iqlab', this.innerText)">$&</span>`)
        
        // 5. Ikhfa Syafawi (Mim Mati ketemu Ba)
        .replace(new RegExp(`(م[\u0652]?)(?=${skip}ب)`, 'g'), `<span class="t-rule tj-ikhfa-syaf" onclick="window.showTajwidInfo(event, 'Ikhfa Syafawi', this.innerText)">$&</span>`)
        
        // 6. Idgham Mutamatsilain / Mimi (Mim Mati ketemu Mim)
        .replace(new RegExp(`(م[\u0652]?)(?=${skip}م)`, 'g'), `<span class="t-rule tj-mutamatsilain" onclick="window.showTajwidInfo(event, 'Idgham Mutamatsilain', this.innerText)">$&</span>`)
        
        // 7. Idgham Bighunnah (Nun Mati/Tanwin ketemu Ya, Nun, Mim, Wawu)
        .replace(new RegExp(`(ن[\u0652]?|[\u064B\u064C\u064D])(?=${skip}[ينمو])`, 'g'), `<span class="t-rule tj-idgham" onclick="window.showTajwidInfo(event, 'Idgham Bighunnah', this.innerText)">$&</span>`)
        
        // 8. Idgham Bilaghunnah (Nun Mati/Tanwin ketemu Lam, Ra)
        .replace(new RegExp(`(ن[\u0652]?|[\u064B\u064C\u064D])(?=${skip}[لر])`, 'g'), `<span class="t-rule tj-idgham" onclick="window.showTajwidInfo(event, 'Idgham Bilaghunnah', this.innerText)">$&</span>`)
        
        // 9. Ikhfa Haqiqi (Nun Mati/Tanwin ketemu 15 huruf ikhfa)
        .replace(new RegExp(`(ن[\u0652]?|[\u064B\u064C\u064D])(?=${skip}[تثجدذزسشصضطظفقك])`, 'g'), `<span class="t-rule tj-ikhfa" onclick="window.showTajwidInfo(event, 'Ikhfa', this.innerText)">$&</span>`)
        
        // 10. Izhar Halqi (Nun Mati/Tanwin ketemu huruf tenggorokan)
        .replace(new RegExp(`(ن[\u0652]?|[\u064B\u064C\u064D])(?=${skip}[ءأإهعحغخ])`, 'g'), `<span class="t-rule tj-idzhar" onclick="window.showTajwidInfo(event, 'Izhar', this.innerText)">$&</span>`)
        
        // 11. Idgham Syamsiyah (Alif Lam ketemu huruf Syamsiyah)
        .replace(new RegExp(`(ال)(?=${skip}[تثدذرزسشصضطظلن])`, 'g'), `<span class="t-rule tj-idgham-syam" onclick="window.showTajwidInfo(event, 'Idgham Syamsiyah', this.innerText)">$&</span>`)
        
        // 12. Saktah (Tanda Saktah / Seen kecil)
        .replace(/([\u06DC])/g, `<span class="t-rule tj-saktah" onclick="window.showTajwidInfo(event, 'Saktah', this.innerText)">$&</span>`);
};
