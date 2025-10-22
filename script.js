// AŞAMA 3.1: API Anahtarınızı Buraya Yerleştirin
const SAFE_BROWSING_API_KEY = "AIzaSyDnfWE8vtPjzQ-Tf6FrLAhLb2dRRka7dJU"; 

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
    if (targetView === 'home' && navButtons.home) { 
        navButtons.home.classList.add('active');
    } else if (targetView === 'premiumInfo' && navButtons.premium) {
        navButtons.premium.classList.add('active');
    }

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
        (errorMessage) => {}
    ).catch(err => {
        alert("Kamera izni reddedildi veya kamera bulunamadı: " + err);
        stopScanner();
        changeView('home');
    });
}

// AŞAMA 3.4: API Kontrolü Fonksiyonu (Simülasyonlu)
async function checkSafety(url) {
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    if (url.includes('malicious') || url.includes('virus') || url.includes('scam')) {
        return 'DANGER'; 
    }
    return 'SAFE';
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
    if (navButtons.home) navButtons.home.addEventListener('click', () => changeView('home'));
    if (navButtons.scan) navButtons.scan.addEventListener('click', () => changeView('scanner'));
    if (navButtons.premium) navButtons.premium.addEventListener('click', () => changeView('premiumInfo'));
    
    if (gallerySelectBtn) {
        gallerySelectBtn.addEventListener('click', () => {
            alert("Galeri ekranı açıldı. (Burada Galeri API'si ile resim seçimi yapılır.)");
        });
    }

    if (openPremiumModalBtn) {
        openPremiumModalBtn.addEventListener('click', () => premiumModal.classList.remove('hidden'));
    }

    if (backToHome) backToHome.addEventListener('click', () => changeView('home'));
    if (backToPrevious) {
        backToPrevious.addEventListener('click', () => {
            changeView(previousView);
        });
    }
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => premiumModal.classList.add('hidden'));

    if (openLinkBtn) {
        openLinkBtn.addEventListener('click', () => {
            if (scannedUrl && !openLinkBtn.disabled) {
                window.open(scannedUrl, '_blank');
            }
        });
    }

    if (flashToggle) {
        flashToggle.addEventListener('click', () => {
            isFlashOn = !isFlashOn;
            flashToggle.classList.toggle('active', isFlashOn);
            if (html5QrcodeScanner) {
                 html5QrcodeScanner.setTorchEnabled(isFlashOn).catch(err => {});
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
