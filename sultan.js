/* ==============================================================
   SULTAN.JS - KUMPULAN FITUR PREMIUM (DIPISAH DARI APP.JS)
   ============================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initTracker(); renderDoaList();
});

// --- FITUR ASMAUL HUSNA 99 LENGKAP ---
function renderAsmaulHusna() {
    const asmaulHusna99 = [
        {a:"الرَّحْمَنُ", l:"Ar-Rahman", i:"Maha Pengasih"},{a:"الرَّحِيمُ", l:"Ar-Rahim", i:"Maha Penyayang"},{a:"الْمَلِكُ", l:"Al-Malik", i:"Maha Merajai"},{a:"الْقُدُّوسُ", l:"Al-Quddus", i:"Maha Suci"},{a:"السَّلَامُ", l:"As-Salam", i:"Maha Menyelamatkan"},
        {a:"الْمُؤْمِنُ", l:"Al-Mu'min", i:"Maha Pemberi Keamanan"},{a:"الْمُهَيْمِنُ", l:"Al-Muhaimin", i:"Maha Pemelihara"},{a:"الْعَزِيزُ", l:"Al-'Aziz", i:"Maha Perkasa"},{a:"الْجَبَّارُ", l:"Al-Jabbar", i:"Maha Pemaksa"},{a:"الْمُتَكَبِّرُ", l:"Al-Mutakabbir", i:"Maha Pemilik Kebesaran"},
        {a:"الْخَالِقُ", l:"Al-Khaliq", i:"Maha Pencipta"},{a:"الْبَارِئُ", l:"Al-Bari'", i:"Maha Mengadakan"},{a:"الْمُصَوِّرُ", l:"Al-Musawwir", i:"Maha Membentuk Rupa"},{a:"الْغَفَّارُ", l:"Al-Ghaffar", i:"Maha Pengampun"},{a:"الْقَهَّارُ", l:"Al-Qahhar", i:"Maha Menundukkan"},
        {a:"الْوَهَّابُ", l:"Al-Wahhab", i:"Maha Pemberi Karunia"},{a:"الرَّزَّاقُ", l:"Ar-Razzaq", i:"Maha Pemberi Rezeki"},{a:"الْفَتَّاحُ", l:"Al-Fattah", i:"Maha Pembuka Rahmat"},{a:"الْعَلِيمُ", l:"Al-'Alim", i:"Maha Mengetahui"},{a:"الْقَابِضُ", l:"Al-Qabidh", i:"Maha Menyempitkan"},
        {a:"الْبَاسِطُ", l:"Al-Basith", i:"Maha Melapangkan"},{a:"الْخَافِضُ", l:"Al-Khafidh", i:"Maha Merendahkan"},{a:"الرَّافِعُ", l:"Ar-Rafi'", i:"Maha Meninggikan"},{a:"الْمُعِزُّ", l:"Al-Mu'izz", i:"Maha Memuliakan"},{a:"الْمُذِلُّ", l:"Al-Mudzill", i:"Maha Menghinakan"},
        {a:"السَّمِيعُ", l:"As-Sami'", i:"Maha Mendengar"},{a:"الْبَصِيرُ", l:"Al-Bashir", i:"Maha Melihat"},{a:"الْحَكَمُ", l:"Al-Hakam", i:"Maha Menetapkan"},{a:"الْعَدْلُ", l:"Al-'Adl", i:"Maha Adil"},{a:"اللَّطِيفُ", l:"Al-Lathif", i:"Maha Lembut"},
        {a:"الْخَبِيرُ", l:"Al-Khabir", i:"Maha Mengetahui Rahasia"},{a:"الْحَلِيمُ", l:"Al-Halim", i:"Maha Penyantun"},{a:"الْعَظِيمُ", l:"Al-'Azhim", i:"Maha Agung"},{a:"الْغَفُورُ", l:"Al-Ghafur", i:"Maha Pengampun"},{a:"الشَّكُورُ", l:"Asy-Syakur", i:"Maha Pembalas Budi"},
        {a:"الْعَلِيُّ", l:"Al-'Aliy", i:"Maha Tinggi"},{a:"الْكَبِيرُ", l:"Al-Kabir", i:"Maha Besar"},{a:"الْحَفِيظُ", l:"Al-Hafizh", i:"Maha Menjaga"},{a:"الْمُقِيتُ", l:"Al-Muqit", i:"Maha Pemberi Kecukupan"},{a:"الْحَسِيبُ", l:"Al-Hasib", i:"Maha Pembuat Perhitungan"},
        {a:"الْجَلِيلُ", l:"Al-Jalil", i:"Maha Mulia"},{a:"الْكَرِيمُ", l:"Al-Karim", i:"Maha Pemurah"},{a:"الرَّقِيبُ", l:"Ar-Raqib", i:"Maha Mengawasi"},{a:"الْمُجِيبُ", l:"Al-Mujib", i:"Maha Mengabulkan"},{a:"الْوَاسِعُ", l:"Al-Wasi'", i:"Maha Luas"},
        {a:"الْحَكِيمُ", l:"Al-Hakim", i:"Maha Bijaksana"},{a:"الْوَدُودُ", l:"Al-Wadud", i:"Maha Penuh Cinta"},{a:"الْمَجِيدُ", l:"Al-Majid", i:"Maha Mulia"},{a:"الْبَاعِثُ", l:"Al-Ba'its", i:"Maha Membangkitkan"},{a:"الشَّهِيدُ", l:"Asy-Syahid", i:"Maha Menyaksikan"},
        {a:"الْحَقُّ", l:"Al-Haqq", i:"Maha Benar"},{a:"الْوَكِيلُ", l:"Al-Wakil", i:"Maha Memelihara"},{a:"الْقَوِيُّ", l:"Al-Qawiyyu", i:"Maha Kuat"},{a:"الْمَتِينُ", l:"Al-Matin", i:"Maha Kokoh"},{a:"الْوَلِيُّ", l:"Al-Waliy", i:"Maha Melindungi"},
        {a:"الْحَمِيدُ", l:"Al-Hamid", i:"Maha Terpuji"},{a:"الْمُحْصِي", l:"Al-Muhshi", i:"Maha Mengkalkulasi"},{a:"الْمُبْدِئُ", l:"Al-Mubdi'", i:"Maha Memulai"},{a:"الْمُعِيدُ", l:"Al-Mu'id", i:"Maha Mengembalikan Kehidupan"},{a:"الْمُحْيِي", l:"Al-Muhyi", i:"Maha Menghidupkan"},
        {a:"الْمُمِيتُ", l:"Al-Mumit", i:"Maha Mematikan"},{a:"الْحَيُّ", l:"Al-Hayyu", i:"Maha Hidup"},{a:"الْقَيُّومُ", l:"Al-Qayyum", i:"Maha Mandiri"},{a:"الْوَاجِدُ", l:"Al-Wajid", i:"Maha Penemu"},{a:"الْمَاجِدُ", l:"Al-Majid", i:"Maha Mulia"},
        {a:"الْوَاحِدُ", l:"Al-Wahid", i:"Maha Tunggal"},{a:"الْأَحَد", l:"Al-Ahad", i:"Maha Esa"},{a:"الصَّمَدُ", l:"Ash-Shamad", i:"Maha Dibutuhkan"},{a:"الْقَادِرُ", l:"Al-Qadir", i:"Maha Menentukan"},{a:"الْمُقْتَدِرُ", l:"Al-Muqtadir", i:"Maha Berkuasa"},
        {a:"الْمُقَدِّمُ", l:"Al-Muqaddim", i:"Maha Mendahulukan"},{a:"الْمُؤَخِّرُ", l:"Al-Mu'akhkhir", i:"Maha Mengakhirkan"},{a:"الْأَوَّلُ", l:"Al-Awwal", i:"Maha Awal"},{a:"الْآخِرُ", l:"Al-Akhir", i:"Maha Akhir"},{a:"الظَّاهِرُ", l:"Azh-Zhahir", i:"Maha Nyata"},
        {a:"الْبَاطِنُ", l:"Al-Bathin", i:"Maha Ghaib"},{a:"الْوَالِي", l:"Al-Wali", i:"Maha Memerintah"},{a:"الْمُتَعَالِي", l:"Al-Muta'ali", i:"Maha Tinggi"},{a:"الْبَرُّ", l:"Al-Barr", i:"Maha Penderma"},{a:"التَّوَّابُ", l:"At-Tawwab", i:"Maha Penerima Taubat"},
        {a:"الْمُنْتَقِمُ", l:"Al-Muntaqim", i:"Maha Pemberi Balasan"},{a:"الْعَفُوُّ", l:"Al-'Afuww", i:"Maha Pemaaf"},{a:"الرَّءُوفُ", l:"Ar-Ra'uf", i:"Maha Pengasih"},{a:"مَالِكُ الْمُلْكِ", l:"Malikul Mulk", i:"Penguasa Kerajaan"},{a:"ذُو الْجَلَالِ وَالْإِكْرَامِ", l:"Dzul Jalaali Wal Ikraam", i:"Pemilik Kebesaran dan Kemuliaan"},
        {a:"الْمُقْسِطُ", l:"Al-Muqsit", i:"Maha Adil"},{a:"الْجَامِعُ", l:"Al-Jami'", i:"Maha Mengumpulkan"},{a:"الْغَنِيُّ", l:"Al-Ghaniy", i:"Maha Berkecukupan"},{a:"الْمُغْنِي", l:"Al-Mughni", i:"Maha Memberi Kekayaan"},{a:"الْمَانِعُ", l:"Al-Mani'", i:"Maha Mencegah"},
        {a:"الضَّارُّ", l:"Adh-Dharr", i:"Maha Penimpa Kemudharatan"},{a:"النَّافِعُ", l:"An-Nafi'", i:"Maha Memberi Manfaat"},{a:"النُّورُ", l:"An-Nur", i:"Maha Bercahaya"},{a:"الْهَادِي", l:"Al-Hadi", i:"Maha Pemberi Petunjuk"},{a:"الْبَدِيعُ", l:"Al-Badi'", i:"Maha Pencipta Tiada Banding"},
        {a:"الْبَاقِي", l:"Al-Baqi", i:"Maha Kekal"},{a:"الْوَارِثُ", l:"Al-Warits", i:"Maha Pewaris"},{a:"الرَّشِيدُ", l:"Ar-Rasyid", i:"Maha Pandai"},{a:"الصَّبُورُ", l:"Ash-Shabur", i:"Maha Sabar"}
    ];
    const list = document.getElementById('asmaul-list');
    if(list) list.innerHTML = `<div class="asmaul-grid">${asmaulHusna99.map((n, i) => `<div class="asmaul-item"><div class="small text-muted mb-1">${i+1}</div><h3 class="font-arab text-primary mb-1">${n.a}</h3><strong>${n.l}</strong><br><small class="text-muted">${n.i}</small></div>`).join('')}</div>`;
}

// --- TRACKER IBADAH ---
let trackerData = JSON.parse(localStorage.getItem('rTracker')) || { Subuh:false, Dzuhur:false, Ashar:false, Maghrib:false, Isya:false, Puasa:false, Tarawih:false };
function initTracker() {
    renderAsmaulHusna();
    const tList = document.getElementById('tracker-list');
    if(!tList) return;
    tList.innerHTML = Object.keys(trackerData).map(k => `
        <div class="tracker-item"><span>${k}</span><input type="checkbox" onchange="updateTracker('${k}', this.checked)" ${trackerData[k] ? 'checked' : ''}></div>
    `).join('');
    updateTrackerProgress();
}
window.updateTracker = function(k, val) { trackerData[k] = val; localStorage.setItem('rTracker', JSON.stringify(trackerData)); updateTrackerProgress(); };
function updateTrackerProgress() {
    const keys = Object.keys(trackerData); const checked = keys.filter(k => trackerData[k]).length;
    const pct = Math.round((checked / keys.length) * 100);
    document.getElementById('tracker-progress').style.width = `${pct}%`; document.getElementById('tracker-status').innerText = `Progres Hari Ini: ${pct}%`;
}

// --- FITUR LAINNYA ---
window.startVoiceSearch = function() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) { const rec = new SR(); rec.lang = 'id-ID'; rec.start(); const inp = document.getElementById('search-input'); inp.placeholder = "Mendengarkan..."; rec.onresult = e => { inp.value = e.results[0][0].transcript; filterSurah(); inp.placeholder = "Cari Surat..."; }; rec.onerror = () => { alert("Suara tidak jelas."); inp.placeholder = "Cari Surat..."; }; } 
    else alert("Tidak didukung.");
};

window.hitungZakat = function() {
    const m = parseFloat(document.getElementById('zakat-maal').value) || 0; document.getElementById('hasil-maal').innerText = `Rp ${(m * 0.025).toLocaleString('id-ID')}`;
};

window.hitungKhatam = function() {
    const hari = document.getElementById('target-hari').value; const div = document.getElementById('hasil-khatam');
    if (!hari || hari <= 0) { alert("Masukkan hari valid!"); return; }
    div.innerHTML = `Target: Baca <b>${Math.ceil(Math.ceil((604 / hari) / 2) / 5)} Lembar</b> tiap sholat.`; div.classList.remove('hidden');
};

let compassActive = false;
window.startCompassReal = function() {
    if (compassActive) return;
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            let c = e.webkitCompassHeading || Math.abs(e.alpha - 360);
            if (c) { document.getElementById('compass-ring').style.transform = `rotate(${295 - c}deg)`; if (c > 285 && c < 305 && navigator.vibrate) navigator.vibrate(30); }
        }); compassActive = true; alert("Putar HP.");
    } else alert("Sensor tidak didukung.");
};

window.findNearbyMosque = function() { window.open(`https://www.google.com/maps/search/Masjid+Terdekat`, '_blank'); };

let tasbihCount = 0;
window.openTasbih = function() {
    tasbihCount++; if (navigator.vibrate) navigator.vibrate(30);
    document.getElementById('tafsir-content').innerHTML = `<div class="text-center cursor-pointer p-3" onclick="openTasbih()"><p class="text-muted mb-3">Ketuk area ini untuk bertasbih</p><h1 class="text-primary" style="font-size:80px;">${tasbihCount}</h1><button class="btn-outline-primary mt-3" onclick="event.stopPropagation(); tasbihCount=0; openTasbih();">Reset</button></div>`;
    openModal('modal-tafsir');
};

window.startQuiz = function(t) { let ans = prompt("Hukum nun mati bertemu Ba (ب) disebut?\nA. Ikhfa\nB. Iqlab\nC. Idzhar"); if(ans && ans.toLowerCase() === 'b') alert("✅ Benar!"); else alert("❌ Salah."); };

const doaList = [
    { t: "Niat Puasa Ramadhan", a: "نَوَيْتُ صَوْمَ غَدٍ عَنْ أَدَاءِ فَرْضِ شَهْرِ رَمَضَانَ هَذِهِ السَّنَةِ لِلّٰهِ تَعَالَى", l: "Nawaitu shauma ghadin..." },
    { t: "Doa Berbuka Puasa", a: "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ", l: "Dzahabaz zhama'u wabtallatil 'uruqu..." }
];
function renderDoaList() {
    const cont = document.getElementById('doa-container');
    if(!cont) return;
    cont.innerHTML = doaList.map((d, i) => `
        <div class="doa-item"><div class="doa-header" onclick="toggleDoa(${i})"><span>${d.t}</span> <i class="fas fa-chevron-down" id="doa-icon-${i}"></i></div>
        <div class="doa-body" id="doa-body-${i}"><p class="font-arab text-primary text-right mb-2" style="font-size:24px">${d.a}</p><p class="text-muted small"><i>${d.l}</i></p></div></div>
    `).join('');
}
window.toggleDoa = function(i) {
    const b = document.getElementById(`doa-body-${i}`); const c = document.getElementById(`doa-icon-${i}`);
    if (b.classList.contains('open')) { b.classList.remove('open'); c.classList.replace('fa-chevron-up', 'fa-chevron-down'); } 
    else { b.classList.add('open'); c.classList.replace('fa-chevron-down', 'fa-chevron-up'); }
};

let alarmInterval = null;
window.toggleAlarm = function() {
    if (document.getElementById('alarm-toggle').checked) {
        alert("🔔 Alarm Adzan diaktifkan!");
        alarmInterval = setInterval(() => {
            const now = new Date();
            if (`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}` === "18:15" && now.getSeconds() === 0) {
                document.getElementById('audio-adzan').play(); alert("Waktunya Sholat Maghrib!");
            }
        }, 1000);
    } else { clearInterval(alarmInterval); document.getElementById('audio-adzan').pause(); }
};
