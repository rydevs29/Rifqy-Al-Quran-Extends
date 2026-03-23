const API_QURAN = "https://equran.id/api/v2";
let allSurahs = [], currentSurah = null, audioEngine = document.getElementById('audio-engine'), activeAyahIndex = -1;

// STATE
let prefs = JSON.parse(localStorage.getItem('rPrefs')) || { qari: "05", arabSize: 32, latinSize: 14, showLatin: true, showTrans: true, showTajwid: true, autoplay: true };
let bookmark = JSON.parse(localStorage.getItem('rBookmark')) || null;
let autoScrollInterval = null;
let scrollSpeed = 0; // 0=Off, 1, 2, 3

document.addEventListener('DOMContentLoaded', () => {
    initDate(); fetchSurahs(); loadPrefsUI(); checkBookmark();
});

// --- NAVIGASI ---
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    if(pageId === 'page-home') { document.getElementById('nav-home-mob')?.classList.add('active'); document.getElementById('nav-home-desk')?.classList.add('active'); }
    if(pageId === 'page-tools') { document.getElementById('nav-tools-mob')?.classList.add('active'); document.getElementById('nav-tools-desk')?.classList.add('active'); }
    
    // Matikan scroll dan audio jika keluar dari mode baca
    if(pageId !== 'page-read') {
        audioEngine.pause();
        scrollSpeed = 0; clearInterval(autoScrollInterval);
        if(document.getElementById('btn-autoscroll-txt')) document.getElementById('btn-autoscroll-txt').innerText = "Auto: Off";
    }
    window.scrollTo(0,0);
}

function initDate() {
    const d = new Intl.DateTimeFormat('id-ID-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    if(document.getElementById('date-hijri-text')) document.getElementById('date-hijri-text').innerText = d;
}

// --- FETCH & SEARCH QURAN ---
async function fetchSurahs() {
    try {
        const res = await fetch(`${API_QURAN}/surat`);
        allSurahs = (await res.json()).data;
        renderSurahs(allSurahs);
    } catch (e) { document.getElementById('surah-list').innerHTML = `<p class="text-center text-muted">Gagal memuat. Cek Koneksi.</p>`; }
}
function renderSurahs(data) {
    document.getElementById('surah-list').innerHTML = data.map(s => `
        <div class="surah-card" onclick="openSurah(${s.nomor})">
            <div class="s-num">${s.nomor}</div>
            <div style="flex:1;"><h4>${s.namaLatin}</h4><p class="small text-muted">${s.arti} • ${s.jumlahAyat} Ayat</p></div>
            <div class="s-arab font-arab" style="font-size:22px">${s.nama}</div>
        </div>
    `).join('');
}

function filterSurah() {
    const q = document.getElementById('search-input').value.toLowerCase();
    // Mendukung pencarian berdasar Nomer Surat atau Nama
    if (!isNaN(q) && q.trim() !== '') {
        renderSurahs(allSurahs.filter(s => s.nomor.toString() === q.trim()));
    } else {
        renderSurahs(allSurahs.filter(s => s.namaLatin.toLowerCase().includes(q) || s.arti.toLowerCase().includes(q)));
    }
}

// --- RENDER BACAAN ---
async function openSurah(nomor, targetAyah = 1) {
    switchPage('page-read');
    document.getElementById('ayah-list').innerHTML = `<div class="text-center mt-3"><i class="fas fa-spinner fa-spin text-primary"></i> Memuat surat...</div>`;
    try {
        currentSurah = (await (await fetch(`${API_QURAN}/surat/${nomor}`)).json()).data;
        document.getElementById('read-surah-name').innerHTML = `${currentSurah.namaLatin} <i class="fas fa-info-circle small text-muted"></i>`;
        document.getElementById('read-surah-info').innerText = `Surat ke-${currentSurah.nomor} • ${currentSurah.arti}`;
        
        let html = currentSurah.nomor !== 9 && currentSurah.nomor !== 1 ? `<div class="text-arab text-primary text-center" style="font-size:${prefs.arabSize}px;">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>` : '';
        
        html += currentSurah.ayat.map((a, i) => `
            <div class="ayah-item" id="ayah-${i}">
                <div class="ayah-toolbar">
                    <span class="ayah-badge">${currentSurah.nomor}:${a.nomorAyat}</span>
                    <div class="ayah-actions">
                        <button class="btn-ayah-action" onclick="playAyah(${i}, '${a.audio[prefs.qari]}')">
                            <i class="fas fa-play" id="icon-play-${i}"></i>
                        </button>
                        <button class="btn-ayah-action ${bookmark && bookmark.sNo === currentSurah.nomor && bookmark.aNo === a.nomorAyat ? 'text-primary' : ''}" 
                            onclick="bookmarkAyah(${currentSurah.nomor}, ${a.nomorAyat}, '${currentSurah.namaLatin}', this)">
                            <i class="fas fa-bookmark"></i>
                        </button>
                        <button class="btn-ayah-action" onclick="shareAyah('${currentSurah.namaLatin}', ${a.nomorAyat}, '${a.teksArab}')">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="text-arab" style="font-size:${prefs.arabSize}px;">
                    ${prefs.showTajwid ? applyTajwid(a.teksArab) : a.teksArab}
                </div>
                
                <div class="box-latin ${prefs.showLatin?'':'hidden'}">
                    <div class="text-latin" style="font-size:${prefs.latinSize}px;">${a.teksLatin}</div>
                </div>
                <div class="box-trans ${prefs.showTrans?'':'hidden'}">
                    <div class="text-trans" style="font-size:${prefs.latinSize}px;">${a.teksIndonesia}</div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('ayah-list').innerHTML = html;
        activeAyahIndex = -1; // Reset playing state
        
        // Auto-scroll ke ayat target (jika dari tombol Lanjutkan)
        if(targetAyah > 1) {
            setTimeout(() => {
                const targetEl = document.getElementById(`ayah-${targetAyah - 1}`);
                if(targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    } catch(e) { alert("Gagal memuat."); switchPage('page-home'); }
}

function applyTajwid(t) {
    return t.replace(/([نم])[\u0651]/g, `<span class="tj-ghunnah">$&</span>`)
            .replace(/([بجدطق])\u0652/g, `<span class="tj-qalqalah">$&</span>`)
            .replace(/[\u0653]/g, `<span class="tj-mad">$&</span>`)
            .replace(/[\u06E2]/g, `<span class="tj-iqlab">$&</span>`)
            .replace(/[\u064B\u064C\u064D]/g, `<span class="tj-ikhfa">$&</span>`);
}

// --- TAFSIR MODAL ---
function openTafsirModal() {
    if(!currentSurah) return;
    // EQuran API menyediakan deskripsi HTML untuk tiap surat
    document.getElementById('tafsir-content').innerHTML = currentSurah.deskripsi;
    document.getElementById('modal-tafsir').style.display = 'flex';
}

// --- AUDIO & PER-AYAT ACTION ---
function playAyah(idx, url) {
    // Reset semua icon jadi Play
    document.querySelectorAll('.btn-ayah-action .fa-pause').forEach(i => i.className = 'fas fa-play');
    document.querySelectorAll('.ayah-item').forEach(el => el.classList.remove('playing'));

    const icon = document.getElementById(`icon-play-${idx}`);

    if (activeAyahIndex === idx && !audioEngine.paused) {
        // Pause if clicking the same playing ayah
        audioEngine.pause();
        icon.className = 'fas fa-play';
    } else {
        // Play new ayah
        if (activeAyahIndex !== idx || audioEngine.src !== url) audioEngine.src = url;
        audioEngine.play();
        activeAyahIndex = idx;
        icon.className = 'fas fa-pause';
        
        const card = document.getElementById(`ayah-${idx}`);
        card.classList.add('playing');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

audioEngine.addEventListener('ended', () => {
    document.getElementById(`icon-play-${activeAyahIndex}`).className = 'fas fa-play';
    if (prefs.autoplay && currentSurah && activeAyahIndex < currentSurah.ayat.length - 1) {
        let nxt = activeAyahIndex + 1; 
        playAyah(nxt, currentSurah.ayat[nxt].audio[prefs.qari]);
    }
});

function bookmarkAyah(sNo, aNo, sName, btnEl) {
    bookmark = { sNo, sName, aNo };
    localStorage.setItem('rBookmark', JSON.stringify(bookmark));
    
    // Reset warna semua bookmark
    document.querySelectorAll('.btn-ayah-action .fa-bookmark').forEach(i => i.parentElement.classList.remove('text-primary'));
    btnEl.classList.add('text-primary');
    
    alert(`Berhasil menandai: ${sName} Ayat ${aNo}`);
    checkBookmark();
}

function shareAyah(sName, aNo, arab) {
    const text = `Q.S ${sName} Ayat ${aNo}:\n\n${arab}\n\n- Dibagikan via Rifqy Quran Pro`;
    if (navigator.share) {
        navigator.share({ title: 'Rifqy Quran', text: text });
    } else {
        navigator.clipboard.writeText(text);
        alert("Ayat berhasil disalin ke clipboard!");
    }
}

// --- AUTO SCROLL ---
function toggleAutoScroll() {
    scrollSpeed++;
    if(scrollSpeed > 3) scrollSpeed = 0;
    
    clearInterval(autoScrollInterval);
    const btn = document.getElementById('btn-autoscroll-txt');
    
    if(scrollSpeed === 0) {
        btn.innerText = "Auto: Off";
    } else {
        btn.innerText = `Auto: ${scrollSpeed}x`;
        autoScrollInterval = setInterval(() => {
            window.scrollBy(0, scrollSpeed);
        }, 30);
    }
}

// --- GLOBAL SETTINGS ---
function openSettingsModal() { document.getElementById('modal-settings').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function changeQari() { prefs.qari = document.getElementById('qari-selector').value; savePrefs(); }

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
        // Rerender text to apply tajwid without resetting position
        currentSurah.ayat.forEach((a, i) => {
            document.querySelector(`#ayah-${i} .text-arab`).innerHTML = prefs.showTajwid ? applyTajwid(a.teksArab) : a.teksArab;
        });
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

function checkBookmark() {
    const card = document.getElementById('continue-reading-card');
    if(bookmark) {
        document.getElementById('cr-surah').innerText = bookmark.sName;
        document.getElementById('cr-ayah').innerText = `Ayat ${bookmark.aNo}`;
        card.classList.remove('hidden');
    } else { card.classList.add('hidden'); }
}
function continueReading() { if(bookmark) openSurah(bookmark.sNo, bookmark.aNo); }
