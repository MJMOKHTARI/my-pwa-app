let data = []; // داده‌های فایل
let technicalNumberColumn = 'شماره فنی'; // نام ستون شماره فنی
let columnsToShow = ['محصول', 'سازنده', 'گواهی', 'ایمارک']; // ستون‌های برای نمایش

// خواندن و پارس فایل اکسل
function loadFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = data[0];
        data = data.slice(1).map(row => {
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });

        if (data.length > 0) {
            technicalNumberColumn = headers.find(h => h && (h.includes('شماره فنی') || h.includes('Technical Number'))) || headers[0];
            document.getElementById('result').innerHTML = '<p>فایل لود شد. آماده جستجو.</p>';
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
        } else {
            document.getElementById('result').innerHTML = '<p>فایل خالی است.</p>';
        }
    };
    reader.readAsArrayBuffer(file);
}

// مدیریت انتخاب فایل
document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        loadFile(file);
    }
});

// اسکن بارکد
document.getElementById('scanBtn').addEventListener('click', async () => {
    const scannerContainer = document.getElementById('scanner-container');
    scannerContainer.style.display = 'block';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = document.getElementById('scanner-video');
        video.srcObject = stream;
        video.play();

        const barcodeDetector = new BarcodeDetector({ formats: ['code_128', 'ean_13'] });
        const detect = async () => {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length > 0) {
                document.getElementById('searchInput').value = barcodes[0].rawValue;
                stream.getTracks().forEach(track => track.stop());
                video.srcObject = null;
                scannerContainer.style.display = 'none';
                searchData();
            } else {
                requestAnimationFrame(detect);
            }
        };
        detect();
    } catch (err) {
        document.getElementById('result').innerHTML = '<p>خطا: ' + err.message + '</p>';
        scannerContainer.style.display = 'none';
        console.log(err); // برای دیدن جزئیات خطا
    });

    Quagga.onDetected((result) => {
        document.getElementById('searchInput').value = result.codeResult.code.trim();
        Quagga.stop();
        scannerContainer.style.display = 'none';
        searchData();
    });
});

// OCR
document.getElementById('ocrBtn').addEventListener('click', () => {
    document.getElementById('ocrImageInput').click();
});

document.getElementById('ocrImageInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('result').innerHTML = '<p>در حال پردازش...</p>';
        const { data: { text } } = await Tesseract.recognize(file, 'eng');
        document.getElementById('searchInput').value = text.trim().replace(/\s+/g, '');
        searchData();
    }
});

// گفتار به متن
document.getElementById('speechBtn').addEventListener('click', () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'fa-IR';
    recognition.start();
    recognition.onresult = (event) => {
        document.getElementById('searchInput').value = event.results[0][0].transcript.trim();
        searchData();
    };
});

// جستجو
function searchData() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    const matches = data.filter(row => {
        const value = row[technicalNumberColumn];
        return value && value.toString().toLowerCase().includes(query);
    });

    if (matches.length > 0) {
        matches.forEach(match => {
            let output = '';
            columnsToShow.forEach(col => {
                output += `<p>${col}: ${match[col] || 'نامشخص'}</p>`;
            });
            resultDiv.innerHTML += output + '<hr>';
        });
    } else {
        resultDiv.innerHTML = '<p>هیچ نتیجه‌ای یافت نشد.</p>';
    }
}

document.getElementById('searchBtn').addEventListener('click', searchData);

