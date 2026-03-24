const API_QURAN = "https://equran.id/api/v2";
let allSurahs = [], currentSurah = null, audioEngine = document.getElementById('audio-engine'), activeAyahIndex = -1;
let prefs = JSON.parse(localStorage.getItem('rPrefs')) || { qari: "01", arabSize: 32, latinSize: 14, showLatin: true, showTrans: true, showTajwid: true, autoplay: true, theme: 'auto' };
let bookmarksArr = JSON.parse(localStorage.getItem('rBookmarksArr')) || [];
let autoScrollInterval = null; let scrollSpeed = 0;

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(prefs.theme); fixDateDisplay(); fetchSurahs(); loadPrefsUI(); renderBookmarksPage(); checkDirectLink(); getLocationAndPrayerTimes(); renderCalGrid();
});

// --- THEME HANDLING ---
function applyTheme(theme) {
    document.body.className = '';
    if(theme === 'dark') document.body.classList.add('dark-mode');
    else if(theme === 'auto') document.body.classList.add('auto-mode');
}
function changeTheme() {
    prefs.theme = document.getElementById('theme-selector').value;
    applyTheme(prefs.theme); savePrefs();
}

function fixDateDisplay() {
    const today = new Date();
    document.getElementById('date-greg').innerText = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    try {
        let hijriStr = new Intl.DateTimeFormat('id-ID-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
        document.getElementById('header-hijri').innerHTML = `${hijriStr.replace(/SM|AH/g, '').trim()} H`;
    } catch(e) { document.getElementById('header-hijri').innerHTML = `1447 H`; }
}

function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Bottom Nav Active State
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

// --- FETCH & SEARCH QURAN ---
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

// --- DIRECT LINK SHARE & CLEAN URL ---
function checkDirectLink() {
    const p = new URLSearchParams(window.location.search);
    const surahP = p.get('surah'); const ayahP = p.get('ayah');
    if(surahP) {
        openSurah(parseInt(surahP), ayahP ? parseInt(ayahP) : 1);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// --- BUKA SURAH & RENDER AYAT ---
async function openSurah(nomor, targetAyah = 1) {
    switchPage('page-read');
    document.getElementById('ayah-list').innerHTML = `<div class="text-center mt-3"><i class="fas fa-spinner fa-spin text-primary"></i> Memuat...</div>`;
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
                        <button class="btn-ayah-action" onclick="shareAyah(${currentSurah.nomor}, ${a.nomorAyat}, '${a.teksArab.replace(/'/g, "\\'")}', '${a.teksIndonesia.replace(/'/g, "\\'")}')"><i class="fas fa-share-alt"></i></button>
                    </div>
                </div>
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

// --- AUDIO PLAY/PAUSE LOGIC ---
function playAyah(idx) {
    const icon = document.getElementById(`icon-play-${idx}`);
    const audioUrl = currentSurah.ayat[idx].audio[prefs.qari] || currentSurah.ayat[idx].audio["05"];

    if (activeAyahIndex === idx && !audioEngine.paused) {
        audioEngine.pause(); icon.className = 'fas fa-play';
    } else {
        document.querySelectorAll('.btn-ayah-action .fa-pause').forEach(i => i.className = 'fas fa-play');
        document.querySelectorAll('.ayah-item').forEach(el => el.classList.remove('playing'));
        
        if (activeAyahIndex !== idx || audioEngine.src !== audioUrl) audioEngine.src = audioUrl;
        
        audioEngine.play(); activeAyahIndex = idx; icon.className = 'fas fa-pause';
        const card = document.getElementById(`ayah-${idx}`);
        card.classList.add('playing'); card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

audioEngine.addEventListener('ended', () => {
    const currentIcon = document.getElementById(`icon-play-${activeAyahIndex}`);
    if(currentIcon) currentIcon.className = 'fas fa-play';
    if (prefs.autoplay && currentSurah && activeAyahIndex < currentSurah.ayat.length - 1) playAyah(activeAyahIndex + 1);
});

// --- BOOKMARK (ARRAY 100x) & SHARE ---
function bookmarkAyah(sNo, aNo, sName, btnEl, totalAyah) {
    const existingIdx = bookmarksArr.findIndex(b => b.sNo === sNo && b.aNo === aNo);
    
    if(existingIdx >= 0) {
        bookmarksArr.splice(existingIdx, 1);
        btnEl.classList.remove('active');
        alert("Penanda dihapus.");
    } else {
        if(bookmarksArr.length >= 100) { alert("Maksimal 100 Penanda! Hapus yang lama dulu."); return; }
        bookmarksArr.unshift({ sNo, sName, aNo, date: new Date().getTime() });
        btnEl.classList.add('active');
        alert(`Berhasil ditandai: Surat ${sName} Ayat ${aNo}`);
    }
    
    localStorage.setItem('rBookmarksArr', JSON.stringify(bookmarksArr));
    
    // Save Progress Surat
    let progData = JSON.parse(localStorage.getItem('surahProgress')) || {};
    progData[sNo] = Math.round((aNo / totalAyah) * 100); localStorage.setItem('surahProgress', JSON.stringify(progData));
    
    checkBookmark();
}

function renderBookmarksPage() {
    const list = document.getElementById('bookmark-list');
    if(bookmarksArr.length === 0) { list.innerHTML = "<p class='text-center text-muted'>Belum ada ayat yang ditandai.</p>"; return; }
    
    list.innerHTML = bookmarksArr.map((b, i) => `
        <div class="surah-card">
            <div class="s-num"><i class="fas fa-bookmark"></i></div>
            <div style="flex:1;" onclick="openSurah(${b.sNo}, ${b.aNo})">
                <h4 class="font-bold m-0">${b.sName}</h4>
                <p class="small text-muted m-0">Ayat ${b.aNo}</p>
            </div>
            <button class="btn-icon text-danger" onclick="hapusBookmark(${i})"><i class="fas fa-trash-alt"></i></button>
        </div>
    `).join('');
}

window.hapusBookmark = function(idx) {
    bookmarksArr.splice(idx, 1);
    localStorage.setItem('rBookmarksArr', JSON.stringify(bookmarksArr));
    renderBookmarksPage(); checkBookmark();
}

function checkBookmark() {
    const card = document.getElementById('continue-reading-card');
    if(bookmarksArr.length > 0) { 
        const last = bookmarksArr[0];
        document.getElementById('cr-surah').innerText = last.sName; 
        document.getElementById('cr-ayah').innerText = `Ayat No: ${last.aNo}`; 
        card.classList.remove('hidden'); 
    } else { card.classList.add('hidden'); }
}
function continueReading() { if(bookmarksArr.length > 0) openSurah(bookmarksArr[0].sNo, bookmarksArr[0].aNo); }

function shareAyah(sNo, aNo, teksArab, teksIndo) {
    const link = `${window.location.origin}${window.location.pathname}?surah=${sNo}&ayah=${aNo}`;
    const textToShare = `Q.S ${currentSurah.namaLatin} Ayat ${aNo}:\n\n${teksArab}\n\n"${teksIndo}"\n\nBaca di: ${link}`;
    if (navigator.share) navigator.share({ title: 'Rifqy Quran', text: textToShare }); else { navigator.clipboard.writeText(textToShare); alert("Teks & Link disalin!"); }
}

// --- MODALS & SETTINGS ---
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openTafsirModal() { if(!currentSurah) return; document.getElementById('tafsir-content').innerHTML = currentSurah.deskripsi; openModal('modal-tafsir'); }
function openSettingsModal() { switchPage('page-settings'); }
function openEventPopup() { openModal('modal-event'); }

function changeQari() { 
    prefs.qari = document.getElementById('qari-selector').value; savePrefs(); 
    if(currentSurah && activeAyahIndex >= 0 && !audioEngine.paused) { audioEngine.src = currentSurah.ayat[activeAyahIndex].audio[prefs.qari] || currentSurah.ayat[activeAyahIndex].audio["05"]; audioEngine.play(); }
}
function changeFontFamily() {
    const font = document.getElementById('font-selector').value;
    document.querySelectorAll('.text-arab, .font-arab').forEach(el => { el.style.fontFamily = font; });
}
function updateFont(type, val) {
    if(type === 'arab') { prefs.arabSize = val; document.querySelectorAll('.text-arab').forEach(e => e.style.fontSize = val+'px'); }
    else { prefs.latinSize = val; document.querySelectorAll('.text-latin, .text-trans').forEach(e => e.style.fontSize = val+'px'); }
    savePrefs();
}
function toggleFeature() {
    prefs.showLatin = document.getElementById('toggle-latin').checked; prefs.showTrans = document.getElementById('toggle-trans').checked; prefs.showTajwid = document.getElementById('toggle-tajwid').checked; prefs.autoplay = document.getElementById('toggle-autoplay').checked;
    document.querySelectorAll('.box-latin').forEach(e => e.classList.toggle('hidden', !prefs.showLatin)); document.querySelectorAll('.box-trans').forEach(e => e.classList.toggle('hidden', !prefs.showTrans));
    savePrefs();
    if(currentSurah) { currentSurah.ayat.forEach((a, i) => { const el = document.querySelector(`#ayah-${i} .text-arab`); if(el) el.innerHTML = prefs.showTajwid && window.applyTajwid ? window.applyTajwid(a.teksArab) : a.teksArab; }); }
}
function savePrefs() { localStorage.setItem('rPrefs', JSON.stringify(prefs)); }
function loadPrefsUI() {
    document.getElementById('qari-selector').value = prefs.qari; document.getElementById('theme-selector').value = prefs.theme;
    document.getElementById('toggle-latin').checked = prefs.showLatin; document.getElementById('toggle-trans').checked = prefs.showTrans; document.getElementById('toggle-tajwid').checked = prefs.showTajwid; document.getElementById('toggle-autoplay').checked = prefs.autoplay;
}

// --- TAHFIDZ & SCROLL ---
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

// --- JADWAL SHOLAT & COUNTDOWN ---
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
        return `<div class="${isActive} p-2 border-radius text-center"><small>${p.n}</small><br><strong class="font-bold">${p.t}</strong></div>`;
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
        document.getElementById('header-countdown').innerHTML = `<i class="fas fa-clock"></i> Menuju ${nextName}: ${h}j ${m}m ${s}s`;
    }, 1000);
}

function renderCalGrid() {
    document.getElementById('cal-month-year').innerText = new Intl.DateTimeFormat('id-ID-u-ca-islamic', { month: 'long', year: 'numeric' }).format(new Date());
    document.getElementById('cal-grid').innerHTML = Array.from({length: 30}, (_, i) => `<div class="cal-day ${i+1 === parseInt(new Intl.DateTimeFormat('en-US-u-ca-islamic', { day: 'numeric' }).format(new Date())) ? 'today' : ''}">${i+1}</div>`).join('');
}

// Fitur Sultan Sederhana yang tidak perlu file terpisah
function startVoiceSearch() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
        const rec = new SR(); rec.lang = 'id-ID'; rec.start();
        const inp = document.getElementById('search-input'); inp.placeholder = "Mendengarkan...";
        rec.onresult = e => { inp.value = e.results[0][0].transcript; filterSurah(); inp.placeholder = "Cari Surat..."; };
        rec.onerror = () => { alert("Suara tidak jelas."); inp.placeholder = "Cari Surat..."; };
    } else alert("Browser tidak mendukung.");
}
function hitungZakat() {
    const b = parseFloat(document.getElementById('zakat-beras').value) || 0; const m = parseFloat(document.getElementById('zakat-maal').value) || 0;
    document.getElementById('hasil-fitrah').innerText = `Rp ${(b * 2.5).toLocaleString('id-ID')}`; document.getElementById('hasil-maal').innerText = `Rp ${(m * 0.025).toLocaleString('id-ID')}`;
}
function hitungKhatam() {
    const hari = document.getElementById('target-hari').value; const div = document.getElementById('hasil-khatam');
    if(!hari || hari<=0) return alert("Masukkan hari valid!");
    div.innerHTML = `Target: Baca <b>${Math.ceil(Math.ceil((604/hari)/2)/5)} Lembar</b> tiap habis sholat fardhu.`; div.classList.remove('hidden');
}
let compassActive = false;
function startCompassReal() {
    if(compassActive) return;
    if(window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            let c = e.webkitCompassHeading || Math.abs(e.alpha - 360);
            if(c) {
                document.getElementById('compass-ring').style.transform = `rotate(${295 - c}deg)`;
                if(c > 285 && c < 305) { if(navigator.vibrate) navigator.vibrate(30); }
            }
        }); compassActive = true; alert("Putar HP untuk mencari kiblat.");
    } else alert("Sensor tidak didukung.");
}
function findNearbyMosque() { window.open(`https://www.google.com/maps/search/Masjid+Terdekat`, '_blank'); }
let tasbihCount = 0;
function openTasbih() {
    tasbihCount++; if (navigator.vibrate) navigator.vibrate(30);
    document.getElementById('tafsir-content').innerHTML = `<div class="text-center p-3" onclick="openTasbih()"><p class="text-muted">Ketuk area untuk bertasbih</p><h1 class="text-primary" style="font-size:80px;">${tasbihCount}</h1><button class="btn-outline-primary mt-3" onclick="event.stopPropagation(); tasbihCount=0; openTasbih();">Reset</button></div>`;
    openModal('modal-tafsir');
}
