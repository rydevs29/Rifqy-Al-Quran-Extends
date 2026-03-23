// --- KONFIGURASI AWAL ---
const API_URL = "https://equran.id/api/v2";
let allSurahs = [];
let currentSurah = null;
let audioEngine = document.getElementById('audio-engine');
let activeAyahIndex = -1;

// STATE PENGATURAN
let prefs = {
    qari: "05", // 05: Alafasy, 03: Sudais (equran API keys)
    arabSize: 32,
    latinSize: 14,
    transSize: 14,
    showLatin: true,
    showTrans: true,
    showTajwid: true
};

// --- 1. INISIALISASI & TANGGAL ---
document.addEventListener('DOMContentLoaded', () => {
    initDate();
    fetchSurahs();
    loadPreferences();
});

function initDate() {
    const today = new Date();
    // Tanggal Masehi
    const gregOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('date-gregorian').innerText = today.toLocaleDateString('id-ID', gregOptions);
    
    // Tanggal Hijriah
    const hijriOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const hijriDate = new Intl.DateTimeFormat('id-ID-u-ca-islamic', hijriOptions).format(today);
    document.getElementById('date-hijri').innerHTML = `${hijriDate} <i class="fas fa-chevron-down" style="font-size:10px;"></i>`;
}

// --- 2. FETCH & RENDER SURAT ---
async function fetchSurahs() {
    try {
        const res = await fetch(`${API_URL}/surat`);
        const json = await res.json();
        allSurahs = json.data;
        renderSurahs(allSurahs);
    } catch (e) {
        document.getElementById('surah-list').innerHTML = `<p style="text-align:center; color:red;">Gagal memuat Quran. Cek koneksi Anda.</p>`;
    }
}

function renderSurahs(data) {
    document.getElementById('surah-list').innerHTML = data.map(s => `
        <div class="surah-card" onclick="openSurah(${s.nomor})">
            <div class="s-num">${s.nomor}</div>
            <div class="s-name">
                <h4>${s.namaLatin}</h4>
                <p>${s.arti} • ${s.jumlahAyat} Ayat</p>
            </div>
            <div class="s-arab">${s.nama}</div>
        </div>
    `).join('');
}

function filterSurah() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = allSurahs.filter(s => s.namaLatin.toLowerCase().includes(query));
    renderSurahs(filtered);
}

// --- 3. BUKA SURAT & RENDER AYAT ---
async function openSurah(nomor) {
    document.getElementById('page-home').classList.remove('active');
    document.getElementById('page-read').classList.add('active');
    document.getElementById('ayah-list').innerHTML = `<div style="text-align:center; padding:40px; color:#888;">Sedang memuat ayat...</div>`;
    window.scrollTo(0, 0);

    try {
        const res = await fetch(`${API_URL}/surat/${nomor}`);
        const json = await res.json();
        currentSurah = json.data;

        document.getElementById('read-surah-name').innerText = currentSurah.namaLatin;
        document.getElementById('read-surah-info').innerText = `${currentSurah.tempatTurun} • ${currentSurah.jumlahAyat} Ayat`;

        // Render Ayat HTML
        let html = '';
        if (currentSurah.nomor !== 9) { // Bismillah kecuali At-Taubah
            html += `<div class="text-arab" style="text-align:center; font-size:${prefs.arabSize}px; color:var(--primary-color);">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>`;
        }

        html += currentSurah.ayat.map((a, index) => `
            <div class="ayah-item" id="ayah-${index}">
                <div class="ayah-header">
                    <span class="ayah-badge">${currentSurah.nomor}:${a.nomorAyat}</span>
                    <button class="btn-play-ayah" onclick="playAyah(${index}, '${a.audio[prefs.qari]}')">
                        <i class="fas fa-play-circle"></i>
                    </button>
                </div>
                <div class="text-arab" style="font-size:${prefs.arabSize}px;">
                    ${prefs.showTajwid ? applyTajwid(a.teksArab) : a.teksArab}
                </div>
                <div class="text-latin ${prefs.showLatin ? '' : 'hidden'}" style="font-size:${prefs.latinSize}px;">
                    ${a.teksLatin}
                </div>
                <div class="text-trans ${prefs.showTrans ? '' : 'hidden'}" style="font-size:${prefs.transSize}px;">
                    ${a.teksIndonesia}
                </div>
            </div>
        `).join('');

        document.getElementById('ayah-list').innerHTML = html;
        
        // Stop audio jika ada yang menyala
        if(!audioEngine.paused) toggleAudioSurah();
        
    } catch (e) {
        alert("Gagal memuat surat.");
        goHome();
    }
}

// --- 4. MESIN TAJWID LENGKAP ---
function applyTajwid(text) {
    // Ghunnah (Pink) - Nun/Mim Tasydid
    text = text.replace(/([نم])[\u0651]/g, '<span class="tj-ghunnah">$&</span>');
    // Qalqalah (Cyan) - Ba, Jim, Dal, Tho, Qof + Sukun
    text = text.replace(/([بجدطق])\u0652/g, '<span class="tj-qalqalah">$&</span>');
    // Mad (Merah) - Tanda Bendera/Alis panjang
    text = text.replace(/[\u0653]/g, '<span class="tj-mad">$&</span>');
    // Iqlab (Hijau) - Tanda Mim Kecil
    text = text.replace(/[\u06E2]/g, '<span class="tj-iqlab">$&</span>');
    // Ikhfa/Idgham (Oranye) - Deteksi Tanwin
    text = text.replace(/[\u064B\u064C\u064D]/g, '<span class="tj-ikhfa">$&</span>');
    return text;
}

// --- 5. AUDIO ENGINE (QARI SELECTION) ---
function playAyah(idx, urlUrlQari) {
    // Reset All Highlight
    document.querySelectorAll('.ayah-item').forEach(el => el.classList.remove('playing'));
    
    // Set New Audio
    audioEngine.src = urlUrlQari;
    audioEngine.play();
    activeAyahIndex = idx;
    
    // Highlight Target
    const targetCard = document.getElementById(`ayah-${idx}`);
    targetCard.classList.add('playing');
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Auto Play Next Ayah
audioEngine.addEventListener('ended', () => {
    if (currentSurah && activeAyahIndex < currentSurah.ayat.length - 1) {
        let nextIdx = activeAyahIndex + 1;
        let nextAudioUrl = currentSurah.ayat[nextIdx].audio[prefs.qari];
        playAyah(nextIdx, nextAudioUrl);
    }
});

function toggleAudioSurah() {
    if (audioEngine.paused) {
        if (!audioEngine.src && currentSurah) {
            // Play from beginning
            playAyah(0, currentSurah.ayat[0].audio[prefs.qari]);
        } else {
            audioEngine.play();
        }
        document.getElementById('btn-play-surah').classList.replace('fa-play-circle', 'fa-pause-circle');
    } else {
        audioEngine.pause();
        document.getElementById('btn-play-surah').classList.replace('fa-pause-circle', 'fa-play-circle');
    }
}

// --- 6. PENGATURAN (SETTINGS) ---
function openSettingsModal() { document.getElementById('modal-settings').style.display = 'flex'; }
function closeModal(id) { document.getElementById('modal-settings').style.display = 'none'; document.getElementById('modal-calendar').style.display = 'none'; }
function goHome() { 
    document.getElementById('page-read').classList.remove('active'); 
    document.getElementById('page-home').classList.add('active'); 
    audioEngine.pause(); 
}

function changeQari() {
    prefs.qari = document.getElementById('qari-selector').value;
    alert("Qari berhasil diubah! Audio ayat selanjutnya akan menggunakan suara Qari baru.");
    // Restart audio if playing
    if(!audioEngine.paused && currentSurah && activeAyahIndex >= 0) {
        playAyah(activeAyahIndex, currentSurah.ayat[activeAyahIndex].audio[prefs.qari]);
    }
}

function updateFont(type, val) {
    if (type === 'arab') {
        prefs.arabSize = val;
        document.getElementById('val-arab').innerText = val + 'px';
        document.querySelectorAll('.text-arab').forEach(el => el.style.fontSize = val + 'px');
    } else if (type === 'latin') {
        prefs.latinSize = val;
        document.getElementById('val-latin').innerText = val + 'px';
        document.querySelectorAll('.text-latin').forEach(el => el.style.fontSize = val + 'px');
    } else {
        prefs.transSize = val;
        document.getElementById('val-trans').innerText = val + 'px';
        document.querySelectorAll('.text-trans').forEach(el => el.style.fontSize = val + 'px');
    }
}

function toggleFeature() {
    prefs.showLatin = document.getElementById('toggle-latin').checked;
    prefs.showTrans = document.getElementById('toggle-trans').checked;
    prefs.showTajwid = document.getElementById('toggle-tajwid').checked;

    document.querySelectorAll('.text-latin').forEach(el => el.classList.toggle('hidden', !prefs.showLatin));
    document.querySelectorAll('.text-trans').forEach(el => el.classList.toggle('hidden', !prefs.showTrans));
    
    // Rerender ayat untuk apply tajwid
    if (currentSurah) openSurah(currentSurah.nomor);
}

function loadPreferences() {
    // Setup Default UI Values
    document.getElementById('qari-selector').value = prefs.qari;
}

// --- 7. KALENDER HIJRIAH (GRID) ---
function openCalendarModal() {
    document.getElementById('modal-calendar').style.display = 'flex';
    renderHijriCalendar();
}

function renderHijriCalendar() {
    const grid = document.getElementById('cal-grid');
    const today = new Date();
    
    // Dapatkan Nama Bulan Hijriah saat ini
    const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic', { month: 'long', year: 'numeric' });
    document.getElementById('cal-month-year').innerText = formatter.format(today);

    // Ambil tanggal hijriah hari ini
    const todayHijriStr = new Intl.DateTimeFormat('en-US-u-ca-islamic', { day: 'numeric' }).format(today);
    const todayNum = parseInt(todayHijriStr);

    let html = '';
    // Generate 30 Hari (Asumsi bulan hijriah 30 hari)
    for(let i = 1; i <= 30; i++) {
        let isTodayClass = (i === todayNum) ? 'today' : '';
        html += `<div class="cal-day ${isTodayClass}">${i}</div>`;
    }
    grid.innerHTML = html;
}
