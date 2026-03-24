const API_QURAN = "https://equran.id/api/v2";
let allSurahs = [], currentSurah = null, audioEngine = document.getElementById('audio-engine'), activeAyahIndex = -1;

// STATE
let prefs = JSON.parse(localStorage.getItem('rPrefs')) || { qari: "05", arabSize: 32, latinSize: 14, showLatin: true, showTrans: true, showTajwid: true, autoplay: true };
let bookmark = JSON.parse(localStorage.getItem('rBookmark')) || null;
let autoScrollInterval = null; let scrollSpeed = 0;

document.addEventListener('DOMContentLoaded', () => {
    fixDateDisplay(); fetchSurahs(); loadPrefsUI(); checkBookmark(); checkDirectLink(); getLocationAndPrayerTimes();
});

function fixDateDisplay() {
    const today = new Date();
    document.getElementById('date-greg').innerText = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    try {
        let hijriStr = new Intl.DateTimeFormat('id-ID-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
        document.getElementById('date-hijri').innerHTML = `${hijriStr.replace(/SM|AH/g, '').trim()} H <i class="fas fa-calendar-alt small"></i>`;
    } catch(e) { document.getElementById('date-hijri').innerHTML = `Memuat Hijriah... <i class="fas fa-calendar-alt small"></i>`; }
}

function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    if(pageId === 'page-home') { document.getElementById('nav-home-mob')?.classList.add('active'); document.getElementById('nav-home-desk')?.classList.add('active'); }
    
    if(pageId !== 'page-read') {
        audioEngine.pause(); scrollSpeed = 0; clearInterval(autoScrollInterval);
        if(document.getElementById('btn-autoscroll-txt')) document.getElementById('btn-autoscroll-txt').innerText = "Off";
    }
    window.scrollTo(0,0);
}

// FETCH & RENDER SURAH
async function fetchSurahs() {
    try {
        const res = await fetch(`${API_QURAN}/surat`); allSurahs = (await res.json()).data; renderSurahs(allSurahs);
    } catch (e) { document.getElementById('surah-list').innerHTML = `<p class="text-center text-muted">Gagal memuat. Cek Koneksi.</p>`; }
}

function renderSurahs(data) {
    const progressData = JSON.parse(localStorage.getItem('surahProgress')) || {};
    document.getElementById('surah-list').innerHTML = data.map(s => {
        const pct = progressData[s.nomor] || 0;
        return `
        <div class="surah-card" onclick="openSurah(${s.nomor})">
            <div class="s-num">${s.nomor}</div>
            <div style="flex:1;">
                <h4 class="font-bold m-0">${s.namaLatin}</h4>
                <div class="flex-between"><p class="small text-muted m-0">${s.arti} • ${s.jumlahAyat} Ayat</p><small class="text-primary font-bold">${pct}%</small></div>
                <div class="surah-progress-container"><div class="surah-progress-fill" style="width: ${pct}%"></div></div>
            </div>
            <div class="s-arab font-arab text-primary ml-2" style="font-size:24px">${s.nama}</div>
        </div>`;
    }).join('');
}

function filterSurah() {
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    if (!isNaN(q) && q !== '') renderSurahs(allSurahs.filter(s => s.nomor.toString() === q));
    else renderSurahs(allSurahs.filter(s => s.namaLatin.toLowerCase().includes(q) || s.arti.toLowerCase().includes(q)));
}

// BUKA SURAH & RENDER AYAT
async function openSurah(nomor, targetAyah = 1) {
    switchPage('page-read');
    document.getElementById('ayah-list').innerHTML = `<div class="text-center mt-3"><i class="fas fa-spinner fa-spin text-primary"></i> Memuat...</div>`;
    try {
        currentSurah = (await (await fetch(`${API_QURAN}/surat/${nomor}`)).json()).data;
        document.getElementById('read-surah-name').innerHTML = `${currentSurah.namaLatin} <i class="fas fa-info-circle small text-muted"></i>`;
        document.getElementById('read-surah-info').innerText = `Surat ke-${currentSurah.nomor} • ${currentSurah.arti}`;
        
        let html = currentSurah.nomor !== 9 && currentSurah.nomor !== 1 ? `<div class="text-arab text-primary text-center font-arab" style="font-size:${prefs.arabSize}px;">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>` : '';
        
        html += currentSurah.ayat.map((a, i) => {
            const isMarked = bookmark && bookmark.sNo === currentSurah.nomor && bookmark.aNo === a.nomorAyat;
            return `
            <div class="ayah-item" id="ayah-${i}">
                <div class="ayah-toolbar">
                    <span class="ayah-badge">${currentSurah.nomor}:${a.nomorAyat}</span>
                    <div class="ayah-actions">
                        <button class="btn-ayah-action" onclick="playAyah(${i})"><i class="fas fa-play" id="icon-play-${i}"></i></button>
                        <button class="btn-ayah-action btn-bookmark ${isMarked ? 'active' : ''}" onclick="bookmarkAyah(${currentSurah.nomor}, ${a.nomorAyat}, '${currentSurah.namaLatin}', this, ${currentSurah.jumlahAyat})"><i class="fas fa-bookmark"></i></button>
                        <button class="btn-ayah-action text-info" onclick="openTafsirPerAyat(${currentSurah.nomor}, ${a.nomorAyat})"><i class="fas fa-book-open"></i></button>
                        <button class="btn-ayah-action btn-record" id="btn-record-${i}" onclick="toggleRecord(${i})"><i class="fas fa-microphone"></i></button>
                        <button class="btn-ayah-action text-success" onclick="openWallpaperCreator('${a.teksArab.replace(/'/g, "\\'")}', '${a.teksIndonesia.replace(/'/g, "\\'")}', '${currentSurah.namaLatin}', ${a.nomorAyat})"><i class="fas fa-paint-brush"></i></button>
                        <button class="btn-ayah-action" onclick="shareAyah(${currentSurah.nomor}, ${a.nomorAyat}, '${a.teksArab.replace(/'/g, "\\'")}', '${a.teksIndonesia.replace(/'/g, "\\'")}')"><i class="fas fa-share-alt"></i></button>
                    </div>
                </div>
                <audio id="audio-user-${i}" controls class="w-100 mb-2 hidden" style="height: 30px;"></audio>
                <div class="text-arab font-arab" style="font-size:${prefs.arabSize}px;">${prefs.showTajwid ? applyTajwid(a.teksArab) : a.teksArab}</div>
                <div class="box-latin ${prefs.showLatin?'':'hidden'}"><div class="text-latin" style="font-size:${prefs.latinSize}px;">${a.teksLatin}</div></div>
                <div class="box-trans ${prefs.showTrans?'':'hidden'}"><div class="text-trans" style="font-size:${prefs.latinSize}px;">${a.teksIndonesia}</div></div>
            </div>`;
        }).join('');
        
        document.getElementById('ayah-list').innerHTML = html; activeAyahIndex = -1; 
        
        if(targetAyah > 1) {
            setTimeout(() => {
                const targetEl = document.getElementById(`ayah-${targetAyah - 1}`);
                if(targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 600);
        }
    } catch(e) { alert("Gagal memuat."); switchPage('page-home'); }
}

function applyTajwid(t) {
    return t.replace(/([نم])[\u0651]/g, `<span class="t-rule tj-ghunnah" onclick="showTajwidInfo('Ghunnah', '$&')">$&</span>`)
            .replace(/([بجدطق])\u0652/g, `<span class="t-rule tj-qalqalah" onclick="showTajwidInfo('Qalqalah', '$&')">$&</span>`)
            .replace(/[\u0653]/g, `<span class="t-rule tj-mad" onclick="showTajwidInfo('Mad/Panjang', '$&')">$&</span>`)
            .replace(/[\u06E2]/g, `<span class="t-rule tj-iqlab" onclick="showTajwidInfo('Iqlab', '$&')">$&</span>`)
            .replace(/[\u064B\u064C\u064D]/g, `<span class="t-rule tj-ikhfa" onclick="showTajwidInfo('Ikhfa/Idgham', '$&')">$&</span>`);
}

function checkDirectLink() {
    const p = new URLSearchParams(window.location.search);
    if(p.get('surah')) openSurah(parseInt(p.get('surah')), p.get('ayah') ? parseInt(p.get('ayah')) : 1);
}

// AUDIO ENGINE
function playAyah(idx) {
    document.querySelectorAll('.btn-ayah-action .fa-pause').forEach(i => i.className = 'fas fa-play');
    document.querySelectorAll('.ayah-item').forEach(el => el.classList.remove('playing'));
    const icon = document.getElementById(`icon-play-${idx}`);
    const audioUrl = currentSurah.ayat[idx].audio[prefs.qari];

    if (activeAyahIndex === idx && !audioEngine.paused) {
        audioEngine.pause(); icon.className = 'fas fa-play';
    } else {
        if (activeAyahIndex !== idx || audioEngine.src !== audioUrl) audioEngine.src = audioUrl;
        audioEngine.play(); activeAyahIndex = idx; icon.className = 'fas fa-pause';
        const card = document.getElementById(`ayah-${idx}`);
        card.classList.add('playing'); card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

audioEngine.addEventListener('ended', () => {
    document.getElementById(`icon-play-${activeAyahIndex}`).className = 'fas fa-play';
    if (prefs.autoplay && currentSurah && activeAyahIndex < currentSurah.ayat.length - 1) playAyah(activeAyahIndex + 1);
});

// BOOKMARK & PROGRESS
function bookmarkAyah(sNo, aNo, sName, btnEl, totalAyah) {
    bookmark = { sNo, sName, aNo }; localStorage.setItem('rBookmark', JSON.stringify(bookmark));
    document.querySelectorAll('.btn-bookmark').forEach(btn => btn.classList.remove('active')); btnEl.classList.add('active');
    
    let progData = JSON.parse(localStorage.getItem('surahProgress')) || {};
    progData[sNo] = Math.round((aNo / totalAyah) * 100);
    localStorage.setItem('surahProgress', JSON.stringify(progData));
    
    alert(`Berhasil ditandai: Surat ${sName} Ayat ${aNo}`); checkBookmark();
}

function checkBookmark() {
    const card = document.getElementById('continue-reading-card');
    if(bookmark) { document.getElementById('cr-surah').innerText = bookmark.sName; document.getElementById('cr-ayah').innerText = `Ayat No: ${bookmark.aNo}`; card.classList.remove('hidden'); } 
    else { card.classList.add('hidden'); }
}
function continueReading() { if(bookmark) openSurah(bookmark.sNo, bookmark.aNo); }

function shareAyah(sNo, aNo, teksArab, teksIndo) {
    const link = `${window.location.origin}${window.location.pathname}?surah=${sNo}&ayah=${aNo}`;
    const textToShare = `Q.S ${currentSurah.namaLatin} Ayat ${aNo}:\n\n${teksArab}\n\n"${teksIndo}"\n\nBaca di: ${link}`;
    if (navigator.share) navigator.share({ title: 'Rifqy Quran', text: textToShare }); else { navigator.clipboard.writeText(textToShare); alert("Teks & Link disalin!"); }
}

// AUTO SCROLL
function toggleAutoScroll() {
    scrollSpeed++; if(scrollSpeed > 3) scrollSpeed = 0;
    clearInterval(autoScrollInterval); const btn = document.getElementById('btn-autoscroll-txt');
    if(scrollSpeed === 0) btn.innerText = "Off"; 
    else { btn.innerText = `${scrollSpeed}x`; autoScrollInterval = setInterval(() => { window.scrollBy(0, scrollSpeed); }, 30); }
}

// MODAL CONTROLS
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openSettingsModal() { openModal('modal-settings'); }
function openTafsirModal() {
    if(!currentSurah) return;
    document.getElementById('tafsir-content').innerHTML = currentSurah.deskripsi;
    openModal('modal-tafsir');
}

// SETTINGS LOGIC
function changeQari() { 
    prefs.qari = document.getElementById('qari-selector').value; savePrefs(); 
    if(currentSurah && activeAyahIndex >= 0 && !audioEngine.paused) { audioEngine.src = currentSurah.ayat[activeAyahIndex].audio[prefs.qari]; audioEngine.play(); }
}
function updateFont(type, val) {
    if(type === 'arab') { prefs.arabSize = val; document.querySelectorAll('.text-arab').forEach(e => e.style.fontSize = val+'px'); }
    else { prefs.latinSize = val; document.querySelectorAll('.text-latin, .text-trans').forEach(e => e.style.fontSize = val+'px'); }
    savePrefs();
}
function toggleFeature() {
    prefs.showLatin = document.getElementById('toggle-latin').checked;
    prefs.showTrans = document.getElementById('toggle-trans').checked;
    prefs.showTajwid = document.getElementById('toggle-tajwid').checked;
    prefs.autoplay = document.getElementById('toggle-autoplay').checked;
    document.querySelectorAll('.box-latin').forEach(e => e.classList.toggle('hidden', !prefs.showLatin));
    document.querySelectorAll('.box-trans').forEach(e => e.classList.toggle('hidden', !prefs.showTrans));
    savePrefs();
    if(currentSurah) {
        currentSurah.ayat.forEach((a, i) => { const el = document.querySelector(`#ayah-${i} .text-arab`); if(el) el.innerHTML = prefs.showTajwid ? applyTajwid(a.teksArab) : a.teksArab; });
    }
}
function savePrefs() { localStorage.setItem('rPrefs', JSON.stringify(prefs)); }
function loadPrefsUI() {
    document.getElementById('qari-selector').value = prefs.qari;
    document.getElementById('toggle-latin').checked = prefs.showLatin;
    document.getElementById('toggle-trans').checked = prefs.showTrans;
    document.getElementById('toggle-tajwid').checked = prefs.showTajwid;
    document.getElementById('toggle-autoplay').checked = prefs.autoplay;
}

// REAL PRAYER TIMES ALADHAN API
function getLocationAndPrayerTimes() {
    const prayerContainer = document.getElementById('prayer-times');
    const locationText = document.getElementById('location-text');
    if (navigator.geolocation) {
        locationText.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Mencari...`;
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude; const lng = position.coords.longitude;
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const geoData = await geoRes.json();
                locationText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${geoData.address.city || geoData.address.town || "Lokasi Anda"}`;
                
                const d = new Date(); const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
                const prayerRes = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=2`);
                const t = (await prayerRes.json()).data.timings;
                renderRealPrayerTimes(t, prayerContainer);
                renderRealPrayerTimes(t, document.getElementById('prayer-times-modal')); // Copy for modal
            } catch (err) { locationText.innerText = "Gagal memuat jadwal."; }
        }, () => { locationText.innerText = "Gunakan Default (Jakarta)"; fetchFallbackPrayer(prayerContainer); });
    } else { locationText.innerText = "Tidak didukung."; }
}

function renderRealPrayerTimes(t, container) {
    if(!container) return;
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const list = [{n: "Subuh", t: t.Fajr}, {n: "Dzuhur", t: t.Dhuhr}, {n: "Ashar", t: t.Asr}, {n: "Maghrib", t: t.Maghrib}, {n: "Isya", t: t.Isha}];
    
    container.innerHTML = `
        <div class="prayer-times-grid text-center w-100">
            ${list.map(p => {
                const pMin = parseInt(p.t.split(':')[0])*60 + parseInt(p.t.split(':')[1]);
                const isActive = (pMin > nowMin) ? 'bg-primary text-white' : 'bg-light';
                return `<div class="${isActive} p-2 border-radius"><small>${p.n}</small><br><strong class="font-bold">${p.t}</strong></div>`;
            }).join('')}
        </div>
    `;
}
function fetchFallbackPrayer(container) {
    container.innerHTML = `<div class="prayer-times-grid text-center"><div class="bg-light p-2 border-radius"><small>Subuh</small><br><strong class="font-bold">04:30</strong></div><div class="bg-light p-2 border-radius"><small>Dzuhur</small><br><strong class="font-bold">12:00</strong></div><div class="bg-light p-2 border-radius"><small>Ashar</small><br><strong class="font-bold">15:15</strong></div><div class="bg-primary text-white p-2 border-radius"><small>Maghrib</small><br><strong class="font-bold">18:12</strong></div><div class="bg-light p-2 border-radius"><small>Isya</small><br><strong class="font-bold">19:20</strong></div></div>`;
}
