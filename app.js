/* ==============================================================
   APP.JS - CORE ENGINE DENGAN SINKRONISASI, 100 QUOTES, FULL SCREEN & AUTO-UPDATE
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

    // ========================================================================
    // LOGIKA FULL SCREEN MEMBACA (MENYEMBUNYIKAN TANGGAL, NAVIGASI, DLL)
    // ========================================================================
    const topHeader = document.querySelector('.top-header');
    const bottomNav = document.querySelector('.bottom-nav');
    const sidebar = document.querySelector('.sidebar');
    
    if (pageId === 'page-read') {
        if(topHeader) topHeader.style.display = 'none';
        if(bottomNav) bottomNav.style.display = 'none';
        if(sidebar) sidebar.style.display = 'none';
    } else {
        if(topHeader) topHeader.style.display = '';
        if(bottomNav) bottomNav.style.display = '';
        if(sidebar) sidebar.style.display = '';
    }

    if(pageId === 'page-home') { document.getElementById('nav-home-mob')?.classList.add('active'); document.getElementById('nav-home-desk')?.classList.add('active'); }
    if(pageId === 'page-bookmarks') { document.getElementById('nav-bm-mob')?.classList.add('active'); document.getElementById('nav-bm-desk')?.classList.add('active'); window.renderBookmarksPage(); }
    if(pageId === 'page-explore') { document.getElementById('nav-exp-mob')?.classList.add('active'); document.getElementById('nav-exp-desk')?.classList.add('active'); }
    if(pageId === 'page-settings') { document.getElementById('nav-set-mob')?.classList.add('active'); document.getElementById('nav-set-desk')?.classList.add('active'); }
    if(pageId !== 'page-read') { if(window.audioEngine) { window.audioEngine.pause(); window.audioEngine.ontimeupdate = null; } window.scrollSpeed = 0; clearInterval(window.autoScrollInterval); if(document.getElementById('btn-autoscroll-txt')) document.getElementById('btn-autoscroll-txt').innerText = "Off"; }
    window.scrollTo(0,0);
};

window.renderAyatHariIni = function() {
    const quotes = [
        {a: "لَا يُكَلِّفُ اللّٰهُ نَفْسًا إِلَّا وُسْعَهَا", i: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.", s: "Al-Baqarah : 286"},
        {a: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", i: "Maka sesungguhnya bersama kesulitan ada kemudahan.", s: "Al-Insyirah : 5"},
        {a: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ", i: "Berdoalah kepada-Ku, niscaya akan Kuperkenankan bagimu.", s: "Ghafir : 60"},
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
        {a: "وَاللّٰهُ غَفُورٌ رَحِيمٌ", i: "Dan Allah Maha Pengampun lagi Maha Penyayang.", s: "Al-Imran : 129"},
        {a: "إِنَّ اللّٰهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ", i: "Sesungguhnya Allah menyukai orang-orang yang bertobat dan menyukai orang-orang yang menyucikan diri.", s: "Al-Baqarah : 222"},
        {a: "وَأَحْسِنُوا إِنَّ اللّٰهَ يُحِبُّ الْمُحْسِنِينَ", i: "Dan berbuat baiklah, karena sesungguhnya Allah menyukai orang-orang yang berbuat baik.", s: "Al-Baqarah : 195"},
        {a: "وَلَا تَيْأَسُوا مِنْ رَوْحِ اللّٰهِ", i: "Dan janganlah kamu berputus asa dari rahmat Allah.", s: "Yusuf : 87"},
        {a: "وَاللّٰهُ خَيْرُ الرَّازِقِينَ", i: "Dan Allah adalah sebaik-baik pemberi rezeki.", s: "Al-Jumu'ah : 11"},
        {a: "إِنَّ رَحْمَتَ اللّٰهِ قَرِيبٌ مِنَ الْمُحْسِنِينَ", i: "Sesungguhnya rahmat Allah sangat dekat kepada orang-orang yang berbuat baik.", s: "Al-A'raf : 56"},
        {a: "وَاسْتَغْفِرُوا اللّٰهَ إِنَّ اللّٰهَ غَفُورٌ رَحِيمٌ", i: "Dan mohonlah ampunan kepada Allah. Sesungguhnya Allah Maha Pengampun lagi Maha Penyayang.", s: "Al-Muzzammil : 20"},
        {a: "وَسَارِعُوا إِلَى مَغْفِرَةٍ مِنْ رَبِّكُمْ", i: "Dan bersegeralah kamu mencari ampunan dari Tuhanmu.", s: "Ali 'Imran : 133"},
        {a: "وَاللّٰهُ بِمَا تَعْمَلُونَ خَبِيرٌ", i: "Dan Allah Maha Mengetahui apa yang kamu kerjakan.", s: "Al-Baqarah : 234"},
        {a: "فَسَبِّحْ بِحَمْدِ رَبِّكَ وَكُنْ مِنَ السَّاجِدِينَ", i: "Maka bertasbihlah dengan memuji Tuhanmu dan jadilah engkau di antara orang yang bersujud (shalat).", s: "Al-Hijr : 98"},
        {a: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا", i: "Ya Tuhan kami, janganlah Engkau condongkan hati kami kepada kesesatan setelah Engkau berikan petunjuk.", s: "Ali 'Imran : 8"},
        {a: "وَاللّٰهُ يَدْعُو إِلَى دَارِ السَّلَامِ", i: "Dan Allah menyeru (manusia) ke Darussalam (surga).", s: "Yunus : 25"},
        {a: "وَمَا تَسْقُطُ مِنْ وَرَقَةٍ إِلَّا يَعْلَمُهَا", i: "Dan tidak ada sehelai daun pun yang gugur yang tidak diketahui-Nya.", s: "Al-An'am : 59"},
        {a: "وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ", i: "Dan bertawakallah kepada Allah yang hidup (kekal) yang tidak mati.", s: "Al-Furqan : 58"},
        {a: "إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُمْ بِغَيْرِ حِسَابٍ", i: "Hanya orang-orang yang bersabarlah yang disempurnakan pahalanya tanpa batas.", s: "Az-Zumar : 10"},
        {a: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ", i: "Ya Tuhan kami, kami telah menzalimi diri kami sendiri. Jika Engkau tidak mengampuni kami, niscaya kami termasuk orang-orang yang rugi.", s: "Al-A'raf : 23"},
        {a: "وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ", i: "Dan apabila aku sakit, Dialah yang menyembuhkanku.", s: "Asy-Syu'ara : 80"},
        {a: "لَا يُكَلِّفُ اللّٰهُ نَفْسًا إِلَّا مَا آتَاهَا", i: "Allah tidak membebani seseorang melainkan (sesuai) dengan apa yang diberikan Allah kepadanya.", s: "At-Talaq : 7"},
        {a: "وَقُلْ رَبِّ زِدْنِي عِلْمًا", i: "Dan katakanlah: Ya Tuhanku, tambahkanlah kepadaku ilmu.", s: "Taha : 114"},
        {a: "فَاصْبِرْ صَبْرًا جَمِيلًا", i: "Maka bersabarlah dengan kesabaran yang baik.", s: "Al-Ma'arij : 5"},
        {a: "وَاللّٰهُ غَالِبٌ عَلَى أَمْرِهِ", i: "Dan Allah berkuasa terhadap urusan-Nya.", s: "Yusuf : 21"},
        {a: "إِنَّ اللّٰهَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", i: "Sesungguhnya Allah Maha Kuasa atas segala sesuatu.", s: "Al-Baqarah : 20"},
        {a: "وَمَنْ يَتَّقِ اللّٰهَ يَجْعَلْ لَهُ مَخْرَجًا", i: "Barangsiapa bertakwa kepada Allah niscaya Dia akan mengadakan baginya jalan keluar.", s: "At-Talaq : 2"},
        {a: "سَيَجْعَلُ اللّٰهُ بَعْدَ عُسْرٍ يُسْرًا", i: "Allah kelak akan memberikan kemudahan sesudah kesulitan.", s: "At-Talaq : 7"},
        {a: "وَأَنَّ سَعْيَهُ سَوْفَ يُرَى", i: "Dan bahwa usahanya itu kelak akan diperlihatkan (kepadanya).", s: "An-Najm : 40"},
        {a: "ادْفَعْ بِالَّتِي هِيَ أَحْسَنُ", i: "Tolaklah (kejahatan itu) dengan cara yang lebih baik.", s: "Fussilat : 34"},
        {a: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ", i: "Dan dirikanlah shalat dan tunaikanlah zakat.", s: "Al-Baqarah : 43"},
        {a: "فَلَا تَغُرَّنَّكُمُ الْحَيَاةُ الدُّنْيَا", i: "Maka janganlah sekali-kali kehidupan dunia memperdayakan kamu.", s: "Luqman : 33"},
        {a: "وَاللّٰهُ يَرْزُقُ مَنْ يَشَاءُ بِغَيْرِ حِسَابٍ", i: "Dan Allah memberi rezeki kepada orang-orang yang dikehendaki-Nya tanpa batas.", s: "Al-Baqarah : 212"},
        {a: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ", i: "Ya Tuhan kami, anugerahkanlah kepada kami pasangan dan keturunan sebagai penyenang hati.", s: "Al-Furqan : 74"},
        {a: "قُلْ يَاعِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللّٰهِ", i: "Katakanlah: Hai hamba-hamba-Ku yang melampaui batas, janganlah kamu berputus asa dari rahmat Allah.", s: "Az-Zumar : 53"},
        {a: "كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ", i: "Tiap-tiap yang berjiwa akan merasakan mati.", s: "Ali 'Imran : 185"},
        {a: "وَلَا تَمْشِ فِي الْأَرْضِ مَرَحًا", i: "Dan janganlah kamu berjalan di muka bumi ini dengan sombong.", s: "Al-Isra : 37"},
        {a: "إِنَّ أَكْرَمَكُمْ عِنْدَ اللّٰهِ أَتْقَاكُمْ", i: "Sesungguhnya orang yang paling mulia di antara kamu di sisi Allah ialah orang yang paling bertakwa.", s: "Al-Hujurat : 13"},
        {a: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى", i: "Dan tolong-menolonglah kamu dalam (mengerjakan) kebajikan dan takwa.", s: "Al-Ma'idah : 2"},
        {a: "وَإِذَا حُيِّيتُمْ بِتَحِيَّةٍ فَحَيُّوا بِأَحْسَنَ مِنْهَا", i: "Apabila kamu dihormati dengan suatu penghormatan, maka balaslah dengan yang lebih baik.", s: "An-Nisa : 86"},
        {a: "إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ", i: "Orang-orang beriman itu sesungguhnya bersaudara.", s: "Al-Hujurat : 10"},
        {a: "وَقُلِ الْحَقُّ مِنْ رَبِّكُمْ", i: "Dan katakanlah: Kebenaran itu datangnya dari Tuhanmu.", s: "Al-Kahf : 29"},
        {a: "فَمَنْ شَاءَ فَلْيُؤْمِنْ وَمَنْ شَاءَ فَلْيَكْفُرْ", i: "Maka barangsiapa yang ingin (beriman) hendaklah ia beriman, dan barangsiapa yang ingin (kafir) biarlah ia kafir.", s: "Al-Kahf : 29"},
        {a: "يُرِيدُ اللّٰهُ بِكُمُ الْيُسْرَ وَلَا يُرِيدُ بِكُمُ الْعُسْرَ", i: "Allah menghendaki kemudahan bagimu, dan tidak menghendaki kesukaran bagimu.", s: "Al-Baqarah : 185"},
        {a: "وَاذْكُرْ رَبَّكَ كَثِيرًا", i: "Dan sebutlah (nama) Tuhanmu sebanyak-banyaknya.", s: "Ali 'Imran : 41"},
        {a: "إِنَّ اللّٰهَ مَعَ الَّذِينَ اتَّقَوْا وَالَّذِينَ هُمْ مُحْسِنُونَ", i: "Sesungguhnya Allah beserta orang-orang yang bertakwa dan orang-orang yang berbuat kebaikan.", s: "An-Nahl : 128"},
        {a: "مَنْ عَمِلَ صَالِحًا مِنْ ذَكَرٍ أَوْ أُنْثَى وَهُوَ مُؤْمِنٌ فَلَنُحْيِيَنَّهُ حَيَاةً طَيِّبَةً", i: "Barangsiapa yang mengerjakan amal saleh, baik laki-laki maupun perempuan dalam keadaan beriman, maka sesungguhnya akan Kami berikan kepadanya kehidupan yang baik.", s: "An-Nahl : 97"},
        {a: "وَأَنْ لَيْسَ لِلْإِنْسَانِ إِلَّا مَا سَعَى", i: "Dan bahwasanya seorang manusia tiada memperoleh selain apa yang telah diusahakannya.", s: "An-Najm : 39"},
        {a: "سَلَامٌ قَوْلًا مِنْ رَبٍّ رَحِيمٍ", i: "(Kepada mereka dikatakan): 'Salam', sebagai ucapan selamat dari Tuhan Yang Maha Penyayang.", s: "Ya Sin : 58"},
        {a: "إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ", i: "Sesungguhnya Al Quran ini memberikan petunjuk kepada (jalan) yang lebih lurus.", s: "Al-Isra : 9"},
        {a: "أَلَيْسَ اللّٰهُ بِكَافٍ عَبْدَهُ", i: "Bukankah Allah cukup untuk melindungi hamba-Nya.", s: "Az-Zumar : 36"},
        {a: "قُلْ إِنَّ الْأَمْرَ كُلَّهُ لِلّٰهِ", i: "Katakanlah: Sesungguhnya urusan itu seluruhnya di tangan Allah.", s: "Ali 'Imran : 154"},
        {a: "وَاللّٰهُ وَلِيُّ الْمُؤْمِنِينَ", i: "Dan Allah adalah Pelindung orang-orang yang beriman.", s: "Ali 'Imran : 68"},
        {a: "وَكَفَى بِاللّٰهِ وَكِيلًا", i: "Dan cukuplah Allah sebagai Pemelihara.", s: "Al-Ahzab : 3"},
        {a: "وَمَا الْحَيَاةُ الدُّنْيَا إِلَّا مَتَاعُ الْغُرُورِ", i: "Kehidupan dunia itu tidak lain hanyalah kesenangan yang memperdayakan.", s: "Ali 'Imran : 185"},
        {a: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", i: "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya.", s: "HR. Bukhari"},
        {a: "الدِّيْنُ النَّصِيْحَةُ", i: "Agama adalah nasihat.", s: "HR. Muslim"},
        {a: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ", i: "Sesungguhnya amal itu tergantung niatnya.", s: "HR. Bukhari"},
        {a: "مَنْ صَمَتَ نَجَا", i: "Barangsiapa yang diam, maka ia selamat.", s: "HR. Tirmidzi"},
        {a: "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ", i: "Perkataan yang baik adalah sedekah.", s: "HR. Bukhari"},
        {a: "لَا تَقْضَبْ وَلَكَ الْجَنَّةُ", i: "Janganlah marah, maka bagimu surga.", s: "HR. Thabrani"},
        {a: "اِتَّقِ اللَّهَ حَيْثُمَا كُنْتَ", i: "Bertakwalah kepada Allah di mana pun engkau berada.", s: "HR. Tirmidzi"},
        {a: "مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ", i: "Barangsiapa menunjukkan suatu kebaikan, maka baginya pahala seperti orang yang melakukannya.", s: "HR. Muslim"},
        {a: "يَسِّرُوا وَلَا تُعَسِّرُوا", i: "Mudahkanlah dan jangan dipersulit.", s: "HR. Bukhari"},
        {a: "أَحَبُّ النَّاسِ إِلَى اللَّهِ أَنْفَعُهُمْ لِلنَّاسِ", i: "Manusia yang paling dicintai Allah adalah yang paling bermanfaat bagi manusia lainnya.", s: "HR. Thabrani"},
        {a: "الصَّبْرُ ضِيَاءٌ", i: "Kesabaran adalah cahaya.", s: "HR. Muslim"},
        {a: "الطُّهُورُ شَطْرُ الْإِيمَانِ", i: "Kebersihan itu sebagian dari iman.", s: "HR. Muslim"},
        {a: "لَا يَرْحَمُ اللَّهُ مَنْ لَا يَرْحَمُ النَّاسَ", i: "Allah tidak menyayangi orang yang tidak menyayangi manusia.", s: "HR. Bukhari"},
        {a: "إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ", i: "Sesungguhnya Allah itu Maha Indah dan mencintai keindahan.", s: "HR. Muslim"},
        {a: "الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ", i: "Dunia adalah penjara bagi orang mukmin dan surga bagi orang kafir.", s: "HR. Muslim"},
        {a: "مَنْ غَشَّنَا فَلَيْسَ مِنَّا", i: "Barangsiapa yang menipu kami, maka ia bukan dari golongan kami.", s: "HR. Muslim"},
        {a: "الْحَيَاءُ شُعْبَةٌ مِنَ الْإِيمَانِ", i: "Malu itu adalah sebagian dari cabang iman.", s: "HR. Bukhari"},
        {a: "كُلُّ مَعْرُوفٍ صَدَقَةٌ", i: "Setiap kebaikan adalah sedekah.", s: "HR. Bukhari"},
        {a: "أَفْضَلُ الذِّكْرِ لَا إِلَهَ إِلَّا اللَّهُ", i: "Sebaik-baik dzikir adalah Laa ilaaha illallah.", s: "HR. Tirmidzi"},
        {a: "رِضَا الرَّبِّ فِي رِضَا الْوَالِدِ", i: "Ridha Allah terletak pada ridha kedua orang tua.", s: "HR. Tirmidzi"},
        {a: "الْمَرْءُ مَعَ مَنْ أَحَبَّ", i: "Seseorang itu akan dikumpulkan bersama orang yang dicintainya.", s: "HR. Bukhari"},
        {a: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ", i: "Seorang muslim adalah yang membuat muslim lainnya aman dari lisan dan tangannya.", s: "HR. Bukhari"},
        {a: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ", i: "Tidak sempurna iman seseorang di antara kalian hingga ia mencintai untuk saudaranya apa yang ia cintai untuk dirinya sendiri.", s: "HR. Bukhari"},
        {a: "كُلُّكُمْ رَاعٍ وَكُلُّكُمْ مَسْئُولٌ عَنْ رَعِيَّتِهِ", i: "Setiap kalian adalah pemimpin dan setiap kalian akan dimintai pertanggungjawaban atas kepemimpinannya.", s: "HR. Bukhari"},
        {a: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ", i: "Senyummu di hadapan saudaramu adalah sedekah bagimu.", s: "HR. Tirmidzi"},
        {a: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ", i: "Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam.", s: "HR. Bukhari"},
        {a: "إِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ", i: "Sesungguhnya kejujuran itu membawa kepada kebaikan.", s: "HR. Bukhari"},
        {a: "عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ", i: "Sungguh menakjubkan urusan orang mukmin, sesungguhnya semua urusannya adalah baik baginya.", s: "HR. Muslim"},
        {a: "الدُّعَاءُ مُخُّ الْعِبَادَةِ", i: "Doa itu adalah inti dari ibadah.", s: "HR. Tirmidzi"},
        {a: "بَلِّغُوا عَنِّي وَلَوْ آيَةً", i: "Sampaikanlah dariku walau hanya satu ayat.", s: "HR. Bukhari"}
    ];
    const pick = quotes[Math.floor(Math.random() * quotes.length)];
    if(document.getElementById('aotd-arab')) { document.getElementById('aotd-arab').innerText = pick.a; document.getElementById('aotd-indo').innerText = `"${pick.i}"`; document.getElementById('aotd-surah').innerText = pick.s; }
};

// =======================================================================
// FIX ERROR ONLINE: SISTEM AUTO-RETRY JIKA quran_data.js LELET DI VERCEL
// =======================================================================
window.fetchSurahs = function(retryCount = 0) {
    const list = document.getElementById('surah-list'); if(!list) return;
    try { 
        if (window.OFFLINE_QURAN) {
            window.allSurahs = window.OFFLINE_QURAN.surahs; 
            window.renderSurahs(window.allSurahs); 
        } else {
            if(retryCount < 5) {
                // Tampilkan loading berputar dan coba lagi tiap 1 detik (Maksimal 5 detik)
                list.innerHTML = `<div class="text-center w-100 mt-4"><i class="fas fa-circle-notch fa-spin text-primary" style="font-size: 30px;"></i><p class="mt-2 text-muted">Memuat data dari server... (${retryCount + 1}/5)</p></div>`;
                setTimeout(() => window.fetchSurahs(retryCount + 1), 1000);
            } else {
                // Jika sudah 5 detik tapi masih error, berikan peringatan untuk upload file
                list.innerHTML = `<div class="text-center mt-3"><p class="text-danger font-bold">Gagal memuat quran_data.js!</p><p class="small text-muted">Pastikan kamu sudah meng-upload file <b>quran_data.js</b> ke Vercel/GitHub.</p></div>`;
            }
        }
    } 
    catch (e) { list.innerHTML = `<p class="text-center text-danger font-bold mt-3">Terjadi kesalahan sistem.</p>`; }
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

window.checkDirectLink = function() {
    const p = new URLSearchParams(window.location.search); const surahP = p.get('surah'); const ayahP = p.get('ayah');
    if(surahP) { window.openSurah(parseInt(surahP), ayahP ? parseInt(ayahP) : 1); window.history.replaceState({}, document.title, window.location.pathname); }
};

window.openSurah = function(nomor, targetAyah = 1) {
    window.switchPage('page-read'); document.getElementById('ayah-list').innerHTML = `<div class="text-center mt-5"><i class="fas fa-circle-notch fa-spin text-primary" style="font-size:40px;"></i></div>`;
    try {
        if(!window.OFFLINE_QURAN) throw new Error("Data Offline kosong");
        
        window.currentSurah = window.OFFLINE_QURAN.surahs.find(s => s.nomor == nomor);
        if(!window.currentSurah) throw new Error("Surat tidak ditemukan");
        
        document.getElementById('read-surah-name').innerHTML = window.currentSurah.namaLatin;
        const jumpInput = document.getElementById('input-jump-ayah'); if(jumpInput) jumpInput.max = window.currentSurah.jumlahAyat;

        // Deteksi apakah Offline untuk hapus tombol play
        const isOfflineApp = window.location.protocol === 'file:';

        let html = window.currentSurah.nomor !== 9 && window.currentSurah.nomor !== 1 ? `<div class="text-arab text-primary text-center font-arab" style="font-size:${window.prefs.arabSize}px;">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>` : '';
        html += window.currentSurah.ayat.map((a, i) => {
            const isMarked = window.bookmarksArr.some(b => b.sNo === window.currentSurah.nomor && b.aNo === a.nomorAyat);
            let textArabTampil = a.teksArab.split(' ').map((word) => `<span class="q-word">${word}</span>`).join(' ');
            if(window.prefs.showTajwid && window.applyTajwid) textArabTampil = window.applyTajwid(textArabTampil);
            if(window.prefs.showWaqaf && window.applyWaqaf) textArabTampil = window.applyWaqaf(textArabTampil);

            // JIKA OFFLINE, TOMBOL PLAY DIHILANGKAN
            let btnPlayHtml = isOfflineApp ? "" : `<button class="btn-ayah-action" onclick="window.playAyah(${i})"><i class="fas fa-play" id="icon-play-${i}"></i></button>`;

            return `
            <div class="ayah-item" id="ayah-${i}">
                <div class="ayah-toolbar">
                    <span class="ayah-badge">${window.currentSurah.nomor}:${a.nomorAyat}</span>
                    <div class="ayah-actions">
                        ${btnPlayHtml}
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
    } catch(e) { alert("Gagal memuat surat. " + e.message); window.switchPage('page-home'); }
};

window.executeJumpAyah = function() {
    const val = parseInt(document.getElementById('input-jump-ayah').value);
    if(!val || !window.currentSurah) return;
    if(val > 0 && val <= window.currentSurah.jumlahAyat) {
        window.closeModal('modal-jump');
        setTimeout(() => { const el = document.getElementById(`ayah-${val - 1}`); if(el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.border = "2px solid var(--primary-color)"; setTimeout(()=> { el.style.border = "1px solid var(--border-color)"; }, 2000); } }, 300);
    } else { alert("Nomor ayat tidak valid."); }
};

window.getAudioUrl = function(surahNo, ayahNo, qariId, defaultAudioObj) {
    if (parseInt(qariId) <= 5 && qariId !== "04") return defaultAudioObj[qariId] || defaultAudioObj["05"];
    const everyayahMap = { "06": "Yasser_Ad-Dussary_128kbps", "07": "Saad_Al_Ghamdi_128kbps", "08": "MaherAlMuaiqly128kbps", "09": "Abdullah_Matroud_128kbps", "04": "Ibrahim_Akhdar_32kbps" };
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
        window.audioEngine.onerror = function() { alert("Gagal memuat audio. Pastikan internet Anda aktif."); icon.className = 'fas fa-play'; };
        
        window.audioEngine.play(); window.activeAyahIndex = idx; icon.className = 'fas fa-pause';
        if(window.updateMediaSession) window.updateMediaSession(idx);
        
        const card = document.getElementById(`ayah-${idx}`);
        if(card) { card.classList.add('playing'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        
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
    window.syncStorage.setItem('rBookmarksArr', JSON.stringify(window.bookmarksArr));
    
    let rawProg = window.syncStorage.getItem('surahProgress');
    let progData = rawProg ? JSON.parse(rawProg) : {}; 
    progData[sNo] = Math.round((aNo / totalAyah) * 100); 
    window.syncStorage.setItem('surahProgress', JSON.stringify(progData));
    
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

window.hapusBookmark = function(idx) { window.bookmarksArr.splice(idx, 1); window.syncStorage.setItem('rBookmarksArr', JSON.stringify(window.bookmarksArr)); window.renderBookmarksPage(); window.checkBookmark(); };
window.checkBookmark = function() { const card = document.getElementById('continue-reading-card'); if(!card) return; if(window.bookmarksArr.length > 0) { const last = window.bookmarksArr[0]; document.getElementById('cr-surah').innerText = last.sName; document.getElementById('cr-ayah').innerText = `Ayat No: ${last.aNo}`; card.classList.remove('hidden'); } else card.classList.add('hidden'); };
window.continueReading = function() { if(window.bookmarksArr.length > 0) window.openSurah(window.bookmarksArr[0].sNo, window.bookmarksArr[0].aNo); };

window.shareAyah = function(idx) {
    if(!window.currentSurah) return; const a = window.currentSurah.ayat[idx];
    const link = `${window.location.origin}${window.location.pathname}?surah=${window.currentSurah.nomor}&ayah=${a.nomorAyat}`;
    const textToShare = `Q.S ${window.currentSurah.namaLatin} Ayat ${a.nomorAyat}:\n\n${a.teksArab}\n\n"${a.teksIndonesia}"\n\nBaca selengkapnya di: ${link}`;
    if (navigator.share) navigator.share({ title: 'Rifqy Quran', text: textToShare }); else { navigator.clipboard.writeText(textToShare); alert("Teks & Link disalin!"); }
};

window.changePrayerMethod = function() { window.prefs.prayerMethod = document.getElementById('prayer-method-selector')?.value || "auto"; window.savePrefs(); if(window.getLocationAndPrayerTimes) window.getLocationAndPrayerTimes(); };
window.changeQari = function() { window.prefs.qari = document.getElementById('read-qari-selector')?.value || "05"; window.savePrefs(); window.loadPrefsUI(); if(window.currentSurah && window.activeAyahIndex >= 0 && window.audioEngine && !window.audioEngine.paused) { window.audioEngine.src = window.getAudioUrl(window.currentSurah.nomor, window.currentSurah.ayat[window.activeAyahIndex].nomorAyat, window.prefs.qari, window.currentSurah.ayat[window.activeAyahIndex].audio); window.audioEngine.play(); } };
window.changeSpeed = function() { window.prefs.audioSpeed = document.getElementById('audio-speed-selector')?.value || 1.0; window.savePrefs(); if(window.audioEngine) window.audioEngine.playbackRate = parseFloat(window.prefs.audioSpeed); };
window.setSleepTimer = function() {
    window.prefs.sleepTimer = parseInt(document.getElementById('sleep-timer-selector')?.value || 0); window.savePrefs(); clearTimeout(window.sleepTimeout);
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
        if(document.getElementById('toggle-latin-read')) window.prefs.showLatin = document.getElementById('toggle-latin-read').checked;
        if(document.getElementById('toggle-trans-read')) window.prefs.showTrans = document.getElementById('toggle-trans-read').checked;
        if(document.getElementById('toggle-tajwid-read')) window.prefs.showTajwid = document.getElementById('toggle-tajwid-read').checked;
        if(document.getElementById('toggle-waqaf-read')) window.prefs.showWaqaf = document.getElementById('toggle-waqaf-read').checked;
        if(document.getElementById('toggle-autoplay-read')) window.prefs.autoplay = document.getElementById('toggle-autoplay-read').checked;
        if(document.getElementById('toggle-highlight-read')) window.prefs.autoHighlight = document.getElementById('toggle-highlight-read').checked;
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
window.savePrefs = function() { window.syncStorage.setItem('rPrefs', JSON.stringify(window.prefs)); };

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

window.resetTracker = function() { if(confirm("Yakin ingin mereset semua checklist ibadah hari ini?")) { window.trackerData = { Subuh:false, Dzuhur:false, Ashar:false, Maghrib:false, Isya:false, Puasa:false, Tarawih:false }; window.syncStorage.setItem('rTracker', JSON.stringify(window.trackerData)); window.initTracker(); alert("Tracker ibadah berhasil direset!"); } };
window.clearBookmarks = function() { if(confirm("Yakin ingin MENGHAPUS SEMUA ayat yang tersimpan?")) { window.bookmarksArr = []; window.syncStorage.setItem('rBookmarksArr', JSON.stringify(window.bookmarksArr)); window.renderBookmarksPage(); window.checkBookmark(); alert("Semua ayat tersimpan dihapus!"); } };

window.getLocationAndPrayerTimes = function() {
    const container = document.getElementById('prayer-times'); if(!container) return;
    const fallback = () => { const loc = document.getElementById('location-text'); if(loc) loc.innerHTML = `<i class="fas fa-map-marker-alt"></i> Default (Jakarta)`; container.innerHTML = `<div style="grid-column: span 5; display: flex; justify-content: space-between; text-align: center; width: 100%;"><div class="bg-light p-1 border-radius"><small>Subuh</small><br><strong>04:30</strong></div><div class="bg-light p-1 border-radius"><small>Dzuhur</small><br><strong>12:00</strong></div><div class="bg-light p-1 border-radius"><small>Ashar</small><br><strong>15:15</strong></div><div class="bg-primary text-white p-1 border-radius"><small>Maghrib</small><br><strong>18:00</strong></div><div class="bg-light p-1 border-radius"><small>Isya</small><br><strong>19:15</strong></div></div>`; };
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const lat = pos.coords.latitude; const lng = pos.coords.longitude;
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`); const geoData = await geoRes.json();
                const locText = document.getElementById('location-text'); if(locText) locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${geoData.address.city || geoData.address.town || geoData.address.state || "Lokasi Anda"}`;
                
                const d = new Date(); const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
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

// ==============================================================
// SISTEM AUTO-UPDATE CHECKER VIA BLOGGER RIFQYDEV (VERSI 1)
// ==============================================================
const CURRENT_APP_VERSION = 1; 

window.checkUpdateApp = async function() {
    if (!navigator.onLine) return; // Hanya cek saat online

    try {
        const response = await fetch('https://www.rifqydev.my.id/2026/03/rifqyalquran.html');
        const htmlText = await response.text();
        
        const match = htmlText.match(/<div id="rifqy-update-data"[^>]*>([\s\S]*?)<\/div>/);
        
        if (match && match[1]) {
            const serverData = JSON.parse(match[1].trim());
            if (serverData.versionCode > CURRENT_APP_VERSION) {
                window.tampilkanModalUpdate(serverData);
            }
        }
    } catch (e) {
        console.warn("Update check skipped.");
    }
};

window.tampilkanModalUpdate = function(data) {
    const updateModalHtml = `
        <div id="modal-update-sultan" class="modal-overlay" style="display:flex; z-index: 10000; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);">
            <div class="modal-box text-center" style="border: 2px solid var(--primary-color);">
                <div class="icon-circle-light mb-3" style="width: 60px; height: 60px; margin: 0 auto; font-size: 24px; background: var(--primary-color); color: white;">
                    <i class="fas fa-rocket"></i>
                </div>
                <h3 class="font-bold text-primary mb-2">Versi Baru Tersedia!</h3>
                <p class="small text-muted mb-4" style="line-height: 1.6;">${data.log}</p>
                <button class="btn-primary w-100 font-bold p-3 mb-2" onclick="window.open('${data.apkUrl}', '_blank')">
                    <i class="fas fa-download"></i> Update Sekarang
                </button>
                <button class="btn-outline-primary w-100 small" onclick="document.getElementById('modal-update-sultan').remove()">
                    Nanti Saja
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', updateModalHtml);
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.checkUpdateApp, 5000);
});
