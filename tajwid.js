/* ==============================================================
   TAJWID.JS - 14 HUKUM & WAQAF IBTIDA (NO POPUP CLICK)
   ============================================================== */

const tajwidDatabase = [
    { id: "Hamzah Wasl", arab: "هَمْزَةُ الْوَصْلِ", color: "#9ca3af", class: "tj-hamzah", penjelasan: "Hamzah yang dibaca di awal kata, tetapi tidak dibaca ketika menyambung dari kata sebelumnya.", cara: "Jika memulai bacaan baca dengan harakat sesuai. Jika menyambung, abaikan.", contoh: "ٱلْحَمْدُ" },
    { id: "Idgham Syamsiyah", arab: "لَام شَمْسِيَّة", color: "#3b82f6", class: "tj-idgham-syam", penjelasan: "Alif Lam bertemu huruf syamsiyah. Huruf Lam dilebur ke huruf berikutnya.", cara: "Langsung baca huruf setelahnya dengan tasydid.", contoh: "الشَّمْسُ" },
    { id: "Ghunnah", arab: "غُنَّة", color: "#f97316", class: "tj-ghunnah", penjelasan: "Dengung dari pangkal hidung pada huruf Nun (ن) dan Mim (م) bertasydid.", cara: "Dengungkan dan tahan selama 2 harakat.", contoh: "إِنَّ" },
    { id: "Ikhfa", arab: "إِخْفَاء حَقِيقِي", color: "#ec4899", class: "tj-ikhfa", penjelasan: "Nun Mati/Tanwin bertemu 15 huruf ikhfa. Bacaan disamarkan.", cara: "Samarkan bunyi nun ke huruf berikutnya dengan dengung 2 harakat.", contoh: "مِنْ قَبْلُ" },
    { id: "Madd", arab: "مَدّ", color: "#ef4444", class: "tj-mad", penjelasan: "Pemanjangan suara pada huruf mad atau tanda bendera.", cara: "Panjangkan suara 2 hingga 6 harakat sesuai jenisnya.", contoh: "قَالُوْا" },
    { id: "Qalqalah", arab: "قَلْقَلَة", color: "#10b981", class: "tj-qalqalah", penjelasan: "Pantulan suara pada huruf (ق ط ب ج د) saat mati.", cara: "Bunyikan huruf dengan pantulan makhraj yang kuat.", contoh: "يَخْلُقُ" },
    { id: "Iqlab", arab: "إِقْلَاب", color: "#8b5cf6", class: "tj-iqlab", penjelasan: "Nun Mati/Tanwin bertemu Ba (ب). Bunyi berubah menjadi Mim.", cara: "Ubah bunyi nun menjadi mim samar dengan dengung.", contoh: "مِنْ بَعْدِ" },
    { id: "Idgham Bighunnah", arab: "إِدْغَام بِغُنَّة", color: "#06b6d4", class: "tj-idgham", penjelasan: "Memasukkan bunyi Nun Mati/Tanwin ke huruf (ي ن م و) dengan dengung.", cara: "Leburkan bunyi dan tahan 2 harakat.", contoh: "مَنْ يَقُوْلُ" },
    { id: "Idgham Bilaghunnah", arab: "إِدْغَام بِلَاغُنَّة", color: "#06b6d4", class: "tj-idgham", penjelasan: "Memasukkan bunyi Nun Mati/Tanwin ke huruf (ل ر) tanpa dengung.", cara: "Langsung leburkan bunyi tanpa ditahan.", contoh: "مِنْ رَبِّهِم" },
    { id: "Ikhfa Syafawi", arab: "إِخْفَاء شَفَوِي", color: "#d946ef", class: "tj-ikhfa-syaf", penjelasan: "Mim Mati (مْ) bertemu Ba (ب).", cara: "Samarkan bunyi mim dengan bibir rapat disertai dengung.", contoh: "تَرْمِيهِمْ بِ" },
    { id: "Saktah", arab: "سَكْتَة", color: "#64748b", class: "tj-saktah", penjelasan: "Berhenti sejenak tanpa bernapas selama 2 harakat.", cara: "Putus suara sesaat lalu lanjutkan bacaan.", contoh: "عِوَجًا ۜ قَيِّمًا" },
    { id: "Idgham Mutamatsilain", arab: "إِدْغَام مُتَمَاثِلَيْن", color: "#0ea5e9", class: "tj-mutamatsilain", penjelasan: "Dua huruf sama bertemu, yang pertama mati (khusus Mim & Nun).", cara: "Leburkan dengan sempurna disertai dengung.", contoh: "لَهُمْ مَّا" },
    { id: "Idgham Mutaqaribain", arab: "إِدْغَام مُتَقَارِبَيْن", color: "#14b8a6", class: "tj-mutaqaribain", penjelasan: "Dua huruf berdekatan makhraj bertemu (misal Qaf & Kaf).", cara: "Huruf pertama dilebur ke huruf kedua.", contoh: "أَلَمْ نَخْلُقْكُمْ" },
    { id: "Izhar", arab: "إِظْهَار حَلْقِي", color: "#eab308", class: "tj-idzhar", penjelasan: "Nun Mati/Tanwin bertemu 6 huruf tenggorokan.", cara: "Baca dengan jelas dan tegas tanpa dengung.", contoh: "مِنْ عِنْدِ" }
];

window.applyTajwid = function(text) {
    if (!text) return "";
    const skip = "(?:[\u064B-\u0652\u0670\u06E1\u06DF-\u06E0\u06E2\u06E8\u06EA-\u06EC]*|<[^>]+>)*";
    const space = "[\\s\\u00A0]*";

    return text
        .replace(/([\u0653])/g, `<span class="t-rule tj-mad" onclick="window.showTajwidInfo(event, 'Madd', '$&')">$&</span>`)
        .replace(/([نم][\u064E-\u0650]?[\u0651])/g, `<span class="t-rule tj-ghunnah" onclick="window.showTajwidInfo(event, 'Ghunnah', '$&')">$&</span>`)
        .replace(/([\u06E2])/g, `<span class="t-rule tj-iqlab" onclick="window.showTajwidInfo(event, 'Iqlab', '$&')">$&</span>`)
        .replace(/([بجدطق][\u0652])/g, `<span class="t-rule tj-qalqalah" onclick="window.showTajwidInfo(event, 'Qalqalah', '$&')">$&</span>`)
        .replace(new RegExp(`(م[\u0652]?)${space}(?=م)`, 'g'), `<span class="t-rule tj-mutamatsilain" onclick="window.showTajwidInfo(event, 'Idgham Mutamatsilain', '$&')">$&</span>`)
        .replace(new RegExp(`(م[\u0652]?)${space}(?=ب)`, 'g'), `<span class="t-rule tj-ikhfa-syaf" onclick="window.showTajwidInfo(event, 'Ikhfa Syafawi', '$&')">$&</span>`)
        .replace(new RegExp(`(ن[\u0652]?|[ًٌٍ])${skip}${space}(?=[ينمو])`, 'g'), `<span class="t-rule tj-idgham" onclick="window.showTajwidInfo(event, 'Idgham Bighunnah', '$&')">$&</span>`)
        .replace(new RegExp(`(ن[\u0652]?|[ًٌٍ])${skip}${space}(?=[لر])`, 'g'), `<span class="t-rule tj-idgham" onclick="window.showTajwidInfo(event, 'Idgham Bilaghunnah', '$&')">$&</span>`)
        .replace(new RegExp(`(ن[\u0652]?|[ًٌٍ])${skip}${space}(?=[تثجدذزسشصضطظفقك])`, 'g'), `<span class="t-rule tj-ikhfa" onclick="window.showTajwidInfo(event, 'Ikhfa', '$&')">$&</span>`)
        .replace(new RegExp(`(ن[\u0652]?|[ًٌٍ])${skip}${space}(?=[ءأإهعحغخ])`, 'g'), `<span class="t-rule tj-idzhar" onclick="window.showTajwidInfo(event, 'Izhar', '$&')">$&</span>`)
        .replace(new RegExp(`(ال)(?=${skip}[تثدذرزسشصضطظلن][\u0651])`, 'g'), `<span class="t-rule tj-idgham-syam" onclick="window.showTajwidInfo(event, 'Idgham Syamsiyah', '$&')">$&</span>`)
        .replace(/([\u06DC])/g, `<span class="t-rule tj-saktah" onclick="window.showTajwidInfo(event, 'Saktah', '$&')">$&</span>`)
        .replace(/([ٱ])/g, `<span class="t-rule tj-hamzah" onclick="window.showTajwidInfo(event, 'Hamzah Wasl', '$&')">$&</span>`)
        .replace(new RegExp(`(ق[\u0652]?)${space}(?=ك)`, 'g'), `<span class="t-rule tj-mutaqaribain" onclick="window.showTajwidInfo(event, 'Idgham Mutaqaribain', '$&')">$&</span>`)
        .replace(new RegExp(`(د[\u0652]?)${space}(?=ت)`, 'g'), `<span class="t-rule tj-mutajanisain" onclick="window.showTajwidInfo(event, 'Idgham Mutajanisain', '$&')">$&</span>`);
};

// --- FUNGSI TANDA WAQAF (HANYA WARNA, TANPA KLIK) ---
window.applyWaqaf = function(text) {
    if (!text) return "";
    return text
        .replace(/([\u06D6\u06D7\u06D8\u06DA\u06DB])/g, `<span style="color:#10b981; font-weight:bold; padding: 0 4px;" title="Aman/Dianjurkan Berhenti">$&</span>`) 
        .replace(/([\u06D9])/g, `<span style="color:#ef4444; font-weight:bold; padding: 0 4px;" title="Dilarang Berhenti">$&</span>`); 
};

window.showTajwidInfo = function(event, jenis, huruf) {
    if (event) event.stopPropagation();
    const tData = tajwidDatabase.find(t => t.id === jenis || t.id.includes(jenis)) || tajwidDatabase[0];
    
    document.getElementById('t-info-icon').innerText = tData.id.charAt(0);
    document.getElementById('t-info-icon').style.backgroundColor = tData.color;
    document.getElementById('t-info-title').innerText = tData.id;
    document.getElementById('t-info-arab').innerText = tData.arab;
    document.getElementById('t-info-desc').innerText = tData.penjelasan;
    document.getElementById('t-info-cara').innerText = tData.cara;
    document.getElementById('t-info-contoh').innerText = tData.contoh;
    document.getElementById('t-info-letters').innerText = huruf;
    
    document.getElementById('modal-tajwid-info').style.display = 'flex';
};

window.renderTajwidGuide = function() {
    const list = document.getElementById('tajwid-guide-list');
    if(!list) return;
    list.innerHTML = tajwidDatabase.map((t, i) => `
        <div class="tg-item">
            <div class="tg-header" onclick="window.toggleTG(${i})">
                <div class="tg-color-box" style="background-color: ${t.color};">${t.id.charAt(0)}</div>
                <div style="flex:1;"><div style="font-weight:bold; font-size:15px;">${t.id}</div><div class="font-arab" style="font-size:14px; color:#94a3b8;">${t.arab}</div></div>
                <i class="fas fa-chevron-down" id="tg-icon-${i}"></i>
            </div>
            <div class="tg-body" id="tg-body-${i}" style="max-height:0; overflow:hidden; transition:0.3s; background:#0f172a;">
                <div style="padding:15px;">
                    <div class="t-section-title" style="color:#60a5fa;">Penjelasan</div><p class="small mb-3">${t.penjelasan}</p>
                    <div class="t-section-title" style="color:#fbbf24;">Cara Membaca</div><p class="small mb-3">${t.cara}</p>
                    <div class="t-section-title" style="color:#34d399;">Contoh</div><p class="font-arab" style="font-size:20px;">${t.contoh}</p>
                </div>
            </div>
        </div>`).join('');
};

window.openTajwidGuide = function() {
    document.getElementById('modal-tajwid-guide').style.display = 'flex';
};

window.toggleTG = function(idx) {
    const b = document.getElementById(`tg-body-${idx}`); const icon = document.getElementById(`tg-icon-${idx}`);
    if(b.style.maxHeight === '0px' || b.style.maxHeight === '') { b.style.maxHeight = '500px'; icon.classList.replace('fa-chevron-down', 'fa-chevron-up'); } 
    else { b.style.maxHeight = '0px'; icon.classList.replace('fa-chevron-up', 'fa-chevron-down'); }
};

document.addEventListener('DOMContentLoaded', () => { setTimeout(window.renderTajwidGuide, 500); });
