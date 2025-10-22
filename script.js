// AŞAMA 3.1: API Anahtarınızı Buraya Yerleştirin
const SAFE_BROWSING_API_KEY = "SİZİN_GOOGLE_API_ANAHTARINIZ"; 

// DOM Elementleri
const views = {
    home: document.getElementById('view-home'),
    scanner: document.getElementById('view-scanner'),
    result: document.getElementById('view-result'),
    premiumInfo: document.getElementById('view-premium-info') 
};
const navButtons = {
    home: document.getElementById('nav-home'),
    scan: document.getElementById('nav-scan'),
    premium: document.getElementById('nav-premium')
};
const gallerySelectBtn = document.getElementById('gallery-select'); 
const resultTextEl = document.getElementById('result-text');
const resultLinkEl = document.getElementById('result-link');
const openLinkBtn = document.getElementById('open-link-btn');
const flashToggle = document.getElementById('flash-toggle');
const cameraSwitch = document.getElementById('camera-switch');
const backToHome = document.getElementById('back-to-home');
const premiumModal = document.getElementById('premium-modal');
const modalCloseBtn = premiumModal.querySelector('.close-modal-btn');
const qrFrameLine = document.querySelector('.frame-line');
const backToPrevious = document.getElementById('back-to-previous'); 
const openPremiumModalBtn = document.getElementById('open-premium-modal'); 

// Global Değişkenler
let html5QrcodeScanner = null;
let scannedUrl = '';
let isScannerActive = false;
let isFlashOn = false;
let currentCamera = 'environment'; 
let previousView = 'home'; 

// AŞAMA 3.2: Ekran Yönetimi Fonksiyonu
function changeView(targetView) {
    if (views[targetView]) {
        if (targetView !== 'premiumInfo' && targetView !== 'result') {
            previousView = targetView;
        }

        for (const view in views) {
            views[view].classList.remove('active');
            if (view !== targetView) {
                views[view].classList.add('hidden');
            } else {
                views[view].classList.add('active');
            }
        }
    }
    
    // Tarayıcı Yönetimi
    if (targetView === 'scanner') {
        startScanner();
    } else {
        stopScanner();
    }
    
    // Navigasyon Butonlarını Aktif Yapma
    for (const btn in navButtons) {
        if (navButtons[btn]) {
            navButtons[btn].classList.remove('active');
        }
    }
    // Sadece aktif olan view'e karşılık gelen butonu aktif yap
    if (targetView === 'home' && navButtons.home) { 
        navButtons.home.classList.add('active');
    } else if (targetView === 'premiumInfo' && navButtons.premium) {
        navButtons.premium.classList.add('active');
    }
    
    // DÜZELTME: Geri dönüldüğünde butonları doğru renge ayarla
    if (targetView === 'home' && navButtons.home) navButtons.home.classList.add('active');
    if (targetView === 'premiumInfo' && navButtons.premium) navButtons.premium.classList.add('active');

}

// AŞAMA 3.3: QR Tarayıcı Fonksiyonları
function stopScanner() {
    if (html5QrcodeScanner && isScannerActive) {
        html5QrcodeScanner.stop().then(() => {
            isScannerActive = false;
            qrFrameLine.style.display = 'none';
        }).catch(err => {
            console.error("Tarayıcı durdurulamadı:", err);
            isScannerActive = false;
        });
    }
}

function startScanner() {
    if (isScannerActive) return;

    isScannerActive = true;
    
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5Qrcode("scanner-container");
    }

    qrFrameLine.style.display = 'block';
    
    const config = {
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        videoConstraints: { facingMode: currentCamera }
    };

    html5QrcodeScanner.start(
        config.videoConstraints, 
        config,
        onScanSuccess,
        (errorMessage) => { /* Hata mesajını görmezden gel */ }
    ).catch(err => {
        alert("Kamera izni reddedildi veya kamera bulunamadı: " + err);
        stopScanner();
        changeView('home');
    });
}


// AŞAMA 3.4: API Kontrolü Fonksiyonu (Gerçek API Yapısı)
async function checkSafety(url) {
    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFE_BROWSING_API_KEY}`;
    
    const requestBody = {
        client: {
            clientId: "safescan-app",
            clientVersion: "1.0.0"
        },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [
                { url: url }
            ]
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) return 'ERROR'; // API hatası

        const data = await response.json();
        
        // Eğer matches alanı varsa, tehdit bulundu demektir.
        if (data && data.matches && data.matches.length > 0) {
            return 'DANGER';
        } else {
            return 'SAFE';
        }

    } catch (error) {
        console.error("API Bağlantı Hatası:", error);
        return 'ERROR';
    }
}


// AŞAMA 3.5: Tarama Başarılı Olduğunda İş Akışı
async function onScanSuccess(decodedText) {
    stopScanner(); 
    
    scannedUrl = decodedText;
    
    changeView('result'); 

    resultLinkEl.textContent = scannedUrl;
    openLinkBtn.disabled = true;

    resultTextEl.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> Güvenlik Kontrolü Yapılıyor...`;
    
    const status = await checkSafety(scannedUrl);

    if (status === 'SAFE') {
        resultTextEl.innerHTML = `<span class="safe">✅ GÜVENLİ</span>: Bu bağlantı temiz görünüyor.`;
        openLinkBtn.disabled = false;
    } else if (status === 'DANGER') {
        resultTextEl.innerHTML = `<span class="danger">❌ TEHLİKE</span>: Kimlik avı veya zararlı yazılım riski bulundu!`;
        openLinkBtn.disabled = true;
    } else {
        resultTextEl.innerHTML = `⚠️ Kontrol Hatası! Güvenliği doğrulanamadı.`;
        openLinkBtn.disabled = false; 
    }
}


// AŞAMA 3.6: Olay Dinleyicileri
document.addEventListener('DOMContentLoaded', () => {
    // Navigasyon Butonları
    if (navButtons.home) navButtons.home.addEventListener('click', () => changeView('home'));
    if (navButtons.scan) navButtons.scan.addEventListener('click', () => changeView('scanner'));
    if (navButtons.premium) navButtons.premium.addEventListener('click', () => changeView('premiumInfo'));
    
    // Galeri Seçme (Simülasyon)
    if (gallerySelectBtn) {
        gallerySelectBtn.addEventListener('click', () => {
            alert("Galeri ekranı açıldı. (Burada Galeri API'si ile resim seçimi yapılır.)");
        });
    }

    // Premium Bilgilendirme Ekranı -> Modal
    if (openPremiumModalBtn) {
        openPremiumModalBtn.addEventListener('click', () => premiumModal.classList.remove('hidden'));
    }

    // Geri Butonları
    if (backToHome) backToHome.addEventListener('click', () => changeView('home'));
    if (backToPrevious) {
        backToPrevious.addEventListener('click', () => {
            changeView(previousView);
        });
    }
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => premiumModal.classList.add('hidden'));

    // Bağlantı Açma
    if (openLinkBtn) {
        openLinkBtn.addEventListener('click', () => {
            if (scannedUrl && !openLinkBtn.disabled) {
                window.open(scannedUrl, '_blank');
            }
        });
    }

    // FLAŞ ve KAMERA İŞLEVLERİ
    if (flashToggle) {
        flashToggle.addEventListener('click', () => {
            isFlashOn = !isFlashOn;
            flashToggle.classList.toggle('active', isFlashOn);
            if (html5QrcodeScanner) {
                 html5QrcodeScanner.setTorchEnabled(isFlashOn).catch(err => { /* Hata yönetimi */ });
            }
        });
    }
    
    if (cameraSwitch) {
        cameraSwitch.addEventListener('click', () => {
            currentCamera = (currentCamera === 'environment') ? 'user' : 'environment';
            
            isFlashOn = false;
            if(flashToggle) flashToggle.classList.remove('active');

            stopScanner();
            startScanner(); 
        });
    }
});