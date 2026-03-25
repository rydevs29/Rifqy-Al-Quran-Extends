/* ==============================================================
   APP.JS - CORE ENGINE (SINKRONISASI, FULL SCREEN, ADZAN ONLINE)
   (UPDATE CHECKER DIHAPUS PERMANEN)
   ============================================================== */

window.syncStorage = {
    setItem: function(key, value) {
        try {
            if (window.AndroidSync) { window.AndroidSync.saveData(key, value); }
            else { localStorage.setItem(key, value); }
        } catch(e) { console.error("Gagal simpan:", e); }
    },
    getItem: function(key) {
        try {
            let val = null;
            if (window.AndroidSync) { val = window.AndroidSync.getData(key); }
            else { val = localStorage.getItem(key); }
            if(val === "null" || val === "undefined" || val === "") return null;
            return val;
        } catch(e) { return null; }
    }
};

window.allSurahs = []; window.currentSurah = null; window.audioEngine = document.getElementById('audio-engine'); window.activeAyahIndex = -1;

let rawPrefs = window.syncStorage.getItem('rPrefs');
window.prefs = rawPrefs ? JSON.parse(rawPrefs) : { 
    qari: "05", arabSize: 32, latinSize: 14, showLatin: true, showTrans: true, 
    showTajwid: false, showWaqaf: false, popupTajwid: false, popupWaqaf: false,
    autoplay: true, theme: 'auto', audioSpeed: 1.0, sleepTimer: 0, autoHighlight: false, prayerMethod: "auto"
};

// Pengaturan Khusus Adzan (Default On)
let rawAdzan = window.syncStorage.getItem('rAdzanPrefs');
window.adzanPrefs = rawAdzan ? JSON.parse(rawAdzan) : {
    aktif: true, reminder: 0,
    waktu: { Subuh: true, Dzuhur: true, Ashar: true, Maghrib: true, Isya: true }
};

window.audioAdzanOnline = new Audio('https://equran.nos.wjv-1.neo.id/adzan.mp3'); // Standard Suara Adzan Online

let rawBookmarks = window.syncStorage.getItem('rBookmarksArr');
window.bookmarksArr = rawBookmarks ? JSON.parse(rawBookmarks) : [];

window.autoScrollInterval = null; window.scrollSpeed = 0; window.sleepTimeout = null;

window.safeCall = function(fn) { try { if (typeof window[fn] === 'function') window[fn](); } catch (e) { console.error(`Error in ${fn}:`, e); } };

document.addEventListener('DOMContentLoaded', () => {
    window.safeCall('applyThemeInit'); window.safeCall('fixDateDisplay'); 
    window.safeCall('fetchSurahs'); window.safeCall('loadPrefsUI');
    window.safeCall('renderBookmarksPage'); window.safeCall('checkDirectLink'); window.safeCall('getLocationAndPrayerTimes');
    window.safeCall('initTracker'); window.safeCall('initMediaSession'); window.safeCall('renderAyatHariIni');
});

window.applyThemeInit = function() { window.applyTheme(window.prefs.theme); };
window.applyTheme = function(theme) { document.body.className = ''; if(theme === 'dark') document.body.classList.add('dark-mode'); else if(theme === 'auto') document.body.classList.add('auto-mode'); };
window.changeTheme = function() { window.prefs.theme = document.getElementById('theme-selector').value; window.applyTheme(window.prefs.theme); window.savePrefs(); };
window.fixDateDisplay = function() { const today = new Date(); if(document.getElementById('header-date')) document.getElementById('header-date').innerText = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };

window.switchPage = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // FULL SCREEN AGRESSIF
    if (pageId === 'page-read') { document.body.classList.add('reading-mode-fullscreen'); } 
    else { document.body.classList.remove('reading-mode-fullscreen'); }

    if(pageId === 'page-home') { document.getElementById('nav-home-mob')?.classList.add('active'); document.getElementById('nav-home-desk')?.classList.add('active'); }
    if(pageId === 'page-bookmarks') { document.getElementById('nav-bm-mob')?.classList.add('active'); document.getElementById('nav-bm-desk')?.classList.add('active'); window.renderBookmarksPage(); }
    if(pageId === 'page-explore') { document.getElementById('nav-exp-mob')?.classList.add('active'); document.getElementById('nav-exp-desk')?.classList.add('active'); }
    if(pageId === 'page-diary') { document.getElementById('nav-diary-mob')?.classList.add('active'); document.getElementById('nav-diary-desk')?.classList.add('active'); }
    if(pageId === 'page-game') { document.getElementById('nav-game-mob')?.classList.add('active'); document.getElementById('nav-game-desk')?.classList.add('active'); window.safeCall('checkGameOnlineStatus'); }
    if(pageId === 'page-settings') { document.getElementById('nav-set-mob')?.classList.add('active'); document.getElementById('nav-set-desk')?.classList.add('active'); }
    
    if(pageId !== 'page-read') { if(window.audioEngine) { window.audioEngine.pause(); window.audioEngine.ontimeupdate = null; } window.scrollSpeed = 0; clearInterval(window.autoScrollInterval); if(document.getElementById('btn-autoscroll-txt')) document.getElementById('btn-autoscroll-txt').innerText = "Off"; }
    window.scrollTo(0,0);
};

window.renderAyatHariIni = function() {
    const quotes = [
        {a: "لَا يُكَلِّفُ اللّٰهُ نَفْسًا إِلَّا وُسْعَهَا", i: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.", s: "Al-Baqarah : 286"},
        {a: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", i: "Maka sesungguhnya bersama kesulitan ada kemudahan.", s: "Al-Insyirah : 5"},
        {a: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ", i: "Berdoalah kepada-Ku, niscaya akan Kuperkenankan bagimu.", s: "Ghafir : 60"},
        {a: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنْتُمْ", i: "Dan Dia bersamamu di mana saja kamu berada.", s: "Al-Hadid : 4"}
    ];
    const pick = quotes[Math.floor(Math.random() * quotes.length)];
    if(document.getElementById('aotd-arab')) { document.getElementById('aotd-arab').innerText = pick.a; document.getElementById('aotd-indo').innerText = `"${pick.i}"`; document.getElementById('aotd-surah').innerText = pick.s; }
};

window.fetchSurahs = async function() {
    const list = document.getElementById('surah-list'); if(!list) return;
    try { 
        if (window.OFFLINE_QURAN) {
            window.allSurahs = window.OFFLINE_QURAN.surahs; 
            window.renderSurahs(window.allSurahs); 
        } else {
            list.innerHTML = `<div class="text-center w-100 mt-4"><i class="fas fa-circle-notch fa-spin text-primary" style="font-size: 30px;"></i><p class="mt-2 text-muted">Memuat data dari API server...</p></div>`;
            const res = await fetch('https://equran.id/api/v2/surat');
            const data = await res.json(); window.allSurahs = data.data; window.renderSurahs(window.allSurahs);
        }
    } catch (e) { list.innerHTML = `<p class="text-center text-danger font-bold mt-3">Gagal memuat Al-Quran. Pastikan internet aktif.</p>`; }
};

window.renderSurahs = function(data) {
    const list = document.getElementById('surah-list'); if(!list) return;
    let rawProg = window.syncStorage.getItem('surahProgress');
    const progressData = rawProg ? JSON.parse(rawProg) : {};
    
    list.innerHTML = data.map(s => {
        const pct = progressData[s.nomor] || 0; const estMins = Math.ceil((s.jumlahAyat * 12) / 60); 
        return `
        <div class="surah-card" onclick="window.openSurah(${s.nomor})">
            <div class="s-num">${s.nomor}</div>
            <div style="flex:1;">
                <h4 class="font-bold m-0">${s.namaLatin}</h4><p class="small text-muted m-0">${s.arti} • ${s.jumlahAyat} Ayat</p>
                <div class="flex-between mt-1"><small class="text-info"><i class="fas fa-stopwatch"></i> ±${estMins} Menit</small><small class="text-primary font-bold">${pct}%</small></div>
                <div class="surah-progress-container"><div class="surah-progress-fill" style="width: ${pct}%"></div></div>
            </div>
            <div class="s-arab font-arab text-primary ml-2" style="font-size:24px">${s.nama}</div>
        </div>`;
    }).join('');
};

window.filterSurah = function() {
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    if (!isNaN(q) && q !== '') window.renderSurahs(window.allSurahs.filter(s => s.nomor.toString() === q));
    else window.renderSurahs(window.allSurahs.filter(s => s.namaLatin.toLowerCase().includes(q) || s.arti.toLowerCase().includes(q)));
};

window.openSurah = async function(nomor, targetAyah = 1) {
    window.switchPage('page-read'); document.getElementById('ayah-list').innerHTML = `<div class="text-center mt-5"><i class="fas fa-circle-notch fa-spin text-primary" style="font-size:40px;"></i></div>`;
    try {
        if (window.OFFLINE_QURAN) { window.currentSurah = window.OFFLINE_QURAN.surahs.find(s => s.nomor == nomor); } 
        else { const res = await fetch(`https://equran.id/api/v2/surat/${nomor}`); const data = await res.json(); window.currentSurah = data.data; }

        if(!window.currentSurah) throw new Error("Surat tidak ditemukan");
        document.getElementById('read-surah-name').innerHTML = window.currentSurah.namaLatin;
        const jumpInput = document.getElementById('input-jump-ayah'); if(jumpInput) jumpInput.max = window.currentSurah.jumlahAyat;
        const isOfflineApp = window.location.protocol === 'file:';

        let html = window.currentSurah.nomor !== 9 && window.currentSurah.nomor !== 1 ? `<div class="text-arab text-primary text-center font-arab" style="font-size:${window.prefs.arabSize}px;">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>` : '';
        html += window.currentSurah.ayat.map((a, i) => {
            const isMarked = window.bookmarksArr.some(b => b.sNo === window.currentSurah.nomor && b.aNo === a.nomorAyat);
            let textArabTampil = a.teksArab.split(' ').map((word) => `<span class="q-word">${word}</span>`).join(' ');
            if(window.prefs.showTajwid && window.applyTajwid) textArabTampil = window.applyTajwid(textArabTampil);
            if(window.prefs.showWaqaf && window.applyWaqaf) textArabTampil = window.applyWaqaf(textArabTampil);

            let btnPlayHtml = isOfflineApp ? "" : `<button class="btn-ayah-action" onclick="window.playAyah(${i})"><i class="fas fa-play" id="icon-play-${i}"></i></button>`;
            return `
            <div class="ayah-item" id="ayah-${i}">
                <div class="ayah-toolbar">
                    <span class="ayah-badge">${window.currentSurah.nomor}:${a.nomorAyat}</span>
                    <div class="ayah-actions">
                        ${btnPlayHtml}
                        <button class="btn-ayah-action btn-bookmark ${isMarked ? 'active' : ''}" onclick="window.bookmarkAyah(${i}, this)"><i class="fas fa-bookmark"></i></button>
                        <button class="btn-ayah-action text-success" onclick="window.shareAyah(${i})"><i class="fas fa-share-alt"></i></button>
                    </div>
                </div>
                <div class="text-arab font-arab" style="font-size:${window.prefs.arabSize}px;">${textArabTampil}</div>
                <div class="box-latin ${window.prefs.showLatin?'':'hidden'}"><div class="text-latin" style="font-size:${window.prefs.latinSize}px;">${a.teksLatin}</div></div>
                <div class="box-trans ${window.prefs.showTrans?'':'hidden'}"><div class="text-trans" style="font-size:${window.prefs.latinSize}px;">${a.teksIndonesia}</div></div>
            </div>`;
        }).join('');
        document.getElementById('ayah-list').innerHTML = html; window.activeAyahIndex = -1; 
        if(targetAyah > 1) { setTimeout(() => { const targetEl = document.getElementById(`ayah-${targetAyah - 1}`); if(targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 600); }
    } catch(e) { alert("Gagal memuat surat. " + e.message); window.switchPage('page-home'); }
};

window.playAyah = function(idx) {
    if(!window.currentSurah) return;
    const icon = document.getElementById(`icon-play-${idx}`); const aData = window.currentSurah.ayat[idx];
    const audioUrl = aData.audio ? Object.values(aData.audio)[0] : null; // Fallback audio
    if(!audioUrl) { alert("Audio tidak tersedia untuk ayat ini."); return; }
    
    if (window.activeAyahIndex === idx && !window.audioEngine.paused) {
        window.audioEngine.pause(); icon.className = 'fas fa-play'; window.audioEngine.ontimeupdate = null;
    } else {
        document.querySelectorAll('.btn-ayah-action .fa-pause').forEach(i => i.className = 'fas fa-play');
        document.querySelectorAll('.ayah-item').forEach(el => el.classList.remove('playing'));
        document.querySelectorAll('.q-word').forEach(w => w.classList.remove('hl-active'));
        
        window.audioEngine.src = audioUrl;
        window.audioEngine.play(); window.activeAyahIndex = idx; icon.className = 'fas fa-pause';
        document.getElementById(`ayah-${idx}`).classList.add('playing');
    }
};

window.bookmarkAyah = function(idx, btnEl) {
    if(!window.currentSurah) return;
    const aNo = window.currentSurah.ayat[idx].nomorAyat; const sNo = window.currentSurah.nomor; const sName = window.currentSurah.namaLatin; const totalAyah = window.currentSurah.jumlahAyat;
    const existingIdx = window.bookmarksArr.findIndex(b => b.sNo === sNo && b.aNo === aNo);
    if(existingIdx >= 0) { window.bookmarksArr.splice(existingIdx, 1); btnEl.classList.remove('active'); alert("Penanda dihapus."); } 
    else {
        window.bookmarksArr.unshift({ sNo, sName, aNo, folder: "Favorit", date: new Date().getTime() }); btnEl.classList.add('active'); alert(`Tersimpan!`);
    }
    window.syncStorage.setItem('rBookmarksArr', JSON.stringify(window.bookmarksArr));
    window.checkBookmark();
};

window.renderBookmarksPage = function() {
    const list = document.getElementById('bookmark-list'); if(!list) return;
    document.getElementById('bm-count').innerText = `${window.bookmarksArr.length}/100`;
    if(window.bookmarksArr.length === 0) { list.innerHTML = "<p class='text-center text-muted'>Belum ada ayat yang ditandai.</p>"; return; }
    list.innerHTML = window.bookmarksArr.map((b, i) => `
        <div class="surah-card mb-2"><div class="s-num"><i class="fas fa-bookmark"></i></div>
        <div style="flex:1;" onclick="window.openSurah(${b.sNo}, ${b.aNo})"><h4 class="font-bold m-0">${b.sName}</h4><p class="small text-muted m-0">Ayat ${b.aNo}</p></div>
        <button class="btn-icon text-danger" onclick="window.bookmarksArr.splice(${i}, 1); window.syncStorage.setItem('rBookmarksArr', JSON.stringify(window.bookmarksArr)); window.renderBookmarksPage(); window.checkBookmark();"><i class="fas fa-trash-alt"></i></button></div>
    `).join('');
};

window.checkBookmark = function() { const card = document.getElementById('continue-reading-card'); if(!card) return; if(window.bookmarksArr.length > 0) { const last = window.bookmarksArr[0]; document.getElementById('cr-surah').innerText = last.sName; document.getElementById('cr-ayah').innerText = `Ayat No: ${last.aNo}`; card.classList.remove('hidden'); } else card.classList.add('hidden'); };
window.continueReading = function() { if(window.bookmarksArr.length > 0) window.openSurah(window.bookmarksArr[0].sNo, window.bookmarksArr[0].aNo); };

window.changeFontFamily = function() { const font = document.getElementById('font-selector').value; document.querySelectorAll('.text-arab, .font-arab').forEach(el => { el.style.fontFamily = font; }); };
window.updateFont = function(type, val) {
    if(type === 'arab') { window.prefs.arabSize = val; document.querySelectorAll('.text-arab').forEach(e => e.style.fontSize = val+'px'); }
    else { window.prefs.latinSize = val; document.querySelectorAll('.text-latin, .text-trans').forEach(e => e.style.fontSize = val+'px'); }
    window.savePrefs(); window.loadPrefsUI();
};
window.toggleFeature = function() { window.savePrefs(); };
window.savePrefs = function() { window.syncStorage.setItem('rPrefs', JSON.stringify(window.prefs)); };

// ==============================================================
// SISTEM ADZAN ONLINE (PENGATURAN UI & LOGIKA)
// ==============================================================
window.loadPrefsUI = function() {
    if(document.getElementById('theme-selector')) document.getElementById('theme-selector').value = window.prefs.theme;
    if(document.getElementById('font-selector')) document.getElementById('font-selector').value = window.prefs.fontFamily || "'Amiri', serif";
    
    // UI Adzan
    if(document.getElementById('toggle-adzan-main')) document.getElementById('toggle-adzan-main').checked = window.adzanPrefs.aktif;
    if(document.getElementById('adzan-reminder')) document.getElementById('adzan-reminder').value = window.adzanPrefs.reminder;
    if(document.getElementById('toggle-adzan-subuh')) document.getElementById('toggle-adzan-subuh').checked = window.adzanPrefs.waktu.Subuh;
    if(document.getElementById('toggle-adzan-dzuhur')) document.getElementById('toggle-adzan-dzuhur').checked = window.adzanPrefs.waktu.Dzuhur;
    if(document.getElementById('toggle-adzan-ashar')) document.getElementById('toggle-adzan-ashar').checked = window.adzanPrefs.waktu.Ashar;
    if(document.getElementById('toggle-adzan-maghrib')) document.getElementById('toggle-adzan-maghrib').checked = window.adzanPrefs.waktu.Maghrib;
    if(document.getElementById('toggle-adzan-isya')) document.getElementById('toggle-adzan-isya').checked = window.adzanPrefs.waktu.Isya;
};

window.saveAdzanPrefs = function() {
    window.adzanPrefs.aktif = document.getElementById('toggle-adzan-main').checked;
    window.adzanPrefs.reminder = parseInt(document.getElementById('adzan-reminder').value);
    window.adzanPrefs.waktu.Subuh = document.getElementById('toggle-adzan-subuh').checked;
    window.adzanPrefs.waktu.Dzuhur = document.getElementById('toggle-adzan-dzuhur').checked;
    window.adzanPrefs.waktu.Ashar = document.getElementById('toggle-adzan-ashar').checked;
    window.adzanPrefs.waktu.Maghrib = document.getElementById('toggle-adzan-maghrib').checked;
    window.adzanPrefs.waktu.Isya = document.getElementById('toggle-adzan-isya').checked;
    window.syncStorage.setItem('rAdzanPrefs', JSON.stringify(window.adzanPrefs));
    if(window.adzanPrefs.aktif) alert("Pengaturan Notifikasi Adzan disimpan! (Pastikan aplikasi tetap terbuka/online saat waktu sholat tiba)");
};

window.stopAdzan = function() {
    window.audioAdzanOnline.pause();
    window.audioAdzanOnline.currentTime = 0;
    document.getElementById('modal-adzan-alert').style.display = 'none';
};

window.triggerAdzanAlert = function(namaSholat, isReminder) {
    if(!navigator.onLine) return; // Adzan khusus online
    
    document.getElementById('adzan-alert-name').innerText = namaSholat;
    if(isReminder) {
        document.getElementById('adzan-alert-desc').innerText = `Waktu sholat akan masuk dalam ${window.adzanPrefs.reminder} menit lagi.`;
        window.audioAdzanOnline.src = "https://equran.nos.wjv-1.neo.id/adzan.mp3"; // Peringatan pendek/standar
    } else {
        document.getElementById('adzan-alert-desc').innerText = `Telah masuk waktu sholat ${namaSholat} untuk wilayah Anda.`;
        window.audioAdzanOnline.src = "https://equran.nos.wjv-1.neo.id/adzan.mp3"; // Adzan full
    }
    
    document.getElementById('modal-adzan-alert').style.display = 'flex';
    window.audioAdzanOnline.play().catch(e => console.log("Auto-play diblokir browser"));
};

// ==============================================================
// JADWAL SHOLAT & PENGECEKAN ALARM ADZAN ONLINE
// ==============================================================
window.getLocationAndPrayerTimes = function() {
    const container = document.getElementById('prayer-times'); if(!container) return;
    const fallback = () => { const loc = document.getElementById('location-text'); if(loc) loc.innerHTML = `<i class="fas fa-map-marker-alt"></i> Default (Jakarta)`; container.innerHTML = `<div style="grid-column: span 5; display: flex; justify-content: space-between; text-align: center; width: 100%;"><div class="bg-light p-1 border-radius"><small>Subuh</small><br><strong>04:30</strong></div><div class="bg-light p-1 border-radius"><small>Dzuhur</small><br><strong>12:00</strong></div><div class="bg-light p-1 border-radius"><small>Ashar</small><br><strong>15:15</strong></div><div class="bg-primary text-white p-1 border-radius"><small>Maghrib</small><br><strong>18:00</strong></div><div class="bg-light p-1 border-radius"><small>Isya</small><br><strong>19:15</strong></div></div>`; };
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const lat = pos.coords.latitude; const lng = pos.coords.longitude;
                const d = new Date(); const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
                const tRes = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=auto`);
                const tData = await tRes.json(); const t = tData.data.timings;
                if(t) { 
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`); const geoData = await geoRes.json();
                    document.getElementById('location-text').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${geoData.address.city || geoData.address.town || "Lokasi Anda"}`;
                    window.renderRealPrayerTimes(t, container); 
                    window.startPrayerCountdown(t); 
                } else fallback();
            } catch (err) { fallback(); }
        }, () => { fallback(); }, { timeout: 6000 });
    } else { fallback(); }
};

window.renderRealPrayerTimes = function(t, container) {
    if(!container) return; const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const list = [{n: "Subuh", t: t.Fajr}, {n: "Dzuhur", t: t.Dhuhr}, {n: "Ashar", t: t.Asr}, {n: "Maghrib", t: t.Maghrib}, {n: "Isya", t: t.Isha}];
    container.innerHTML = list.map(p => {
        const pMin = parseInt(p.t.split(':')[0])*60 + parseInt(p.t.split(':')[1]);
        const isActive = (pMin > nowMin) ? 'bg-primary text-white' : 'bg-light text-muted';
        return `<div class="${isActive}"><small>${p.n}</small><strong>${p.t}</strong></div>`;
    }).join('');
};

window.lastAdzanTrigger = null;

window.startPrayerCountdown = function(timings) {
    setInterval(() => {
        const now = new Date(); 
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const list = [{n: "Subuh", t: timings.Fajr}, {n: "Dzuhur", t: timings.Dhuhr}, {n: "Ashar", t: timings.Asr}, {n: "Maghrib", t: timings.Maghrib}, {n: "Isya", t: timings.Isha}];
        
        let nextName = "Subuh", nextTime = list[0].t;
        for(let p of list) { 
            const pMin = parseInt(p.t.split(':')[0])*60 + parseInt(p.t.split(':')[1]); 
            
            // CEK NOTIFIKASI ADZAN (ONLINE)
            if(window.adzanPrefs.aktif && window.adzanPrefs.waktu[p.n] && navigator.onLine) {
                // Tepat Waktu
                if(nowStr === p.t && window.lastAdzanTrigger !== p.t) {
                    window.lastAdzanTrigger = p.t;
                    window.triggerAdzanAlert(p.n, false);
                }
                // Pengingat
                if(window.adzanPrefs.reminder > 0) {
                    let rmTime = pMin - window.adzanPrefs.reminder;
                    if(rmTime === nowMin && window.lastAdzanTrigger !== p.n+"-rem") {
                        window.lastAdzanTrigger = p.n+"-rem";
                        window.triggerAdzanAlert(p.n, true);
                    }
                }
            }

            if(pMin > nowMin) { nextName = p.n; nextTime = p.t; break; } 
        }
        
        let [nH, nM] = nextTime.split(':').map(Number); let target = new Date(); target.setHours(nH, nM, 0); if(target < now) target.setDate(target.getDate() + 1);
        let diff = target - now; let h = Math.floor((diff / (1000 * 60 * 60)) % 24); let m = Math.floor((diff / 1000 / 60) % 60); let s = Math.floor((diff / 1000) % 60);
        const hc = document.getElementById('header-countdown'); if(hc) hc.innerHTML = `Menuju (${nextName}) ${h}j ${m}m ${s}s`;
    }, 1000);
};

window.openModal = function(id) { const m = document.getElementById(id); if(m) m.style.display = 'flex'; };
window.closeModal = function(id) { const m = document.getElementById(id); if(m) m.style.display = 'none'; };
