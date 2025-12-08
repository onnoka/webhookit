let codeReader = null;
let currentAlbumData = null;

// Initialize barcode scanner
async function startScanner() {
    const video = document.getElementById('video');
    const startBtn = document.getElementById('start-camera');
    const stopBtn = document.getElementById('stop-camera');

    try {
        codeReader = new ZXing.BrowserMultiFormatReader();

        const videoDevices = await codeReader.listVideoInputDevices();

        if (videoDevices.length === 0) {
            alert('No camera found!');
            return;
        }

        // Prefer back camera on mobile
        const backCamera = videoDevices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear')
        );

        const selectedDeviceId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId;

        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';

        codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
            if (result) {
                console.log('Barcode detected:', result.text);
                searchByBarcode(result.text);
                stopScanner();
            }
        });

    } catch (error) {
        console.error('Scanner error:', error);
        alert('Camera access denied or error: ' + error.message);
    }
}

function stopScanner() {
    if (codeReader) {
        codeReader.reset();
        codeReader = null;
    }

    document.getElementById('start-camera').style.display = 'inline-block';
    document.getElementById('stop-camera').style.display = 'none';
}

async function searchByBarcode(barcode) {
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');

    loading.style.display = 'block';
    result.style.display = 'none';

    try {
        const response = await fetch(`/api/vinyls/search/${barcode}`);
        const data = await response.json();

        loading.style.display = 'none';

        if (data.success && data.album) {
            currentAlbumData = data.album;
            displayAlbum(data.album);
        } else {
            alert('Album not found in Discogs database. Try another barcode or enter manually.');
        }
    } catch (error) {
        loading.style.display = 'none';
        alert('Error searching: ' + error.message);
    }
}

function displayAlbum(album) {
    document.getElementById('album-cover').src = album.coverUrl;
    document.getElementById('album-title').textContent = album.title;
    document.getElementById('album-artist').textContent = album.artist;
    document.getElementById('album-year').textContent = album.year;
    document.getElementById('album-label').textContent = album.label;
    document.getElementById('album-barcode').textContent = album.barcode;

    document.getElementById('result').style.display = 'block';

    // Scroll to result
    document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
}

async function addToCollection() {
    if (!currentAlbumData) return;

    // Get selected type from dropdown
    const selectedType = document.getElementById('vinyl-type').value;

    // Add type to album data
    const vinylData = {
        ...currentAlbumData,
        type: selectedType
    };

    try {
        const response = await PINAuth.protectedFetch('/api/vinyls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vinylData)
        });

        const data = await response.json();

        if (data.success) {
            // Show success feedback
            const btn = document.getElementById('add-to-collection');
            const originalText = btn.textContent;
            btn.textContent = '✓ Added!';
            btn.style.background = '#00ff00';

            // Reset after 1 second and prepare for next scan
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                scanAnother();
            }, 1000);
        } else {
            alert('Error adding to collection');
        }
    } catch (error) {
        if (error.message === 'Authentication cancelled') {
            // User cancelled PIN entry, do nothing
            return;
        }
        alert('Error: ' + error.message);
    }
}

function scanAnother() {
    document.getElementById('result').style.display = 'none';
    document.getElementById('manual-barcode').value = '';
    currentAlbumData = null;
}

// Event listeners
document.getElementById('start-camera').addEventListener('click', startScanner);
document.getElementById('stop-camera').addEventListener('click', stopScanner);

document.getElementById('manual-search').addEventListener('click', () => {
    const barcode = document.getElementById('manual-barcode').value.trim();
    if (barcode) {
        searchByBarcode(barcode);
    } else {
        alert('Please enter a barcode');
    }
});

document.getElementById('manual-barcode').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('manual-search').click();
    }
});

document.getElementById('add-to-collection').addEventListener('click', addToCollection);
document.getElementById('scan-another').addEventListener('click', scanAnother);
