/* ==============================================================
   PREMIUM.JS - FITUR AI, VISUAL ADVANCED, DAN TAHFIDZ RECORD
   ============================================================== */

// --- 1. TAHFIDZ RECORD (Merekam Suara User via MediaRecorder API) ---
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

async function toggleRecord(ayahIndex) {
    const btn = document.getElementById(`btn-record-${ayahIndex}`);
    const audioPlayback = document.getElementById(`audio-user-${ayahIndex}`);

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = event => { audioChunks.push(event.data); };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                audioPlayback.src = audioUrl;
                audioPlayback.classList.remove('hidden');
                audioChunks = []; 
            };

            mediaRecorder.start();
            isRecording = true;
            btn.classList.add('recording'); 
            alert("Mulai merekam... Silakan bacakan ayat ini.");
        } catch (err) { alert("Gagal mengakses mikrofon. Pastikan izin diberikan."); }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        btn.classList.remove('recording');
        alert("Rekaman selesai. Silakan putar di player bawah ayat.");
    }
}

// --- 2. MODE TAHFIDZ CERDAS (Blur Masking) ---
let tahfidzMode = false;
function toggleTahfidzMode() {
    tahfidzMode = !tahfidzMode;
    const btn = document.getElementById('btn-tahfidz');
    if (tahfidzMode) {
        document.body.classList.add('tahfidz-mode');
        btn.innerHTML = '<i class="fas fa-eye"></i> Buka';
        btn.classList.replace('btn-outline-primary', 'btn-primary');
        alert("Mode Hafalan: Teks Arab disamarkan. Sentuh/Hover teks untuk melihat.");
    } else {
        document.body.classList.remove('tahfidz-mode');
        btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hafalan';
        btn.classList.replace('btn-primary', 'btn-outline-primary');
    }
}

// --- 3. TAFSIR PER-AYAT (KEMENAG API) ---
async function openTafsirPerAyat(surahNo, ayahNo) {
    document.getElementById('tafsir-content').innerHTML = `<div class="text-center"><i class="fas fa-spinner fa-spin text-primary"></i> Mengambil Tafsir...</div>`;
    openModal('modal-tafsir');

    try {
        const res = await fetch(`https://equran.id/api/v2/tafsir/${surahNo}`);
        const data = await res.json();
        const tafsirTeks = data.data.tafsir.find(t => t.ayat === ayahNo).teks;

        document.getElementById('tafsir-content').innerHTML = `
            <h4 class="text-primary mb-2">Tafsir Kemenag (Ayat ${ayahNo})</h4>
            <p style="text-align: justify;">${tafsirTeks}</p>
        `;
    } catch(e) { document.getElementById('tafsir-content').innerHTML = `<p class="text-danger">Gagal memuat tafsir. Cek internet Anda.</p>`; }
}

// --- 4. ISLAMIC WALLPAPER CREATOR ---
function openWallpaperCreator(arab, indo, surahName, ayahNo) {
    document.getElementById('wp-arab').innerText = arab;
    document.getElementById('wp-indo').innerText = `"${indo}"`;
    document.getElementById('wp-source').innerText = `Q.S ${surahName} : ${ayahNo}`;
    openModal('modal-wallpaper');
}

// --- 5. POPUP KALENDER EVENT ---
function openEventPopup() {
    const d = new Date();
    document.getElementById('event-date-text').innerText = `${d.getDate()} Maret 2026 / 1447 H`;
    openModal('modal-event');
}

// --- 6. GANTI FONT PREMIUM ---
function changeFontFamily() {
    const font = document.getElementById('font-selector').value;
    document.querySelectorAll('.text-arab, .font-arab').forEach(el => { el.style.fontFamily = font; });
}
