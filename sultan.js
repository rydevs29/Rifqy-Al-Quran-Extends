document.addEventListener('DOMContentLoaded', () => {
    renderImsakiyah2027(); renderDoaList();
});

// --- PENCARIAN SUARA ---
function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition(); recognition.lang = 'id-ID'; recognition.start();
        const inputStr = document.getElementById('search-input'); inputStr.placeholder = "Mendengarkan suara Anda...";
        recognition.onresult = function(e) { inputStr.value = e.results[0][0].transcript; filterSurah(); inputStr.placeholder = "Cari Nama atau Nomor Surat..."; };
        recognition.onerror = function() { alert("Suara tidak terdengar."); inputStr.placeholder = "Cari Nama atau Nomor Surat..."; };
    } else { alert("Browser Anda tidak mendukung Pencarian Suara."); }
}

// --- TAJWID INFO POPUP ---
window.showTajwidInfo = function(jenis, huruf) {
    let desc = "";
    switch(jenis) {
        case 'Ghunnah': desc = "Dengung 2-3 harakat karena huruf Nun/Mim bertasydid."; break;
        case 'Qalqalah': desc = "Dipantulkan karena huruf Qalqalah berharakat Sukun."; break;
        case 'Mad/Panjang': desc = "Dibaca panjang 4-6 harakat."; break;
        case 'Iqlab': desc = "Suara Nun/Tanwin diganti menjadi Mim dan berdengung karena bertemu huruf Ba."; break;
        case 'Ikhfa/Idgham': desc = "Disamarkan atau dilebur ke huruf setelahnya disertai dengung."; break;
    }
    document.getElementById('t-info-title').innerText = jenis;
    document.getElementById('t-info-desc').innerText = desc;
    document.getElementById('t-info-letters').innerText = huruf;
    document.getElementById('modal-tajwid-info').style.display = 'flex';
};

// --- KHATAM PLANNER ---
function hitungKhatam() {
    const hari = document.getElementById('target-hari').value;
    const hasilDiv = document.getElementById('hasil-khatam');
    if (!hari || hari <= 0) { alert("Masukkan jumlah hari yang valid!"); return; }
    const perSholat = Math.ceil(Math.ceil((604 / hari) / 2) / 5); 
    hasilDiv.innerHTML = `🔥 Target: Baca <b>${perSholat} Lembar</b> setiap selesai sholat 5 waktu.`;
    hasilDiv.classList.remove('hidden');
}

// --- KALKULATOR ZAKAT ---
function hitungZakat() {
    const b = parseFloat(document.getElementById('zakat-beras').value) || 0;
    const m = parseFloat(document.getElementById('zakat-maal').value) || 0;
    document.getElementById('hasil-fitrah').innerText = `Rp ${(b * 2.5).toLocaleString('id-ID')}`;
    document.getElementById('hasil-maal').innerText = `Rp ${(m * 0.025).toLocaleString('id-ID')}`;
}

// --- KOMPAS KIBLAT ---
let compassActive = false;
function startCompassReal() {
    if (compassActive) return;
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            let compass = e.webkitCompassHeading || Math.abs(e.alpha - 360);
            if (compass) {
                document.getElementById('compass-ring').style.transform = `rotate(${295 - compass}deg)`;
                const stat = document.getElementById('compass-status');
                if (compass > 285 && compass < 305) { stat.innerText = "✅ Tepat Kiblat!"; stat.classList.add('text-success'); if (navigator.vibrate) navigator.vibrate(30); } 
                else { stat.innerText = "Putar HP Anda..."; stat.classList.remove('text-success'); }
            }
        });
        compassActive = true; document.getElementById('compass-status').innerText = "Sensor aktif. Putar HP Anda.";
    } else { alert("Sensor tidak didukung perangkat/browser ini."); }
}

// --- IMSAKIYAH & ALARM ---
let alarmInterval = null;
function renderImsakiyah2027() {
    document.getElementById('prayer-times-2027').innerHTML = `
        <div class="prayer-times-grid text-center">
            <div class="bg-light p-2 border-radius"><small class="text-muted">Subuh</small><br><strong>04:42</strong></div>
            <div class="bg-light p-2 border-radius"><small class="text-muted">Dzuhur</small><br><strong>12:05</strong></div>
            <div class="bg-light p-2 border-radius"><small class="text-muted">Ashar</small><br><strong>15:10</strong></div>
            <div class="bg-primary text-white p-2 border-radius"><small>Maghrib</small><br><strong>18:15</strong></div>
            <div class="bg-light p-2 border-radius"><small class="text-muted">Isya</small><br><strong>19:25</strong></div>
        </div>
    `;
}
function toggleAlarm() {
    if (document.getElementById('alarm-toggle').checked) {
        alert("🔔 Alarm diaktifkan!");
        alarmInterval = setInterval(() => {
            const now = new Date();
            if (`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}` === "18:15" && now.getSeconds() === 0) {
                document.getElementById('audio-adzan').play(); alert("Waktunya Sholat Maghrib!");
            }
        }, 1000);
    } else { clearInterval(alarmInterval); document.getElementById('audio-adzan').pause(); }
}

// --- KUIS, DOA & TASBIH ---
function startQuiz(t) {
    let q = t === 'tajwid' ? "Hukum nun mati bertemu Ba (ب) disebut?\nA. Ikhfa\nB. Iqlab\nC. Idzhar" : "Arti 'Ar-Rahman'?\nA. Penyayang\nB. Pengasih\nC. Merajai";
    let ans = prompt(q);
    if(ans && ans.toLowerCase() === 'b') alert("✅ Benar!"); else alert("❌ Salah, jawabannya B.");
}

const doaList = [
    { t: "Niat Puasa Ramadhan", a: "نَوَيْتُ صَوْمَ غَدٍ عَنْ أَدَاءِ فَرْضِ شَهْرِ رَمَضَانَ هَذِهِ السَّنَةِ لِلّٰهِ تَعَالَى", l: "Nawaitu shauma ghadin..." },
    { t: "Doa Berbuka Puasa", a: "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ", l: "Dzahabaz zhama'u wabtallatil 'uruqu..." }
];
function renderDoaList() {
    document.getElementById('doa-container').innerHTML = doaList.map((d, i) => `
        <div class="doa-item"><div class="doa-header" onclick="toggleDoa(${i})"><span>${d.t}</span> <i class="fas fa-chevron-down" id="doa-icon-${i}"></i></div>
        <div class="doa-body" id="doa-body-${i}"><p class="font-arab text-primary text-right mb-2" style="font-size:24px">${d.a}</p><p class="text-muted small"><i>${d.l}</i></p></div></div>
    `).join('');
}
function toggleDoa(i) {
    const b = document.getElementById(`doa-body-${i}`); const c = document.getElementById(`doa-icon-${i}`);
    if (b.classList.contains('open')) { b.classList.remove('open'); c.classList.replace('fa-chevron-up', 'fa-chevron-down'); } 
    else { b.classList.add('open'); c.classList.replace('fa-chevron-down', 'fa-chevron-up'); }
}

let tasbihCount = 0;
window.openTasbih = function() {
    tasbihCount++; if (navigator.vibrate) navigator.vibrate(30);
    document.getElementById('tafsir-content').innerHTML = `
        <div class="text-center cursor-pointer p-3" onclick="openTasbih()">
            <p class="text-muted mb-3">Ketuk area ini untuk bertasbih</p><h1 class="text-primary" style="font-size:80px;">${tasbihCount}</h1>
            <button class="btn-outline-primary mt-3" onclick="event.stopPropagation(); tasbihCount=0; openTasbih();">Reset</button>
        </div>`;
    document.getElementById('modal-tafsir').style.display = 'flex';
};
