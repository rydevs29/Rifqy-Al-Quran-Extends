const API_QURAN = "https://equran.id/api/v2";
let allSurahs = [], currentSurah = null, audioEngine = document.getElementById('audio-engine'), activeAyahIndex = -1;
// MISHARY RASHID LOCKED: prefs.qari = "05" permanent.
let prefs = JSON.parse(localStorage.getItem('rPrefs')) || { qari: "05", arabSize: 32, latinSize: 14, showLatin: true, showTrans: true, showTajwid: true, autoplay: true, theme: 'auto' };
let bookmarksArr = JSON.parse(localStorage.getItem('rBookmarksArr')) || [];
let autoScrollInterval = null; let scrollSpeed = 0;
let mediaRecorder, audioChunks = [], isRecording = false;

document.addEventListener('DOMContentLoaded', () => {
    prefs.qari = "05"; // Hard Lock to Mishary
    applyTheme(prefs.theme); fixDateDisplay(); fetchSurahs(); loadPrefsUI(); renderBookmarksPage(); checkDirectLink(); getLocationAndPrayerTimes(); renderCalGrid(); initTracker();
    initMediaSession();
});

// --- THEME ---
function applyTheme(theme) {
    document.body.className = '';
    if(theme === 'dark') document.body.classList.add('dark-mode');
    else if(theme === 'auto') document.body.classList.add('auto-mode');
}
function changeTheme() { prefs.theme = document.getElementById('theme-selector').value; applyTheme(prefs.theme); savePrefs(); }

// --- TANGGAL MASEHI & HIJRIAH ---
function fixDateDisplay() {
    const today = new Date();
    document.getElementById('date-greg').innerText = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    try {
        let hijriStr = new Intl.DateTimeFormat('id-ID-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
        document.getElementById('header-hijri').innerHTML = `${hijriStr.replace(/SM|AH/g, '').trim()} H`;
    } catch(e) { document.getElementById('header-hijri').innerHTML = `1447 H`; }
}

// --- NAVIGASI ---
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    if(pageId === 'page-home') { document.getElementById('nav-home-mob')?.classList.add('active'); document.getElementById('nav-home-desk')?.classList.add('active'); }
    if(pageId === 'page-bookmarks') { document.getElementById('nav-bm-mob')?.classList.add('active'); document.getElementById('nav-bm-desk')?.classList.add('active'); renderBookmarksPage(); }
    if(pageId === 'page-explore') { document.getElementById('nav-exp-mob')?.classList.add('active'); document.getElementById('nav-exp-desk')?.classList.add('active'); }
    if(pageId === 'page-settings') { document.getElementById('nav-set-mob')?.classList.add('active'); document.getElementById('nav-set-desk')?.classList.add('active'); }
    
    if(pageId !== 'page-read') {
        audioEngine.pause(); scrollSpeed = 0; clearInterval(autoScrollInterval);
        if(document.getElementById('btn-autoscroll-txt')) document.getElementById('btn-autoscroll-txt').innerText = "Off";
    }
    window.scrollTo(0,0);
}

// --- FETCH QURAN ---
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
            <div style="flex:1;"><h4 class="font-bold m-0">${s.namaLatin}</h4><div class="flex-between"><p class="small text-muted m-0">${s.arti} • ${s.jumlahAyat} Ayat</p><small class="text-primary font-bold">${pct}%</small></div><div class="surah-progress-container"><div class="surah-progress-fill" style="width: ${pct}%"></div></div></div>
            <div class="s-arab font-arab text-primary ml-2" style="font-size:24px">${s.nama}</div>
        </div>`;
    }).join('');
}
function filterSurah() {
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    if (!isNaN(q) && q !== '') renderSurahs(allSurahs.filter(s => s.nomor.toString() === q));
    else renderSurahs(allSurahs.filter(s => s.namaLatin.toLowerCase().includes(q) || s.arti.toLowerCase().includes(q)));
}

// --- DIRECT LINK SHARE ---
function checkDirectLink() {
    const p = new URLSearchParams(window.location.search);
    const surahP = p.get('surah'); const ayahP = p.get('ayah');
    if(surahP) {
        openSurah(parseInt(surahP), ayahP ? parseInt(ayahP) : 1);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// --- BUKA SURAH & RENDER ---
async function openSurah(nomor, targetAyah = 1) {
    switchPage('page-read');
    document.getElementById('ayah-list').innerHTML = `<div class="text-center" style="padding: 50px 0;"><i class="fas fa-circle-notch fa-spin text-primary" style="font-size: 40px;"></i><p class="mt-3 text-muted">Memuat Al-Quran...</p></div>`;
    try {
        currentSurah = (await (await fetch(`${API_QURAN}/surat/${nomor}`)).json()).data;
        document.getElementById('read-surah-name').innerHTML = `${currentSurah.namaLatin} <i class="fas fa-info-circle small text-muted"></i>`;
        document.getElementById('read-surah-info').innerText = `Surat ke-${currentSurah.nomor} • ${currentSurah.arti}`;
        
        let html = currentSurah.nomor !== 9 && currentSurah.nomor !== 1 ? `<div class="text-arab text-primary text-center font-arab" style="font-size:${prefs.arabSize}px;">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>` : '';
        
        html += currentSurah.ayat.map((a, i) => {
            const isMarked = bookmarksArr.some(b => b.sNo === currentSurah.nomor && b.aNo === a.nomorAyat);
            return `
            <div class="ayah-item" id="ayah-${i}">
                <div class="ayah-toolbar">
                    <span class="ayah-badge">${currentSurah.nomor}:${a.nomorAyat}</span>
                    <div class="ayah-actions">
                        <button class="btn-ayah-action" onclick="playAyah(${i})"><i class="fas fa-play" id="icon-play-${i}"></i></button>
                        <button class="btn-ayah-action btn-bookmark ${isMarked ? 'active' : ''}" onclick="bookmarkAyah(${currentSurah.nomor}, ${a.nomorAyat}, '${currentSurah.namaLatin}', this, ${currentSurah.jumlahAyat})"><i class="fas fa-bookmark"></i></button>
                        <button class="btn-ayah-action text-info" onclick="openTafsirPerAyat(${currentSurah.nomor}, ${a.nomorAyat})"><i class="fas fa-book-open"></i></button>
                        <button class="btn-ayah-action btn-record" id="btn-record-${i}" onclick="toggleRecord(${i})"><i class="fas fa-microphone"></i></button>
                        <button class="btn-ayah-action text-success" onclick="openWallpaperCreator(${i})"><i class="fas fa-paint-brush"></i></button>
                        <button class="btn-ayah-action" onclick="shareAyah(${i})"><i class="fas fa-share-alt"></i></button>
                    </div>
                </div>
                <audio id="audio-user-${i}" controls class="w-100 mb-2 hidden" style="height: 30px;"></audio>
                <div class="text-arab font-arab" style="font-size:${prefs.arabSize}px;">${prefs.showTajwid && window.applyTajwid ? window.applyTajwid(a.teksArab) : a.teksArab}</div>
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
    } catch(e) { alert("Gagal memuat surat."); switchPage('page-home'); }
}

// --- MEDIA SESSION (BACKGROUND MUROTTAL) ---
function initMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => audioEngine.play());
        navigator.mediaSession.setActionHandler('pause', () => audioEngine.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => { if(activeAyahIndex > 0) playAyah(activeAyahIndex - 1); });
        navigator.mediaSession.setActionHandler('nexttrack', () => { if(currentSurah && activeAyahIndex < currentSurah.ayat.length - 1) playAyah(activeAyahIndex + 1); });
    }
}
function updateMediaSession(idx) {
    if ('mediaSession' in navigator && currentSurah) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: `Q.S ${currentSurah.namaLatin} Ayat ${currentSurah.ayat[idx].nomorAyat}`,
            artist: 'Syekh Mishary Rashid Alafasy',
            album: 'Rifqy Al-Quran',
            artwork: [{ src: 'https://equran.id/favicon.png', sizes: '512x512', type: 'image/png' }]
        });
    }
}

// --- AUDIO PLAY/PAUSE LOGIC ---
function playAyah(idx) {
    const icon = document.getElementById(`icon-play-${idx}`);
    const audioUrl = currentSurah.ayat[idx].audio["05"]; // LOCKED MISHARY

    if (activeAyahIndex === idx && !audioEngine.paused) {
        audioEngine.pause(); icon.className = 'fas fa-play';
    } else {
        document.querySelectorAll('.btn-ayah-action .fa-pause').forEach(i => i.className = 'fas fa-play');
        document.querySelectorAll('.ayah-item').forEach(el => el.classList.remove('playing'));
        
        if (activeAyahIndex !== idx || audioEngine.src !== audioUrl) audioEngine.src = audioUrl;
        
        audioEngine.play(); activeAyahIndex = idx; icon.className = 'fas fa-pause';
        updateMediaSession(idx);
        
        const card = document.getElementById(`ayah-${idx}`);
        card.classList.add('playing'); card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
audioEngine.addEventListener('ended', () => {
    const currentIcon = document.getElementById(`icon-play-${activeAyahIndex}`);
    if(currentIcon) currentIcon.className = 'fas fa-play';
    if (prefs.autoplay && currentSurah && activeAyahIndex < currentSurah.ayat.length - 1) playAyah(activeAyahIndex + 1);
});

// --- SMART BOOKMARKS (GROUPING) & SHARE (BUG FIXED INDEX BASED) ---
function bookmarkAyah(sNo, aNo, sName, btnEl, totalAyah) {
    const existingIdx = bookmarksArr.findIndex(b => b.sNo === sNo && b.aNo === aNo);
    
    if(existingIdx >= 0) {
        bookmarksArr.splice(existingIdx, 1); btnEl.classList.remove('active'); alert("Penanda dihapus.");
    } else {
        if(bookmarksArr.length >= 100) { alert("Maksimal 100 Penanda!"); return; }
        
        let folderName = prompt("Masukkan kategori (Misal: Hafalan, Favorit, Tugas):", "Favorit") || "Favorit";
        bookmarksArr.unshift({ sNo, sName, aNo, folder: folderName, date: new Date().getTime() });
        btnEl.classList.add('active'); alert(`Berhasil ditandai di kategori: ${folderName}`);
    }
    
    localStorage.setItem('rBookmarksArr', JSON.stringify(bookmarksArr));
    let progData = JSON.parse(localStorage.getItem('surahProgress')) || {};
    progData[sNo] = Math.round((aNo / totalAyah) * 100); localStorage.setItem('surahProgress', JSON.stringify(progData));
    checkBookmark();
}

function renderBookmarksPage() {
    const list = document.getElementById('bookmark-list');
    document.getElementById('bm-count').innerText = `${bookmarksArr.length}/100`;
    if(bookmarksArr.length === 0) { list.innerHTML = "<p class='text-center text-muted'>Belum ada ayat yang ditandai.</p>"; return; }
    
    // Group by folder
    const groups = bookmarksArr.reduce((acc, curr, i) => {
        if(!acc[curr.folder]) acc[curr.folder] = [];
        acc[curr.folder].push({ ...curr, originalIndex: i });
        return acc;
    }, {});
    
    list.innerHTML = Object.keys(groups).map(folder => `
        <h4 class="font-bold text-muted mb-2 mt-3"><i class="fas fa-folder-open text-primary"></i> ${folder}</h4>
        ${groups[folder].map(b => `
            <div class="surah-card mb-2">
                <div class="s-num"><i class="fas fa-bookmark"></i></div>
                <div style="flex:1;" onclick="openSurah(${b.sNo}, ${b.aNo})"><h4 class="font-bold m-0">${b.sName}</h4><p class="small text-muted m-0">Ayat ${b.aNo}</p></div>
                <button class="btn-icon text-danger" onclick="hapusBookmark(${b.originalIndex})"><i class="fas fa-trash-alt"></i></button>
            </div>
        `).join('')}
    `).join('');
}
window.hapusBookmark = function(idx) { bookmarksArr.splice(idx, 1); localStorage.setItem('rBookmarksArr', JSON.stringify(bookmarksArr)); renderBookmarksPage(); checkBookmark(); }

function checkBookmark() {
    const card = document.getElementById('continue-reading-card');
    if(bookmarksArr.length > 0) { 
        const last = bookmarksArr[0];
        document.getElementById('cr-surah').innerText = last.sName; document.getElementById('cr-ayah').innerText = `Ayat No: ${last.aNo}`; card.classList.remove('hidden'); 
    } else card.classList.add('hidden');
}
function continueReading() { if(bookmarksArr.length > 0) openSurah(bookmarksArr[0].sNo, bookmarksArr[0].aNo); }

function shareAyah(idx) {
    if(!currentSurah) return;
    const a = currentSurah.ayat[idx];
    const link = `${window.location.origin}${window.location.pathname}?surah=${currentSurah.nomor}&ayah=${a.nomorAyat}`;
    const textToShare = `Q.S ${currentSurah.namaLatin} Ayat ${a.nomorAyat}:\n\n${a.teksArab}\n\n"${a.teksIndonesia}"\n\nBaca selengkapnya di: ${link}`;
    if (navigator.share) navigator.share({ title: 'Rifqy Quran', text: textToShare }); else { navigator.clipboard.writeText(textToShare); alert("Teks & Link disalin!"); }
}
function openWallpaperCreator(idx) {
    if(!currentSurah) return;
    const a = currentSurah.ayat[idx];
    document.getElementById('wp-arab').innerText = a.teksArab; document.getElementById('wp-indo').innerText = `"${a.teksIndonesia}"`; document.getElementById('wp-source').innerText = `Q.S ${currentSurah.namaLatin} : ${a.nomorAyat}`;
    openModal('modal-wallpaper');
}

// --- SETTINGS ---
function changeFontFamily() { const font = document.getElementById('font-selector').value; document.querySelectorAll('.text-arab, .font-arab').forEach(el => { el.style.fontFamily = font; }); }
function updateFont(type, val) {
    if(type === 'arab') { prefs.arabSize = val; document.querySelectorAll('.text-arab').forEach(e => e.style.fontSize = val+'px'); }
    else { prefs.latinSize = val; document.querySelectorAll('.text-latin, .text-trans').forEach(e => e.style.fontSize = val+'px'); }
    savePrefs();
}
function toggleFeature() {
    prefs.showLatin = document.getElementById('toggle-latin').checked || document.getElementById('toggle-latin-read')?.checked; 
    prefs.showTrans = document.getElementById('toggle-trans').checked || document.getElementById('toggle-trans-read')?.checked; 
    prefs.showTajwid = document.getElementById('toggle-tajwid').checked || document.getElementById('toggle-tajwid-read')?.checked; 
    prefs.autoplay = document.getElementById('toggle-autoplay').checked || document.getElementById('toggle-autoplay-read')?.checked;
    
    document.querySelectorAll('.box-latin').forEach(e => e.classList.toggle('hidden', !prefs.showLatin)); 
    document.querySelectorAll('.box-trans').forEach(e => e.classList.toggle('hidden', !prefs.showTrans));
    savePrefs(); loadPrefsUI();
    if(currentSurah) { currentSurah.ayat.forEach((a, i) => { const el = document.querySelector(`#ayah-${i} .text-arab`); if(el) el.innerHTML = prefs.showTajwid && window.applyTajwid ? window.applyTajwid(a.teksArab) : a.teksArab; }); }
}
window.toggleFeatureRead = toggleFeature;
function savePrefs() { localStorage.setItem('rPrefs', JSON.stringify(prefs)); }
function loadPrefsUI() {
    document.getElementById('theme-selector').value = prefs.theme;
    ['toggle-latin', 'toggle-trans', 'toggle-tajwid', 'toggle-autoplay'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).checked = prefs[id.replace('toggle-', 'show') === 'showautoplay' ? 'autoplay' : id.replace('toggle-', 'show')];
        if(document.getElementById(id+'-read')) document.getElementById(id+'-read').checked = prefs[id.replace('toggle-', 'show') === 'showautoplay' ? 'autoplay' : id.replace('toggle-', 'show')];
    });
}

// --- JADWAL SHOLAT (NO ICON) ---
function getLocationAndPrayerTimes() {
    const container = document.getElementById('prayer-times');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude; const lng = pos.coords.longitude;
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                document.getElementById('location-text').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${(await geoRes.json()).address.city || "Lokasi Anda"}`;
                const d = new Date(); const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
                const t = (await (await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=2`)).json()).data.timings;
                renderRealPrayerTimes(t, container); startPrayerCountdown(t);
            } catch (err) { fetchFallbackPrayer(container); }
        }, () => { fetchFallbackPrayer(container); });
    } else { fetchFallbackPrayer(container); }
}

function renderRealPrayerTimes(t, container) {
    if(!container) return;
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const list = [{n: "Subuh", t: t.Fajr}, {n: "Dzuhur", t: t.Dhuhr}, {n: "Ashar", t: t.Asr}, {n: "Maghrib", t: t.Maghrib}, {n: "Isya", t: t.Isha}];
    container.innerHTML = list.map(p => {
        const pMin = parseInt(p.t.split(':')[0])*60 + parseInt(p.t.split(':')[1]);
        const isActive = (pMin > nowMin) ? 'bg-primary text-white' : 'bg-light text-muted';
        return `<div class="${isActive}"><small>${p.n}</small><strong>${p.t}</strong></div>`;
    }).join('');
}
function fetchFallbackPrayer(container) { container.innerHTML = `<div class="text-center w-100"><p class="small text-muted">Akses lokasi tidak diizinkan.</p></div>`; }

function startPrayerCountdown(timings) {
    setInterval(() => {
        const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes();
        const list = [{n: "Subuh", t: timings.Fajr}, {n: "Dzuhur", t: timings.Dhuhr}, {n: "Ashar", t: timings.Asr}, {n: "Maghrib", t: timings.Maghrib}, {n: "Isya", t: timings.Isha}];
        let nextName = "Subuh", nextTime = list[0].t;
        for(let p of list) { const pMin = parseInt(p.t.split(':')[0])*60 + parseInt(p.t.split(':')[1]); if(pMin > nowMin) { nextName = p.n; nextTime = p.t; break; } }
        let [nH, nM] = nextTime.split(':').map(Number); let target = new Date(); target.setHours(nH, nM, 0);
        if(target < now) target.setDate(target.getDate() + 1);
        let diff = target - now; let h = Math.floor((diff / (1000 * 60 * 60)) % 24); let m = Math.floor((diff / 1000 / 60) % 60); let s = Math.floor((diff / 1000) % 60);
        document.getElementById('header-countdown').innerHTML = `Menuju (${nextName}) ${h}j ${m}m ${s}s`;
    }, 1000);
}

// --- MODALS & TOOLS ---
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openTafsirModal() { if(!currentSurah) return; document.getElementById('tafsir-content').innerHTML = currentSurah.deskripsi; openModal('modal-tafsir'); }
function openEventPopup() { openModal('modal-event'); }

function renderCalGrid() {
    document.getElementById('cal-month-year').innerText = new Intl.DateTimeFormat('id-ID-u-ca-islamic', { month: 'long', year: 'numeric' }).format(new Date());
    document.getElementById('cal-grid').innerHTML = Array.from({length: 30}, (_, i) => `<div class="cal-day ${i+1 === parseInt(new Intl.DateTimeFormat('en-US-u-ca-islamic', { day: 'numeric' }).format(new Date())) ? 'today' : ''}">${i+1}</div>`).join('');
}

let tahfidzMode = false;
function toggleTahfidzMode() {
    tahfidzMode = !tahfidzMode; const btn = document.getElementById('btn-tahfidz');
    if (tahfidzMode) { document.body.classList.add('tahfidz-mode'); btn.innerHTML = '<i class="fas fa-eye"></i> Buka'; btn.classList.replace('btn-outline-primary', 'btn-primary'); } 
    else { document.body.classList.remove('tahfidz-mode'); btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hafalan'; btn.classList.replace('btn-primary', 'btn-outline-primary'); }
}
function toggleAutoScroll() {
    scrollSpeed++; if(scrollSpeed > 3) scrollSpeed = 0; clearInterval(autoScrollInterval); const btn = document.getElementById('btn-autoscroll-txt');
    if(scrollSpeed === 0) btn.innerText = "Off"; else { btn.innerText = `${scrollSpeed}x`; autoScrollInterval = setInterval(() => { window.scrollBy(0, scrollSpeed); }, 30); }
}

// --- SULTAN FEATURES ---
async function toggleRecord(ayahIndex) {
    const btn = document.getElementById(`btn-record-${ayahIndex}`); const audioPlayback = document.getElementById(`audio-user-${ayahIndex}`);
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => { audioPlayback.src = URL.createObjectURL(new Blob(audioChunks, { type: 'audio/webm' })); audioPlayback.classList.remove('hidden'); audioChunks = []; };
            mediaRecorder.start(); isRecording = true; btn.classList.add('recording'); alert("Mulai merekam...");
        } catch (err) { alert("Gagal akses mikrofon."); }
    } else { mediaRecorder.stop(); isRecording = false; btn.classList.remove('recording'); alert("Rekaman selesai."); }
}

async function openTafsirPerAyat(surahNo, ayahNo) {
    document.getElementById('tafsir-content').innerHTML = `<div class="text-center"><i class="fas fa-spinner fa-spin text-primary"></i> Mengambil Tafsir...</div>`;
    openModal('modal-tafsir');
    try {
        const res = await fetch(`https://equran.id/api/v2/tafsir/${surahNo}`); const data = await res.json();
        const tafsirTeks = data.data.tafsir.find(t => t.ayat === ayahNo).teks;
        document.getElementById('tafsir-content').innerHTML = `<h4 class="text-primary mb-2">Tafsir Kemenag (Ayat ${ayahNo})</h4><p style="text-align: justify;">${tafsirTeks}</p>`;
    } catch(e) { document.getElementById('tafsir-content').innerHTML = `<p class="text-danger">Gagal memuat tafsir.</p>`; }
}

function startVoiceSearch() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) { const rec = new SR(); rec.lang = 'id-ID'; rec.start(); const inp = document.getElementById('search-input'); inp.placeholder = "Mendengarkan..."; rec.onresult = e => { inp.value = e.results[0][0].transcript; filterSurah(); inp.placeholder = "Cari Surat..."; }; rec.onerror = () => { alert("Suara tidak jelas."); inp.placeholder = "Cari Surat..."; }; } 
    else alert("Tidak didukung.");
}
function hitungZakat() {
    const m = parseFloat(document.getElementById('zakat-maal').value) || 0; document.getElementById('hasil-maal').innerText = `Rp ${(m * 0.025).toLocaleString('id-ID')}`;
}
function hitungKhatam() {
    const hari = document.getElementById('target-hari').value; const div = document.getElementById('hasil-khatam');
    if (!hari || hari <= 0) { alert("Masukkan hari valid!"); return; }
    div.innerHTML = `Target: Baca <b>${Math.ceil(Math.ceil((604 / hari) / 2) / 5)} Lembar</b> tiap sholat.`; div.classList.remove('hidden');
}
let compassActive = false;
function startCompassReal() {
    if (compassActive) return;
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            let c = e.webkitCompassHeading || Math.abs(e.alpha - 360);
            if (c) { document.getElementById('compass-ring').style.transform = `rotate(${295 - c}deg)`; if (c > 285 && c < 305 && navigator.vibrate) navigator.vibrate(30); }
        }); compassActive = true; alert("Putar HP.");
    } else alert("Sensor tidak didukung.");
}
function findNearbyMosque() { window.open(`https://www.google.com/maps/search/Masjid+Terdekat`, '_blank'); }
let tasbihCount = 0;
window.openTasbih = function() {
    tasbihCount++; if (navigator.vibrate) navigator.vibrate(30);
    document.getElementById('tafsir-content').innerHTML = `<div class="text-center cursor-pointer p-3" onclick="openTasbih()"><p class="text-muted mb-3">Ketuk area ini untuk bertasbih</p><h1 class="text-primary" style="font-size:80px;">${tasbihCount}</h1><button class="btn-outline-primary mt-3" onclick="event.stopPropagation(); tasbihCount=0; openTasbih();">Reset</button></div>`;
    openModal('modal-tafsir');
};
function startQuiz(t) { let ans = prompt("Hukum nun mati bertemu Ba (ب) disebut?\nA. Ikhfa\nB. Iqlab\nC. Idzhar"); if(ans && ans.toLowerCase() === 'b') alert("✅ Benar!"); else alert("❌ Salah."); }

// --- FITUR BARU: 99 ASMAUL HUSNA & TRACKER ---
function renderAsmaulHusna() {
    // Daftar Lengkap 99 Asmaul Husna
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
    document.getElementById('asmaul-list').innerHTML = `<div class="asmaul-grid">${asmaulHusna99.map((n, i) => `<div class="asmaul-item"><div class="small text-muted mb-1">${i+1}</div><h3 class="font-arab text-primary mb-1">${n.a}</h3><strong>${n.l}</strong><br><small class="text-muted">${n.i}</small></div>`).join('')}</div>`;
}

let trackerData = JSON.parse(localStorage.getItem('rTracker')) || { Subuh:false, Dzuhur:false, Ashar:false, Maghrib:false, Isya:false, Puasa:false, Tarawih:false };
function initTracker() {
    renderAsmaulHusna();
    const tList = document.getElementById('tracker-list');
    if(!tList) return;
    tList.innerHTML = Object.keys(trackerData).map(k => `
        <div class="tracker-item">
            <span>${k}</span>
            <input type="checkbox" onchange="updateTracker('${k}', this.checked)" ${trackerData[k] ? 'checked' : ''}>
        </div>
    `).join('');
    updateTrackerProgress();
}
function updateTracker(k, val) { trackerData[k] = val; localStorage.setItem('rTracker', JSON.stringify(trackerData)); updateTrackerProgress(); }
function updateTrackerProgress() {
    const keys = Object.keys(trackerData); const checked = keys.filter(k => trackerData[k]).length;
    const pct = Math.round((checked / keys.length) * 100);
    document.getElementById('tracker-progress').style.width = `${pct}%`; document.getElementById('tracker-status').innerText = `Progres Hari Ini: ${pct}%`;
}
