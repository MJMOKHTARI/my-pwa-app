let data = []; // داده‌های اکسل
let technicalNumberColumn = 'شماره فنی'; // نام ستون شماره فنی

// خواندن و پارس فایل اکسل
function loadExcel(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0]; // اولین شیت
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // تبدیل داده‌ها به فرمت مشابه CSV
        const headers = data[0]; // اولین ردیف به عنوان هدر
        data = data.slice(1).map(row => {
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });

        console.log('داده‌های اکسل:', data);
        // بررسی نام ستون‌های اکسل
        if (data.length > 0) {
            const headersList = headers;
            console.log('ستون‌های اکسل:', headersList);
            technicalNumberColumn = headersList.find(h => h && (h.includes('شماره فنی') || h.includes('Technical Number') || h.includes('technical_number'))) || headersList[0];
            document.getElementById('result').innerHTML = `<p>فایل اکسل لود شد. ستون‌های یافت‌شده: ${headersList.join(', ')}</p>`;
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
        } else {
            document.getElementById('result').innerHTML = '<p>فایل اکسل خالی است یا داده‌ای ندارد.</p>';
        }
    };
    reader.onerror = (error) => {
        console.error('خطا در خواندن اکسل:', error);
        document.getElementById('result').innerHTML = '<p>خطا در خواندن فایل اکسل.</p>';
    };
    reader.readAsArrayBuffer(file);
}

// مدیریت انتخاب فایل اکسل
document.getElementById('excelFileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel')) {
        loadExcel(file);
    } else {
        document.getElementById('result').innerHTML = '<p>لطفاً یک فایل اکسل معتبر (.xlsx یا .xls) انتخاب کنید.</p>';
    }
});

// اسکن بارکد با QuaggaJS
document.getElementById('scanBtn').addEventListener('click', () => {
    const scannerContainer = document.getElementById('scanner-container');
    scannerContainer.style.display = 'block';

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner-video'),
            constraints: { facingMode: "environment" }
        },
        decoder: { readers: ["code_128_reader", "ean_reader"] }
    }, (err) => {
        if (err) {
            console.error('خطا در اسکن:', err);
            document.getElementById('result').innerHTML = '<p>خطا در دسترسی به دوربین.</p>';
            scannerContainer.style.display = 'none';
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected((result) => {
        const code = result.codeResult.code.trim();
        console.log('بارکد تشخیص داده شد:', code);
        document.getElementById('searchInput').value = code;
        Quagga.stop();
        scannerContainer.style.display = 'none';
        searchData();
    });
});

// OCR با Tesseract.js
document.getElementById('ocrBtn').addEventListener('click', () => {
    document.getElementById('ocrImageInput').click();
});

document.getElementById('ocrImageInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        document.getElementById('result').innerHTML = '<p>در حال پردازش تصویر...</p>';
        try {
            const { data: { text } } = await Tesseract.recognize(file, 'eng', {
                logger: (m) => console.log(m)
            });
            const cleanedText = text.trim().replace(/\s+/g, '');
            console.log('متن OCR:', cleanedText);
            document.getElementById('searchInput').value = cleanedText;
            searchData();
        } catch (error) {
            console.error('خطا در OCR:', error);
            document.getElementById('result').innerHTML = '<p>خطا در تشخیص متن.</p>';
        }
    } else {
        document.getElementById('result').innerHTML = '<p>لطفاً یک تصویر معتبر انتخاب کنید.</p>';
    }
});

// گفتار به متن با Web Speech API
document.getElementById('speechBtn').addEventListener('click', () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        document.getElementById('result').innerHTML = '<p>مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند.</p>';
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fa-IR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript.trim();
        console.log('گفتار تشخیص داده شد:', speechResult);
        document.getElementById('searchInput').value = speechResult;
        searchData();
    };

    recognition.onerror = (event) => {
        console.error('خطا در تشخیص گفتار:', event.error);
        document.getElementById('result').innerHTML = '<p>خطا در تشخیص گفتار.</p>';
    };
});

// جستجو در داده‌ها
function searchData() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    if (!query) {
        resultDiv.innerHTML = '<p>لطفاً یک شماره فنی وارد کنید.</p>';
        return;
    }

    console.log('جستجو برای:', query);
    const matches = data.filter(row => {
        const value = row[technicalNumberColumn];
        return value && value.toString().toLowerCase().includes(query);
    });

    if (matches.length > 0) {
        matches.forEach(match => {
            resultDiv.innerHTML += `
                <p>محصول: ${match['محصول'] || 'نامشخص'}</p>
                <p>سازنده: ${match['سازنده'] || 'نامشخص'}</p>
                <p>گواهی: ${match['گواهی'] || 'نامشخص'}</p>
                <p>ایمارک: ${match['ایمارک'] || 'نامشخص'}</p>
                <hr>
            `;
        });
    } else {
        resultDiv.innerHTML = '<p>هیچ نتیجه‌ای برای "' + query + '" یافت نشد.</p>';
    }
}

document.getElementById('searchBtn').addEventListener('click', searchData);