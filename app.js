/* ==============================================================
   APP.JS - CORE ENGINE (AUTO-HIGHLIGHT FIX, SAAD AL-GHAMDI FIX)
   ============================================================== */

window.API_QURAN = "https://equran.id/api/v2";
window.allSurahs = []; window.currentSurah = null; window.audioEngine = document.getElementById('audio-engine'); window.activeAyahIndex = -1;

window.prefs = JSON.parse(localStorage.getItem('rPrefs')) || { 
    qari: "05", arabSize: 32, latinSize: 14, showLatin: true, showTrans: true, 
    showTajwid: false, showWaqaf: false, popupTajwid: false, popupWaqaf: false,
    autoplay: true, theme: 'auto', audioSpeed: 1.0, sleepTimer: 0, autoHighlight: false, prayerMethod: "auto"
};
window.bookmarksArr = JSON.parse(localStorage.getItem('rBookmarksArr')) || [];
window.autoScrollInterval = null; window.scrollSpeed = 0; window.sleepTimeout = null;

window.safeCall = function(fn) { try { if (typeof window[fn] === 'function') window[fn](); } catch (e) { console.error(`Error in ${fn}:`, e); } };

document.addEventListener('DOMContentLoaded', () => {
    window.safeCall('applyThemeInit'); window.safeCall('fixDateDisplay'); window.safeCall('fetchSurahs'); window.safeCall('loadPrefsUI');
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
    if(pageId === 'page-home') { document.getElementById('nav-home-mob')?.classList.add('active'); document.getElementById('nav-home-desk')?.classList.add('active'); }
    if(pageId === 'page-bookmarks') { document.getElementById('nav-bm-mob')?.classList.add('active'); document.getElementById('nav-bm-desk')?.classList.add('active'); window.renderBookmarksPage(); }
    if(pageId === 'page-explore') { document.getElementById('nav-exp-mob')?.classList.add('active'); document.getElementById('nav-exp-desk')?.classList.add('active'); }
    if(pageId === 'page-settings') { document.getElementById('nav-set-mob')?.classList.add('active'); document.getElementById('nav-set-desk')?.classList.add('active'); }
    if(pageId !== 'page-read') { if(window.audioEngine) { window.audioEngine.pause(); window.audioEngine.ontimeupdate = null; } window.scrollSpeed = 0; clearInterval(window.autoScrollInterval); if(document.getElementById('btn-autoscroll-txt')) document.getElementById('btn-autoscroll-txt').innerText = "Off"; }
    window.scrollTo(0,0);
};

// --- INSPIRASI 50+ QUOTES HARI INI ---
window.renderAyatHariIni = function() {
    const quotes = [
        {a: "لَا يُكَلِّفُ اللّٰهُ نَفْسًا إِلَّا وُسْعَهَا", i: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.", s: "Al-Baqarah : 286"},
        {a: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", i: "Maka sesungguhnya bersama kesulitan ada kemudahan.", s: "Al-Insyirah : 5"},
        {a: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ", i: "Dan Tuhanmu berfirman, 'Berdoalah kepada-Ku, niscaya akan Kuperkenankan bagimu.'", s: "Ghafir : 60"},
        {a: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنْتُمْ", i: "Dan Dia bersamamu di mana saja kamu berada.", s: "Al-Hadid : 4"},
        {a: "فَاذْكُرُونِي أَذْكُرْكُمْ", i: "Maka ingatlah kepada-Ku, Aku pun akan ingat kepadamu.", s: "Al-Baqarah : 152"},
        {a: "وَاللّٰهُ يَعْلَمُ وَأَنْتُمْ لَا تَعْلَمُونَ", i: "Dan Allah mengetahui, sedang kamu tidak mengetahui.", s: "Al-Baqarah : 216"},
        {a: "إِنَّ اللّٰهَ مَعَ الصَّابِرِينَ", i: "Sesungguhnya Allah beserta orang-orang yang sabar.", s: "Al-Baqarah : 153"},
        {a: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللّٰهِ", i: "Dan bersabarlah (Muhammad), dan kesabaranmu itu semata-mata dengan pertolongan Allah.", s: "An-Nahl : 127"},
        {a: "وَمَنْ يَتَوَكَّلْ عَلَى اللّٰهِ فَهُوَ حَسْبُهُ", i: "Dan barangsiapa bertawakal kepada Allah, niscaya Allah akan mencukupkan (keperluan)nya.", s: "At-Talaq : 3"},
        {a: "لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ", i: "Sesungguhnya jika kamu bersyukur, niscaya Aku akan menambah (nikmat) kepadamu.", s: "Ibrahim : 7"},
        {a: "أَلَا بِذِكْرِ اللّٰهِ تَطْمَئِنُّ الْقُلُوبُ", i: "Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.", s: "Ar-Ra'd : 28"},
        {a: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَى", i: "Dan kelak Tuhanmu pasti memberikan karunia-Nya kepadamu, sehingga engkau rida.", s: "Ad-Duha : 5"},
        {a: "رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ", i: "Ya Tuhanku, sesungguhnya aku sangat memerlukan sesuatu kebaikan yang Engkau turunkan kepadaku.", s: "Al-Qasas : 24"},
        {a: "لَا تَحْزَنْ إِنَّ اللّٰهَ مَعَنَا", i: "Janganlah engkau bersedih, sesungguhnya Allah bersama kita.", s: "At-Taubah : 40"},
        {a: "إِنَّ أَكْرَمَكُمْ عِنْدَ اللّٰهِ أَتْقَاكُمْ", i: "Sesungguhnya yang paling mulia di antara kamu di sisi Allah ialah orang yang paling bertakwa.", s: "Al-Hujurat : 13"},
        {a: "وَالْآخِرَةُ خَيْرٌ وَأَبْقَى", i: "Sedangkan kehidupan akhirat adalah lebih baik dan lebih kekal.", s: "Al-A'la : 17"},
        {a: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", i: "Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat.", s: "Al-Baqarah : 201"},
        {a: "فَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ", i: "Maka barangsiapa mengerjakan kebaikan seberat zarrah, niscaya dia akan melihat (balasan)nya.", s: "Az-Zalzalah : 7"},
        {a: "يَهْدِي اللّٰهُ لِنُورِهِ مَنْ يَشَاءُ", i: "Allah memberi petunjuk kepada cahaya-Nya bagi orang yang Dia kehendaki.", s: "An-Nur : 35"},
        {a: "وَتُوبُوا إِلَى اللّٰهِ جَمِيعًا أَيُّهَ الْمُؤْمِنُونَ لَعَلَّكُمْ تُفْلِحُونَ", i: "Dan bertobatlah kamu semua kepada Allah, wahai orang-orang yang beriman, agar kamu beruntung.", s: "An-Nur : 31"},
        {a: "وَاللّٰهُ غَفُورٌ رَحِيمٌ", i: "Dan Allah Maha Pengampun lagi Maha Penyayang.", s: "Al-Imran : 129"},
        {a: "إِنَّ اللّٰهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ", i: "Sesungguhnya Allah menyukai orang-orang yang bertobat dan menyukai orang-orang yang menyucikan diri.", s: "Al-Baqarah : 222"},
        {a: "وَأَحْسِنُوا إِنَّ اللّٰهَ يُحِبُّ الْمُحْسِنِينَ", i: "Dan berbuat baiklah, karena sesungguhnya Allah menyukai orang-orang yang berbuat baik.", s: "Al-Baqarah : 195"},
        {a: "وَلَا تَيْأَسُوا مِنْ رَوْحِ اللّٰهِ", i: "Dan janganlah kamu berputus asa dari rahmat Allah.", s: "Yusuf : 87"},
        {a: "وَاللّٰهُ خَيْرُ الرَّازِقِينَ", i: "Dan Allah adalah sebaik-baik pemberi rezeki.", s: "Al-Jumu'ah : 11"},
        {a: "إِنَّ رَحْمَتَ اللّٰهِ قَرِيبٌ مِنَ الْمُحْسِنِينَ", i: "Sesungguhnya rahmat Allah sangat dekat kepada orang-orang yang berbuat baik.", s: "Al-A'raf : 56"},
        {a: "وَاسْتَغْفِرُوا اللّٰهَ إِنَّ اللّٰهَ غَفُورٌ رَحِيمٌ", i: "Dan mohonlah ampunan kepada Allah. Sesungguhnya Allah Maha Pengampun lagi Maha Penyayang.", s: "Al-Muzzammil : 20"},
        {a: "وَسَارِعُوا إِلَى مَغْفِرَةٍ مِنْ رَبِّكُمْ", i: "Dan bersegeralah kamu mencari ampunan dari Tuhanmu.", s: "Ali 'Imran : 133"},
        {a: "وَاللّٰهُ بِمَا تَعْمَلُونَ خَبِيرٌ", i: "Dan Allah Maha Mengetahui apa yang kamu kerjakan.", s: "Al-Baqarah : 234"},
        {a: "فَسَبِّحْ بِحَمْدِ رَبِّكَ وَكُنْ مِنَ السَّاجِدِينَ", i: "Maka bertasbihlah dengan memuji Tuhanmu dan jadilah engkau di antara orang yang bersujud (shalat).", s: "Al-Hijr : 98"}
    ];
    const pick = quotes[Math.floor(Math.random() * quotes.length)];
    if(document.getElementById('aotd-arab')) { document.getElementById('aotd-arab').innerText = pick.a; document.getElementById('aotd-indo').innerText = `"${pick.i}"`; document.getElementById('aotd-surah').innerText = pick.s; }
};

window.fetchSurahs = async function() {
    const list = document.getElementById('surah-list'); if(!list) return;
    try { const res = await fetch(`${window.API_QURAN}/surat`); const data = await res.json(); window.allSurahs = data.data; window.renderSurahs(window.allSurahs); } 
    catch (e) { list.innerHTML = `<p class="text-center text-danger font-bold mt-3">Gagal memuat Al-Quran.</p>`; }
};
window.renderSurahs = function(data) {
    const list = document.getElementById('surah-list'); if(!list) return;
    const progressData = JSON.parse(localStorage.getItem('surahProgress')) || {};
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

window.checkDirectLink = function() {
    const p = new URLSearchParams(window.location.search); const surahP = p.get('surah'); const ayahP = p.get('ayah');
    if(surahP) { window.openSurah(parseInt(surahP), ayahP ? parseInt(ayahP) : 1); window.history.replaceState({}, document.title, window.location.pathname); }
};

window.openSurah = async function(nomor, targetAyah = 1) {
    window.switchPage('page-read'); document.getElementById('ayah-list').innerHTML = `<div class="text-center mt-5"><i class="fas fa-circle-notch fa-spin text-primary" style="font-size:40px;"></i></div>`;
    try {
        const res = await fetch(`${window.API_QURAN}/surat/${nomor}`); const json = await res.json(); window.currentSurah = json.data;
        
        // Header Bersih tanpa Info Kemenag
        document.getElementById('read-surah-name').innerHTML = window.currentSurah.namaLatin;
        const jumpInput = document.getElementById('input-jump-ayah'); if(jumpInput) jumpInput.max = window.currentSurah.jumlahAyat;

        let html = window.currentSurah.nomor !== 9 && window.currentSurah.nomor !== 1 ? `<div class="text-arab text-primary text-center font-arab" style="font-size:${window.prefs.arabSize}px;">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>` : '';
        html += window.currentSurah.ayat.map((a, i) => {
            const isMarked = window.bookmarksArr.some(b => b.sNo === window.currentSurah.nomor && b.aNo === a.nomorAyat);
            
            // Highlight Persiapan
            let textArabTampil = a.teksArab.split(' ').map((word) => `<span class="q-word">${word}</span>`).join(' ');
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
        
        if(targetAyah > 1) { setTimeout(() => { const targetEl = document.getElementById(`ayah-${targetAyah - 1}`); if(targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 600); }
    } catch(e) { alert("Gagal memuat surat."); window.switchPage('page-home'); }
};

window.executeJumpAyah = function() {
    const val = parseInt(document.getElementById('input-jump-ayah').value);
    if(!val || !window.currentSurah) return;
    if(val > 0 && val <= window.currentSurah.jumlahAyat) {
        window.closeModal('modal-jump');
        setTimeout(() => { const el = document.getElementById(`ayah-${val - 1}`); if(el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.border = "2px solid var(--primary-color)"; setTimeout(()=> { el.style.border = "1px solid var(--border-color)"; }, 2000); } }, 300);
    } else { alert("Nomor ayat tidak valid."); }
};

// --- QARI PREMIUM (PERBAIKAN SERVER SAAD AL-GHAMDI & MAHER) ---
window.getAudioUrl = function(surahNo, ayahNo, qariId, defaultAudioObj) {
    if (parseInt(qariId) <= 5 && qariId !== "04") return defaultAudioObj[qariId] || defaultAudioObj["05"];
    
    // Server Everyayah yang Paling Stabil (Link Update 2026)
    const everyayahMap = { 
        "06": "Yasser_Ad-Dussary_128kbps", 
        "07": "Saad_Al_Ghamdi_128kbps", 
        "08": "MaherAlMuaiqly128kbps", 
        "09": "Abdullah_Matroud_128kbps", 
        "04": "Ibrahim_Akhdar_32kbps" 
    };
    if (everyayahMap[qariId]) { const s = String(surahNo).padStart(3, '0'); const a = String(ayahNo).padStart(3, '0'); return `https://everyayah.com/data/${everyayahMap[qariId]}/${s}${a}.mp3`; }
    return defaultAudioObj["05"];
};

window.playAyah = function(idx) {
    if(!window.currentSurah) return;
    const icon = document.getElementById(`icon-play-${idx}`); const aData = window.currentSurah.ayat[idx];
    const audioUrl = window.getAudioUrl(window.currentSurah.nomor, aData.nomorAyat, window.prefs.qari, aData.audio);
    
    if (window.activeAyahIndex === idx && !window.audioEngine.paused) {
        window.audioEngine.pause(); icon.className = 'fas fa-play'; window.audioEngine.ontimeupdate = null;
    } else {
        document.querySelectorAll('.btn-ayah-action .fa-pause').forEach(i => i.className = 'fas fa-play');
        document.querySelectorAll('.ayah-item').forEach(el => el.classList.remove('playing'));
        document.querySelectorAll('.q-word').forEach(w => w.classList.remove('hl-active'));
        window.audioEngine.ontimeupdate = null;
        
        if (window.activeAyahIndex !== idx || window.audioEngine.src !== audioUrl) window.audioEngine.src = audioUrl;
        
        window.audioEngine.playbackRate = parseFloat(window.prefs.audioSpeed); 
        
        // Peringatan jika Audio gagal dimuat (Internet Error / Server Down)
        window.audioEngine.onerror = function() { alert("Gagal memuat audio Qari ini. Silakan periksa koneksi internet atau ganti Qari di pengaturan bacaan (Titik 3)."); icon.className = 'fas fa-play'; };
        
        window.audioEngine.play(); window.activeAyahIndex = idx; icon.className = 'fas fa-pause';
        if(window.updateMediaSession) window.updateMediaSession(idx);
        
        const card = document.getElementById(`ayah-${idx}`);
        if(card) { card.classList.add('playing'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        
        // HIGHLIGHT PER KATA (SUPER AKURAT VIA TIMEUPDATE)
        if(window.prefs.autoHighlight) {
            window.audioEngine.ontimeupdate = () => {
                if(!window.audioEngine.duration || window.audioEngine.duration === Infinity) return;
                const words = document.querySelectorAll(`#ayah-${idx} .q-word`);
                if(words.length === 0) return;
                const progress = window.audioEngine.currentTime / window.audioEngine.duration;
                const currentWord = Math.floor(progress * words.length);
                words.forEach((w, i) => { if(i === currentWord) w.classList.add('hl-active'); else w.classList.remove('hl-active'); });
            };
        }
    }
};

if(window.audioEngine) {
    window.audioEngine.addEventListener('ended', () => {
        const currentIcon = document.getElementById(`icon-play-${window.activeAyahIndex}`);
        if(currentIcon) currentIcon.className = 'fas fa-play';
        window.audioEngine.ontimeupdate = null; document.querySelectorAll('.q-word').forEach(w => w.classList.remove('hl-active'));
        if (window.prefs.autoplay && window.currentSurah && window.activeAyahIndex < window.currentSurah.ayat.length - 1) window.playAyah(window.activeAyahIndex + 1);
    });
}

window.bookmarkAyah = function(idx, btnEl) {
    if(!window.currentSurah) return;
    const aNo = window.currentSurah.ayat[idx].nomorAyat; const sNo = window.currentSurah.nomor; const sName = window.currentSurah.namaLatin; const totalAyah = window.currentSurah.jumlahAyat;
    const existingIdx = window.bookmarksArr.findIndex(b => b.sNo === sNo && b.aNo === aNo);
    if(existingIdx >= 0) { window.bookmarksArr.splice(existingIdx, 1); btnEl.classList.remove('active'); alert("Penanda dihapus."); } 
    else {
        if(window.bookmarksArr.length >= 100) { alert("Maksimal 100 Penanda!"); return; }
        let folderName = prompt("Kategori (Misal: Favorit, Hafalan):", "Favorit") || "Favorit";
        window.bookmarksArr.unshift({ sNo, sName, aNo, folder: folderName, date: new Date().getTime() }); btnEl.classList.add('active'); alert(`Ditandai di: ${folderName}`);
    }
    localStorage.setItem('rBookmarksArr', JSON.stringify(window.bookmarksArr));
    let progData = JSON.parse(localStorage.getItem('surahProgress')) || {}; progData[sNo] = Math.round((aNo / totalAyah) * 100); localStorage.setItem('surahProgress', JSON.stringify(progData));
    window.checkBookmark();
};

window.renderBookmarksPage = function() {
    const list = document.getElementById('bookmark-list'); if(!list) return;
    const bmCount = document.getElementById('bm-count'); if(bmCount) bmCount.innerText = `${window.bookmarksArr.length}/100`;
    if(window.bookmarksArr.length === 0) { list.innerHTML = "<p class='text-center text-muted'>Belum ada ayat yang ditandai.</p>"; return; }
    const groups = window.bookmarksArr.reduce((acc, curr, i) => { if(!acc[curr.folder]) acc[curr.folder] = []; acc[curr.folder].push({ ...curr, originalIndex: i }); return acc; }, {});
    list.innerHTML = Object.keys(groups).map(folder => `
        <div class="folder-card mt-3 bg-light p-2 border-radius"><h4 class="font-bold text-primary m-0"><i class="fas fa-folder-open"></i> ${folder}</h4></div>
        ${groups[folder].map(b => `
            <div class="surah-card mb-2"><div class="s-num"><i class="fas fa-bookmark"></i></div>
            <div style="flex:1;" onclick="window.openSurah(${b.sNo}, ${b.aNo})"><h4 class="font-bold m-0">${b.sName}</h4><p class="small text-muted m-0">Ayat ${b.aNo}</p></div>
            <button class="btn-icon text-danger" onclick="window.hapusBookmark(${b.originalIndex})"><i class="fas fa-trash-alt"></i></button></div>
        `).join('')}
    `).join('');
};
window.hapusBookmark = function(idx) { window.bookmarksArr.splice(idx, 1); localStorage.setItem('rBookmarksArr', JSON.stringify(window.bookmarksArr)); window.renderBookmarksPage(); window.checkBookmark(); };
window.checkBookmark = function() { const card = document.getElementById('continue-reading-card'); if(!card) return; if(window.bookmarksArr.length > 0) { const last = window.bookmarksArr[0]; document.getElementById('cr-surah').innerText = last.sName; document.getElementById('cr-ayah').innerText = `Ayat No: ${last.aNo}`; card.classList.remove('hidden'); } else card.classList.add('hidden'); };
window.continueReading = function() { if(window.bookmarksArr.length > 0) window.openSurah(window.bookmarksArr[0].sNo, window.bookmarksArr[0].aNo); };

window.shareAyah = function(idx) {
    if(!window.currentSurah) return; const a = window.currentSurah.ayat[idx];
    const link = `${window.location.origin}${window.location.pathname}?surah=${window.currentSurah.nomor}&ayah=${a.nomorAyat}`;
    const textToShare = `Q.S ${window.currentSurah.namaLatin} Ayat ${a.nomorAyat}:\n\n${a.teksArab}\n\n"${a.teksIndonesia}"\n\nBaca selengkapnya di: ${link}`;
    if (navigator.share) navigator.share({ title: 'Rifqy Quran', text: textToShare }); else { navigator.clipboard.writeText(textToShare); alert("Teks & Link disalin!"); }
};

// --- SETTINGS ---
window.changePrayerMethod = function() { window.prefs.prayerMethod = document.getElementById('prayer-method-selector').value; window.savePrefs(); window.getLocationAndPrayerTimes(); };
window.changeQari = function() { window.prefs.qari = document.getElementById('read-qari-selector').value; window.savePrefs(); window.loadPrefsUI(); if(window.currentSurah && window.activeAyahIndex >= 0 && !window.audioEngine.paused) { window.audioEngine.src = window.getAudioUrl(window.currentSurah.nomor, window.currentSurah.ayat[window.activeAyahIndex].nomorAyat, window.prefs.qari, window.currentSurah.ayat[window.activeAyahIndex].audio); window.audioEngine.play(); } };
window.changeSpeed = function() { window.prefs.audioSpeed = document.getElementById('audio-speed-selector').value; window.savePrefs(); if(window.audioEngine) window.audioEngine.playbackRate = parseFloat(window.prefs.audioSpeed); };
window.setSleepTimer = function() {
    window.prefs.sleepTimer = parseInt(document.getElementById('sleep-timer-selector').value); window.savePrefs(); clearTimeout(window.sleepTimeout);
    if(window.prefs.sleepTimer > 0) {
        alert(`Sleep Timer diaktifkan. Audio akan mati dalam ${window.prefs.sleepTimer} Menit.`);
        window.sleepTimeout = setTimeout(() => { if(window.audioEngine && !window.audioEngine.paused) { window.audioEngine.pause(); alert("Sleep Timer mematikan audio."); } }, window.prefs.sleepTimer * 60000);
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
        window.prefs.autoHighlight = document.getElementById('toggle-highlight-read').checked;
    }
    if(document.getElementById('toggle-popup-tajwid')) window.prefs.popupTajwid = document.getElementById('toggle-popup-tajwid').checked;
    if(document.getElementById('toggle-popup-waqaf')) window.prefs.popupWaqaf = document.getElementById('toggle-popup-waqaf').checked;

    window.savePrefs();
    document.querySelectorAll('.box-latin').forEach(e => e.classList.toggle('hidden', !window.prefs.showLatin)); 
    document.querySelectorAll('.box-trans').forEach(e => e.classList.toggle('hidden', !window.prefs.showTrans));
    
    if(window.currentSurah) { 
        window.currentSurah.ayat.forEach((a, i) => { 
            const el = document.querySelector(`#ayah-${i} .text-arab`); 
            if(el) {
                let txt = a.teksArab.split(' ').map((word) => `<span class="q-word">${word}</span>`).join(' ');
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
    if(document.getElementById('audio-speed-selector')) document.getElementById('audio-speed-selector').value = window.prefs.audioSpeed;
    if(document.getElementById('sleep-timer-selector')) document.getElementById('sleep-timer-selector').value = window.prefs.sleepTimer;
    if(document.getElementById('theme-selector')) document.getElementById('theme-selector').value = window.prefs.theme;
    if(document.getElementById('prayer-method-selector')) document.getElementById('prayer-method-selector').value = window.prefs.prayerMethod || "auto";
    if(document.getElementById('font-selector')) document.getElementById('font-selector').value = window.prefs.fontFamily || "'Amiri', serif";
    
    document.querySelectorAll('.range-arab').forEach(el => el.value = window.prefs.arabSize);
    document.querySelectorAll('.range-latin').forEach(el => el.value = window.prefs.latinSize);
    
    if(document.getElementById('toggle-latin-read')) document.getElementById('toggle-latin-read').checked = window.prefs.showLatin;
    if(document.getElementById('toggle-trans-read')) document.getElementById('toggle-trans-read').checked = window.prefs.showTrans;
    if(document.getElementById('toggle-tajwid-read')) document.getElementById('toggle-tajwid-read').checked = window.prefs.showTajwid;
    if(document.getElementById('toggle-waqaf-read')) document.getElementById('toggle-waqaf-read').checked = window.prefs.showWaqaf;
    if(document.getElementById('toggle-autoplay-read')) document.getElementById('toggle-autoplay-read').checked = window.prefs.autoplay;
    if(document.getElementById('toggle-highlight-read')) document.getElementById('toggle-highlight-read').checked = window.prefs.autoHighlight;
    
    if(document.getElementById('toggle-popup-tajwid')) document.getElementById('toggle-popup-tajwid').checked = window.prefs.popupTajwid;
    if(document.getElementById('toggle-popup-waqaf')) document.getElementById('toggle-popup-waqaf').checked = window.prefs.popupWaqaf;
};

window.resetTracker = function() { if(confirm("Yakin ingin mereset semua checklist ibadah hari ini?")) { window.trackerData = { Subuh:false, Dzuhur:false, Ashar:false, Maghrib:false, Isya:false, Puasa:false, Tarawih:false }; localStorage.setItem('rTracker', JSON.stringify(window.trackerData)); window.initTracker(); alert("Tracker ibadah berhasil direset!"); } };
window.clearBookmarks = function() { if(confirm("Yakin ingin MENGHAPUS SEMUA ayat yang tersimpan?")) { window.bookmarksArr = []; localStorage.setItem('rBookmarksArr', JSON.stringify(window.bookmarksArr)); window.renderBookmarksPage(); window.checkBookmark(); alert("Semua ayat tersimpan dihapus!"); } };

// --- JADWAL SHOLAT API (AUTO INTERNASIONAL) ---
window.getLocationAndPrayerTimes = function() {
    const container = document.getElementById('prayer-times'); if(!container) return;
    const fallback = () => { const loc = document.getElementById('location-text'); if(loc) loc.innerHTML = `<i class="fas fa-map-marker-alt"></i> Default (Jakarta)`; container.innerHTML = `<div style="grid-column: span 5; display: flex; justify-content: space-between; text-align: center; width: 100%;"><div class="bg-light p-1 border-radius"><small>Subuh</small><br><strong>04:30</strong></div><div class="bg-light p-1 border-radius"><small>Dzuhur</small><br><strong>12:00</strong></div><div class="bg-light p-1 border-radius"><small>Ashar</small><br><strong>15:15</strong></div><div class="bg-primary text-white p-1 border-radius"><small>Maghrib</small><br><strong>18:00</strong></div><div class="bg-light p-1 border-radius"><small>Isya</small><br><strong>19:15</strong></div></div>`; };
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const lat = pos.coords.latitude; const lng = pos.coords.longitude;
                // Reverse Geocoding
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`); const geoData = await geoRes.json();
                const locText = document.getElementById('location-text'); if(locText) locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${geoData.address.city || geoData.address.town || geoData.address.state || "Lokasi Anda"}`;
                
                const d = new Date(); const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
                // JADWAL SHOLAT AUTO GLOBAL: method=auto, aladhan akan memilih kalkulasi terbaik berdasar negara
                let methodId = window.prefs.prayerMethod || "auto";
                if(methodId === "auto") {
                    const tRes = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=auto`);
                    const tData = await tRes.json(); const t = tData.data.timings;
                    if(t) { window.renderRealPrayerTimes(t, container); window.startPrayerCountdown(t); } else fallback();
                } else {
                    const tRes = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${methodId}`);
                    const tData = await tRes.json(); const t = tData.data.timings;
                    if(t) { window.renderRealPrayerTimes(t, container); window.startPrayerCountdown(t); } else fallback();
                }
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
window.startPrayerCountdown = function(timings) {
    setInterval(() => {
        const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes();
        const list = [{n: "Subuh", t: timings.Fajr}, {n: "Dzuhur", t: timings.Dhuhr}, {n: "Ashar", t: timings.Asr}, {n: "Maghrib", t: timings.Maghrib}, {n: "Isya", t: timings.Isha}];
        let nextName = "Subuh", nextTime = list[0].t;
        for(let p of list) { const pMin = parseInt(p.t.split(':')[0])*60 + parseInt(p.t.split(':')[1]); if(pMin > nowMin) { nextName = p.n; nextTime = p.t; break; } }
        let [nH, nM] = nextTime.split(':').map(Number); let target = new Date(); target.setHours(nH, nM, 0); if(target < now) target.setDate(target.getDate() + 1);
        let diff = target - now; let h = Math.floor((diff / (1000 * 60 * 60)) % 24); let m = Math.floor((diff / 1000 / 60) % 60); let s = Math.floor((diff / 1000) % 60);
        const hc = document.getElementById('header-countdown'); if(hc) hc.innerHTML = `Menuju (${nextName}) ${h}j ${m}m ${s}s`;
    }, 1000);
};

window.openModal = function(id) { const m = document.getElementById(id); if(m) m.style.display = 'flex'; };
window.closeModal = function(id) { const m = document.getElementById(id); if(m) m.style.display = 'none'; };

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
