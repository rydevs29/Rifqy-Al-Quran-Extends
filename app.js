/* ==============================================================
   APP.JS - CORE ENGINE (5 IKON SAJA, WAQAF/TAJWID DEFAULT OFF)
   ============================================================== */

window.API_QURAN = "https://equran.id/api/v2";
window.allSurahs = []; window.currentSurah = null; window.audioEngine = document.getElementById('audio-engine'); window.activeAyahIndex = -1;

// DEFAULT: showTajwid = false, showWaqaf = false
window.prefs = JSON.parse(localStorage.getItem('rPrefs')) || { qari: "05", arabSize: 32, latinSize: 14, showLatin: true, showTrans: true, showTajwid: false, showWaqaf: false, autoplay: true, theme: 'auto' };
window.bookmarksArr = JSON.parse(localStorage.getItem('rBookmarksArr')) || [];
window.autoScrollInterval = null; window.scrollSpeed = 0;

window.safeCall = function(fn) {
    try { if (typeof window[fn] === 'function') window[fn](); } catch (e) { console.error(`Error in ${fn}:`, e); }
};

document.addEventListener('DOMContentLoaded', () => {
    window.safeCall('applyThemeInit');
    window.safeCall('fixDateDisplay');
    window.safeCall('fetchSurahs');
    window.safeCall('loadPrefsUI');
    window.safeCall('renderBookmarksPage');
    window.safeCall('checkDirectLink');
    window.safeCall('getLocationAndPrayerTimes');
    window.safeCall('renderCalGrid');
    window.safeCall('initTracker');
    window.safeCall('initMediaSession');
});

window.applyThemeInit = function() { window.applyTheme(window.prefs.theme); };
window.applyTheme = function(theme) {
    document.body.className = '';
    if(theme === 'dark') document.body.classList.add('dark-mode');
    else if(theme === 'auto') document.body.classList.add('auto-mode');
};
window.changeTheme = function() { window.prefs.theme = document.getElementById('theme-selector').value; window.applyTheme(window.prefs.theme); window.savePrefs(); };

window.fixDateDisplay = function() {
    const today = new Date();
    const gregStr = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if(document.getElementById('header-date')) document.getElementById('header-date').innerText = gregStr;
};

window.switchPage = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if(pageId === 'page-home') { document.getElementById('nav-home-mob')?.classList.add('active'); document.getElementById('nav-home-desk')?.classList.add('active'); }
    if(pageId === 'page-bookmarks') { document.getElementById('nav-bm-mob')?.classList.add('active'); document.getElementById('nav-bm-desk')?.classList.add('active'); window.renderBookmarksPage(); }
    if(pageId === 'page-explore') { document.getElementById('nav-exp-mob')?.classList.add('active'); document.getElementById('nav-exp-desk')?.classList.add('active'); }
    if(pageId === 'page-settings') { document.getElementById('nav-set-mob')?.classList.add('active'); document.getElementById('nav-set-desk')?.classList.add('active'); }
    if(pageId !== 'page-read') {
        if(window.audioEngine) window.audioEngine.pause(); window.scrollSpeed = 0; clearInterval(window.autoScrollInterval);
        if(document.getElementById('btn-autoscroll-txt')) document.getElementById('btn-autoscroll-txt').innerText = "Off";
    }
    window.scrollTo(0,0);
};

window.fetchSurahs = async function() {
    const list = document.getElementById('surah-list');
    if(!list) return;
    try {
        const res = await fetch(`${window.API_QURAN}/surat`); 
        const data = await res.json(); 
        window.allSurahs = data.data; 
        window.renderSurahs(window.allSurahs);
    } catch (e) { list.innerHTML = `<p class="text-center text-danger font-bold mt-3">Gagal memuat Al-Quran.</p>`; }
};
window.renderSurahs = function(data) {
    const list = document.getElementById('surah-list');
    if(!list) return;
    const progressData = JSON.parse(localStorage.getItem('surahProgress')) || {};
    list.innerHTML = data.map(s => {
        const pct = progressData[s.nomor] || 0;
        return `
        <div class="surah-card" onclick="window.openSurah(${s.nomor})">
            <div class="s-num">${s.nomor}</div>
            <div style="flex:1;"><h4 class="font-bold m-0">${s.namaLatin}</h4><div class="flex-between"><p class="small text-muted m-0">${s.arti} • ${s.jumlahAyat} Ayat</p><small class="text-primary font-bold">${pct}%</small></div><div class="surah-progress-container"><div class="surah-progress-fill" style="width: ${pct}%"></div></div></div>
            <div class="s-arab font-arab text-primary ml-2" style="font-size:24px">${s.nama}</div>
        </div>`;
    }).join('');
};
window.filterSurah = function() {
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    if (!isNaN(q) && q !== '') window.renderSurahs(window.allSurahs.filter(s => s.nomor.toString() === q));
    else window.renderSurahs(window.allSurahs.filter(s => s.namaLatin.toLowerCase().includes(q) || s.arti.toLowerCase().includes(q)));
};

window.checkDirectLink = function() {
    const p = new URLSearchParams(window.location.search);
    const surahP = p.get('surah'); const ayahP = p.get('ayah');
    if(surahP) {
        window.openSurah(parseInt(surahP), ayahP ? parseInt(ayahP) : 1);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

window.openSurah = async function(nomor, targetAyah = 1) {
    window.switchPage('page-read');
    document.getElementById('ayah-list').innerHTML = `<div class="text-center mt-5"><i class="fas fa-circle-notch fa-spin text-primary" style="font-size:40px;"></i></div>`;
    try {
        const res = await fetch(`${window.API_QURAN}/surat/${nomor}`);
        const json = await res.json();
        window.currentSurah = json.data;
        document.getElementById('read-surah-name').innerHTML = `${window.currentSurah.namaLatin} <i class="fas fa-info-circle small text-muted"></i>`;
        document.getElementById('read-surah-info').innerText = `Surat ke-${window.currentSurah.nomor} • ${window.currentSurah.arti}`;
        
        let html = window.currentSurah.nomor !== 9 && window.currentSurah.nomor !== 1 ? `<div class="text-arab text-primary text-center font-arab" style="font-size:${window.prefs.arabSize}px;">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>` : '';
        
        html += window.currentSurah.ayat.map((a, i) => {
            const isMarked = window.bookmarksArr.some(b => b.sNo === window.currentSurah.nomor && b.aNo === a.nomorAyat);
            
            // Render Text dengan Tajwid dan Waqaf Sesuai Pengaturan
            let textArabTampil = a.teksArab;
            if(window.prefs.showTajwid && window.applyTajwid) textArabTampil = window.applyTajwid(textArabTampil);
            if(window.prefs.showWaqaf && window.applyWaqaf) textArabTampil = window.applyWaqaf(textArabTampil);

            return `
            <div class="ayah-item" id="ayah-${i}">
                <div class="ayah-toolbar">
                    <span class="ayah-badge">${window.currentSurah.nomor}:${a.nomorAyat}</span>
                    <div class="ayah-actions">
                        <button class="btn-ayah-action" onclick="window.playAyah(${i})"><i class="fas fa-play" id="icon-play-${i}"></i></button>
                        <button class="btn-ayah-action btn-bookmark ${isMarked ? 'active' : ''}" onclick="window.bookmarkAyah(${i}, this)"><i class="fas fa-bookmark"></i></button>
                        <button class="btn-ayah-action text-info" onclick="window.openTafsirPerAyat(${window.currentSurah.nomor}, ${a.nomorAyat})"><i class="fas fa-book-open"></i></button>
                        <button class="btn-ayah-action text-success" onclick="window.openWallpaperCreator(${i})"><i class="fas fa-paint-brush"></i></button>
                        <button class="btn-ayah-action" onclick="window.shareAyah(${i})"><i class="fas fa-share-alt"></i></button>
                    </div>
                </div>
                <div class="text-arab font-arab" style="font-size:${window.prefs.arabSize}px;">${textArabTampil}</div>
                <div class="box-latin ${window.prefs.showLatin?'':'hidden'}"><div class="text-latin" style="font-size:${window.prefs.latinSize}px;">${a.teksLatin}</div></div>
                <div class="box-trans ${window.prefs.showTrans?'':'hidden'}"><div class="text-trans" style="font-size:${window.prefs.latinSize}px;">${a.teksIndonesia}</div></div>
            </div>`;
        }).join('');
        
        document.getElementById('ayah-list').innerHTML = html; window.activeAyahIndex = -1; 
        
        if(targetAyah > 1) {
            setTimeout(() => {
                const targetEl = document.getElementById(`ayah-${targetAyah - 1}`);
                if(targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 600);
        }
    } catch(e) { alert("Gagal memuat surat."); window.switchPage('page-home'); }
};

window.playAyah = function(idx) {
    if(!window.currentSurah) return;
    const icon = document.getElementById(`icon-play-${idx}`);
    const audioUrl = window.currentSurah.ayat[idx].audio[window.prefs.qari] || window.currentSurah.ayat[idx].audio["05"]; 
    
    if (window.activeAyahIndex === idx && !window.audioEngine.paused) {
        window.audioEngine.pause(); icon.className = 'fas fa-play';
    } else {
        document.querySelectorAll('.btn-ayah-action .fa-pause').forEach(i => i.className = 'fas fa-play');
        document.querySelectorAll('.ayah-item').forEach(el => el.classList.remove('playing'));
        if (window.activeAyahIndex !== idx || window.audioEngine.src !== audioUrl) window.audioEngine.src = audioUrl;
        window.audioEngine.play(); window.activeAyahIndex = idx; icon.className = 'fas fa-pause';
        if(window.updateMediaSession) window.updateMediaSession(idx);
        const card = document.getElementById(`ayah-${idx}`);
        if(card) { card.classList.add('playing'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
};
if(window.audioEngine) {
    window.audioEngine.addEventListener('ended', () => {
        const currentIcon = document.getElementById(`icon-play-${window.activeAyahIndex}`);
        if(currentIcon) currentIcon.className = 'fas fa-play';
        if (window.prefs.autoplay && window.currentSurah && window.activeAyahIndex < window.currentSurah.ayat.length - 1) window.playAyah(window.activeAyahIndex + 1);
    });
}

window.bookmarkAyah = function(idx, btnEl) {
    if(!window.currentSurah) return;
    const aNo = window.currentSurah.ayat[idx].nomorAyat; const sNo = window.currentSurah.nomor; const sName = window.currentSurah.namaLatin; const totalAyah = window.currentSurah.jumlahAyat;
    const existingIdx = window.bookmarksArr.findIndex(b => b.sNo === sNo && b.aNo === aNo);
    
    if(existingIdx >= 0) {
        window.bookmarksArr.splice(existingIdx, 1); btnEl.classList.remove('active'); alert("Penanda dihapus.");
    } else {
        if(window.bookmarksArr.length >= 100) { alert("Maksimal 100 Penanda!"); return; }
        let folderName = prompt("Kategori (Misal: Favorit, Hafalan):", "Favorit") || "Favorit";
        window.bookmarksArr.unshift({ sNo, sName, aNo, folder: folderName, date: new Date().getTime() });
        btnEl.classList.add('active'); alert(`Ditandai di: ${folderName}`);
    }
    
    localStorage.setItem('rBookmarksArr', JSON.stringify(window.bookmarksArr));
    let progData = JSON.parse(localStorage.getItem('surahProgress')) || {};
    progData[sNo] = Math.round((aNo / totalAyah) * 100); localStorage.setItem('surahProgress', JSON.stringify(progData));
    window.checkBookmark();
};

window.renderBookmarksPage = function() {
    const list = document.getElementById('bookmark-list');
    if(!list) return;
    const bmCount = document.getElementById('bm-count');
    if(bmCount) bmCount.innerText = `${window.bookmarksArr.length}/100`;
    
    if(window.bookmarksArr.length === 0) { list.innerHTML = "<p class='text-center text-muted'>Belum ada ayat yang ditandai.</p>"; return; }
    
    const groups = window.bookmarksArr.reduce((acc, curr, i) => {
        if(!acc[curr.folder]) acc[curr.folder] = [];
        acc[curr.folder].push({ ...curr, originalIndex: i }); return acc;
    }, {});
    
    list.innerHTML = Object.keys(groups).map(folder => `
        <div class="folder-card mt-3 bg-light p-2 border-radius"><h4 class="font-bold text-primary m-0"><i class="fas fa-folder-open"></i> ${folder}</h4></div>
        ${groups[folder].map(b => `
            <div class="surah-card mb-2">
                <div class="s-num"><i class="fas fa-bookmark"></i></div>
                <div style="flex:1;" onclick="window.openSurah(${b.sNo}, ${b.aNo})"><h4 class="font-bold m-0">${b.sName}</h4><p class="small text-muted m-0">Ayat ${b.aNo}</p></div>
                <button class="btn-icon text-danger" onclick="window.hapusBookmark(${b.originalIndex})"><i class="fas fa-trash-alt"></i></button>
            </div>
        `).join('')}
    `).join('');
};

window.hapusBookmark = function(idx) { window.bookmarksArr.splice(idx, 1); localStorage.setItem('rBookmarksArr', JSON.stringify(window.bookmarksArr)); window.renderBookmarksPage(); window.checkBookmark(); };
window.checkBookmark = function() {
    const card = document.getElementById('continue-reading-card');
    if(!card) return;
    if(window.bookmarksArr.length > 0) { 
        const last = window.bookmarksArr[0];
        document.getElementById('cr-surah').innerText = last.sName; document.getElementById('cr-ayah').innerText = `Ayat No: ${last.aNo}`; card.classList.remove('hidden'); 
    } else card.classList.add('hidden');
};
window.continueReading = function() { if(window.bookmarksArr.length > 0) window.openSurah(window.bookmarksArr[0].sNo, window.bookmarksArr[0].aNo); };

window.shareAyah = function(idx) {
    if(!window.currentSurah) return;
    const a = window.currentSurah.ayat[idx];
    const link = `${window.location.origin}${window.location.pathname}?surah=${window.currentSurah.nomor}&ayah=${a.nomorAyat}`;
    const textToShare = `Q.S ${window.currentSurah.namaLatin} Ayat ${a.nomorAyat}:\n\n${a.teksArab}\n\n"${a.teksIndonesia}"\n\nBaca selengkapnya di: ${link}`;
    if (navigator.share) navigator.share({ title: 'Rifqy Quran', text: textToShare }); else { navigator.clipboard.writeText(textToShare); alert("Teks & Link disalin!"); }
};
window.openWallpaperCreator = function(idx) {
    if(!window.currentSurah) return;
    const a = window.currentSurah.ayat[idx];
    document.getElementById('wp-arab').innerText = a.teksArab; document.getElementById('wp-indo').innerText = `"${a.teksIndonesia}"`; document.getElementById('wp-source').innerText = `Q.S ${window.currentSurah.namaLatin} : ${a.nomorAyat}`;
    window.openModal('modal-wallpaper');
};

// --- SETTINGS ---
window.changeQari = function() { 
    window.prefs.qari = document.getElementById('read-qari-selector').value; 
    window.savePrefs(); window.loadPrefsUI();
    if(window.currentSurah && window.activeAyahIndex >= 0 && !window.audioEngine.paused) { 
        window.audioEngine.src = window.currentSurah.ayat[window.activeAyahIndex].audio[window.prefs.qari] || window.currentSurah.ayat[window.activeAyahIndex].audio["05"]; 
        window.audioEngine.play(); 
    }
};
window.changeFontFamily = function() { const font = document.getElementById('font-selector').value; document.querySelectorAll('.text-arab, .font-arab').forEach(el => { el.style.fontFamily = font; }); };
window.updateFont = function(type, val) {
    if(type === 'arab') { window.prefs.arabSize = val; document.querySelectorAll('.text-arab').forEach(e => e.style.fontSize = val+'px'); }
    else { window.prefs.latinSize = val; document.querySelectorAll('.text-latin, .text-trans').forEach(e => e.style.fontSize = val+'px'); }
    window.savePrefs(); window.loadPrefsUI();
};
window.toggleFeature = function() {
    const isReadModal = document.getElementById('modal-read-settings')?.style.display === 'flex';
    if(isReadModal) {
        window.prefs.showLatin = document.getElementById('toggle-latin-read').checked;
        window.prefs.showTrans = document.getElementById('toggle-trans-read').checked;
        window.prefs.showTajwid = document.getElementById('toggle-tajwid-read').checked;
        window.prefs.showWaqaf = document.getElementById('toggle-waqaf-read').checked;
        window.prefs.autoplay = document.getElementById('toggle-autoplay-read').checked;
    }
    window.savePrefs();
    document.querySelectorAll('.box-latin').forEach(e => e.classList.toggle('hidden', !window.prefs.showLatin)); 
    document.querySelectorAll('.box-trans').forEach(e => e.classList.toggle('hidden', !window.prefs.showTrans));
    
    if(window.currentSurah) { 
        window.currentSurah.ayat.forEach((a, i) => { 
            const el = document.querySelector(`#ayah-${i} .text-arab`); 
            if(el) {
                let txt = a.teksArab;
                if(window.prefs.showTajwid && window.applyTajwid) txt = window.applyTajwid(txt);
                if(window.prefs.showWaqaf && window.applyWaqaf) txt = window.applyWaqaf(txt);
                el.innerHTML = txt;
            }
        }); 
    }
};
window.savePrefs = function() { localStorage.setItem('rPrefs', JSON.stringify(window.prefs)); };
window.loadPrefsUI = function() {
    if(document.getElementById('read-qari-selector')) document.getElementById('read-qari-selector').value = window.prefs.qari;
    if(document.getElementById('theme-selector')) document.getElementById('theme-selector').value = window.prefs.theme;
    document.querySelectorAll('.range-arab').forEach(el => el.value = window.prefs.arabSize);
    document.querySelectorAll('.range-latin').forEach(el => el.value = window.prefs.latinSize);
    
    if(document.getElementById('toggle-latin-read')) document.getElementById('toggle-latin-read').checked = window.prefs.showLatin;
    if(document.getElementById('toggle-trans-read')) document.getElementById('toggle-trans-read').checked = window.prefs.showTrans;
    if(document.getElementById('toggle-tajwid-read')) document.getElementById('toggle-tajwid-read').checked = window.prefs.showTajwid;
    if(document.getElementById('toggle-waqaf-read')) document.getElementById('toggle-waqaf-read').checked = window.prefs.showWaqaf;
    if(document.getElementById('toggle-autoplay-read')) document.getElementById('toggle-autoplay-read').checked = window.prefs.autoplay;
};

// Reset Manajemen Data
window.resetTracker = function() {
    if(confirm("Yakin ingin mereset semua checklist ibadah hari ini?")) {
        window.trackerData = { Subuh:false, Dzuhur:false, Ashar:false, Maghrib:false, Isya:false, Puasa:false, Tarawih:false };
        localStorage.setItem('rTracker', JSON.stringify(window.trackerData));
        window.initTracker(); alert("Tracker ibadah berhasil direset!");
    }
};
window.clearBookmarks = function() {
    if(confirm("Yakin ingin MENGHAPUS SEMUA ayat yang tersimpan?")) {
        window.bookmarksArr = []; localStorage.setItem('rBookmarksArr', JSON.stringify(window.bookmarksArr));
        window.renderBookmarksPage(); window.checkBookmark(); alert("Semua ayat tersimpan dihapus!");
    }
};

window.getLocationAndPrayerTimes = function() {
    const container = document.getElementById('prayer-times');
    if(!container) return;

    const fallback = () => {
        const loc = document.getElementById('location-text');
        if(loc) loc.innerHTML = `<i class="fas fa-map-marker-alt"></i> Default`;
        container.innerHTML = `
            <div style="grid-column: span 5; display: flex; justify-content: space-between; text-align: center; width: 100%;">
                <div class="bg-light p-1 border-radius"><small>Subuh</small><br><strong>04:30</strong></div>
                <div class="bg-light p-1 border-radius"><small>Dzuhur</small><br><strong>12:00</strong></div>
                <div class="bg-light p-1 border-radius"><small>Ashar</small><br><strong>15:15</strong></div>
                <div class="bg-primary text-white p-1 border-radius"><small>Maghrib</small><br><strong>18:00</strong></div>
                <div class="bg-light p-1 border-radius"><small>Isya</small><br><strong>19:15</strong></div>
            </div>`;
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const lat = pos.coords.latitude; const lng = pos.coords.longitude;
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const geoData = await geoRes.json();
                const locText = document.getElementById('location-text');
                if(locText) locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${geoData.address.city || geoData.address.town || "Lokasi Anda"}`;
                
                const d = new Date(); const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
                const tRes = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=2`);
                const tData = await tRes.json();
                const t = tData.data.timings;
                
                if(t) { window.renderRealPrayerTimes(t, container); window.startPrayerCountdown(t); } 
                else fallback();
            } catch (err) { fallback(); }
        }, () => { fallback(); }, { timeout: 6000 });
    } else { fallback(); }
};

window.renderRealPrayerTimes = function(t, container) {
    if(!container) return;
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const list = [{n: "Subuh", t: t.Fajr}, {n: "Dzuhur", t: t.Dhuhr}, {n: "Ashar", t: t.Asr}, {n: "Maghrib", t: t.Maghrib}, {n: "Isya", t: t.Isha}];
    container.innerHTML = list.map(p => {
        const pMin = parseInt(p.t.split(':')[0])*60 + parseInt(p.t.split(':')[1]);
        const isActive = (pMin > nowMin) ? 'bg-primary text-white' : 'bg-light text-muted';
        return `<div class="${isActive}"><small>${p.n}</small><strong>${p.t}</strong></div>`;
    }).join('');
};

window.startPrayerCountdown = function(timings) {
    setInterval(() => {
        const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes();
        const list = [{n: "Subuh", t: timings.Fajr}, {n: "Dzuhur", t: timings.Dhuhr}, {n: "Ashar", t: timings.Asr}, {n: "Maghrib", t: timings.Maghrib}, {n: "Isya", t: timings.Isha}];
        let nextName = "Subuh", nextTime = list[0].t;
        for(let p of list) { const pMin = parseInt(p.t.split(':')[0])*60 + parseInt(p.t.split(':')[1]); if(pMin > nowMin) { nextName = p.n; nextTime = p.t; break; } }
        let [nH, nM] = nextTime.split(':').map(Number); let target = new Date(); target.setHours(nH, nM, 0);
        if(target < now) target.setDate(target.getDate() + 1);
        let diff = target - now; let h = Math.floor((diff / (1000 * 60 * 60)) % 24); let m = Math.floor((diff / 1000 / 60) % 60); let s = Math.floor((diff / 1000) % 60);
        const hc = document.getElementById('header-countdown');
        if(hc) hc.innerHTML = `Menuju (${nextName}) ${h}j ${m}m ${s}s`;
    }, 1000);
};

window.openModal = function(id) { const m = document.getElementById(id); if(m) m.style.display = 'flex'; };
window.closeModal = function(id) { const m = document.getElementById(id); if(m) m.style.display = 'none'; };

window.openTafsirModal = function() { 
    if(!window.currentSurah) return; 
    document.getElementById('tafsir-content').innerHTML = `
        <h4 class="text-primary mb-2 font-bold">Tentang Surat ${window.currentSurah.namaLatin}</h4>
        <div style="font-size:14px; line-height:1.6; text-align:justify;">${window.currentSurah.deskripsi}</div>
    `; 
    window.openModal('modal-tafsir'); 
};

window.renderCalGrid = function() {
    const calGrid = document.getElementById('cal-grid');
    if(!calGrid) return;
    try {
        const formatterMonth = new Intl.DateTimeFormat('id-ID-u-ca-islamic', { month: 'long', year: 'numeric' });
        const formatterDay = new Intl.DateTimeFormat('en-US-u-ca-islamic', { day: 'numeric' });
        document.getElementById('cal-month-year').innerText = formatterMonth.format(new Date());
        const today = parseInt(formatterDay.format(new Date()));
        calGrid.innerHTML = Array.from({length: 30}, (_, i) => `<div class="cal-day ${i+1 === today ? 'today' : ''}">${i+1}</div>`).join('');
    } catch(e) {
        document.getElementById('cal-month-year').innerText = "Bulan Hijriah";
        calGrid.innerHTML = Array.from({length: 30}, (_, i) => `<div class="cal-day">${i+1}</div>`).join('');
    }
};

window.tahfidzMode = false;
window.toggleTahfidzMode = function() {
    window.tahfidzMode = !window.tahfidzMode; const btn = document.getElementById('btn-tahfidz');
    if (window.tahfidzMode) { document.body.classList.add('tahfidz-mode'); btn.innerHTML = '<i class="fas fa-eye"></i> Buka'; btn.classList.replace('btn-outline-primary', 'btn-primary'); } 
    else { document.body.classList.remove('tahfidz-mode'); btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hafalan'; btn.classList.replace('btn-primary', 'btn-outline-primary'); }
};
window.toggleAutoScroll = function() {
    window.scrollSpeed++; if(window.scrollSpeed > 3) window.scrollSpeed = 0; clearInterval(window.autoScrollInterval); const btn = document.getElementById('btn-autoscroll-txt');
    if(window.scrollSpeed === 0) btn.innerText = "Off"; else { btn.innerText = `${window.scrollSpeed}x`; window.autoScrollInterval = setInterval(() => { window.scrollBy(0, window.scrollSpeed); }, 30); }
};
