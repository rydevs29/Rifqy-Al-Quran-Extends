/* ==============================================================
   PREMIUM.JS - TAFSIR KEMENAG, WAQAF GUIDE, DAN MEDIA SESSION
   ============================================================== */

window.showWaqafGuide = function(idx) {
    if(!window.currentSurah) return;
    const a = window.currentSurah.ayat[idx];
    let content = `
        <div class="text-center mb-3">
            <span class="ayah-badge" style="font-size:16px;">Ayat ke-${a.nomorAyat}</span>
        </div>
        <div class="bg-light p-3 border-radius mb-3">
            <p class="font-bold text-primary mb-2"><i class="fas fa-circle text-success small"></i> Hijau (Aman Berhenti):</p>
            <p>Berhentilah pada tanda waqaf <b>(م, ط, ج, قلى)</b>. Makna ayat sudah sempurna.</p>
        </div>
        <div class="bg-light p-3 border-radius mb-3">
            <p class="font-bold text-warning mb-2"><i class="fas fa-circle text-warning small"></i> Kuning (Boleh Lanjut/Berhenti):</p>
            <p>Tanda <b>(صلى, ز, ص)</b>. Boleh berhenti, tapi melanjutkan bacaan (washal) lebih utama.</p>
        </div>
        <div class="bg-light p-3 border-radius">
            <p class="font-bold text-danger mb-2"><i class="fas fa-circle text-danger small"></i> Merah (Dilarang Berhenti):</p>
            <p>Tanda <b>(لا)</b>. Jangan berhenti di sini karena akan merusak arti. Jika kehabisan napas, berhentilah, lalu <b>ulang kembali (Ibtida')</b> dari kata sebelumnya.</p>
        </div>
    `;
    document.getElementById('waqaf-content').innerHTML = content;
    window.openModal('modal-waqaf');
};

window.openTafsirPerAyat = async function(surahNo, ayahNo) {
    document.getElementById('tafsir-content').innerHTML = `<div class="text-center"><i class="fas fa-circle-notch fa-spin text-primary" style="font-size:30px;"></i><p class="mt-2">Mengambil Tafsir...</p></div>`;
    window.openModal('modal-tafsir');
    try {
        const res = await fetch(`https://equran.id/api/v2/tafsir/${surahNo}`); 
        const data = await res.json();
        const tafsirTeks = data.data.tafsir.find(t => t.ayat == ayahNo).teks;
        document.getElementById('tafsir-content').innerHTML = `<h4 class="text-primary mb-2 font-bold">Tafsir Kemenag (Ayat ${ayahNo})</h4><p style="text-align: justify; font-size:14px; line-height:1.7;">${tafsirTeks}</p>`;
    } catch(e) { document.getElementById('tafsir-content').innerHTML = `<p class="text-danger font-bold text-center">Gagal memuat tafsir. Periksa koneksi.</p>`; }
};

// --- MEDIA SESSION (NOTIFIKASI BACKGROUND PLAYER) ---
window.initMediaSession = function() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => { if(window.audioEngine) window.audioEngine.play(); });
        navigator.mediaSession.setActionHandler('pause', () => { if(window.audioEngine) window.audioEngine.pause(); });
        navigator.mediaSession.setActionHandler('previoustrack', () => { if(window.activeAyahIndex > 0) window.playAyah(window.activeAyahIndex - 1); });
        navigator.mediaSession.setActionHandler('nexttrack', () => { if(window.currentSurah && window.activeAyahIndex < window.currentSurah.ayat.length - 1) window.playAyah(window.activeAyahIndex + 1); });
    }
};

window.updateMediaSession = function(idx) {
    if ('mediaSession' in navigator && window.currentSurah) {
        const qariNames = { "01": "Mahmoud Khalil Al-Husary", "02": "Abdul Muhsir Al-Qasim", "03": "Abdurrahman As-Sudais", "04": "Ibrahim Al-Dawsari", "05": "Mishary Rashid Alafasy" };
        const artistName = qariNames[window.prefs.qari] || "Mishary Rashid Alafasy";
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: `Q.S ${window.currentSurah.namaLatin} : ${window.currentSurah.ayat[idx].nomorAyat}`,
            artist: artistName,
            album: 'Rifqy Al-Quran',
            artwork: [{ src: 'https://equran.id/favicon.png', sizes: '512x512', type: 'image/png' }]
        });
    }
};
