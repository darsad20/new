const API_URL = "https://script.google.com/macros/s/AKfycbwzh4x-KGImuO0M_ckXGi9iCfBpBd4KpL1x2DNBmJRZRdVH2CMx8dT78otNIhpnBmoWug/exec";
let controller;

document.addEventListener('DOMContentLoaded', () => {
    // تفعيل ميزة الاقتراحات التلقائية
    enableAutocomplete();

    // البحث عند الضغط على Enter
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchCompany();
        }
    });
});

/**
 * إعادة تعيين الحقول
 */
function resetSearch() {
    document.getElementById('searchInput').value = '';
    document.querySelector('.result-container').innerHTML = ''; // مسح النتائج السابقة
    document.getElementById('loadingBarContainer').style.display = 'none';
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('noResultsMessage').style.display = 'none';
    toastr.info('تمت إعادة تعيين البحث.', '', { "positionClass": "toast-top-center" });
    if (controller) {
        controller.abort();
    }
}

/**
 * عرض شريط التحميل
 */
function showLoadingBar() {
    const loadingBarContainer = document.getElementById('loadingBarContainer');
    const loadingBar = document.getElementById('loadingBar');
    loadingBarContainer.style.display = 'block'; // عرض الشريط
    loadingBar.style.width = '0%';

    let width = 0;
    const interval = setInterval(() => {
        if (width >= 90) {
            clearInterval(interval);
        } else {
            width += 2; // زيادة سريعة في البداية حتى تصل إلى 90%
            loadingBar.style.width = `${width}%`;
        }
    }, 50);
}

/**
 * إكمال شريط التحميل عند انتهاء التحميل
 */
function completeLoadingBar() {
    const loadingBar = document.getElementById('loadingBar');
    loadingBar.style.width = '100%';
    setTimeout(() => {
        document.getElementById('loadingBarContainer').style.display = 'none';
    }, 500);
}

/**
 * إظهار رسالة "جاري التحميل"
 */
function showLoadingMessage() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

/**
 * إخفاء رسالة "جاري التحميل"
 */
function hideLoadingMessage() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

/**
 * البحث عن المنشأة مع إمكانية التخزين المؤقت
 */
async function searchCompany() {
    const searchInput = document.getElementById('searchInput').value.trim();
    if (!searchInput) {
        toastr.warning('الرجاء إدخال اسم المنشأة.', '', { "positionClass": "toast-top-center" });
        return;
    }

    // التحقق من التخزين المؤقت
    const cachedResult = getCachedResult(searchInput);
    if (cachedResult) {
        displayCompany(cachedResult);
        return;
    }

    if (controller) {
        controller.abort();
    }
    controller = new AbortController();
    const signal = controller.signal;

    showLoadingBar();
    showLoadingMessage();
    document.getElementById('searchButton').disabled = true;

    try {
        const response = await fetch(`${API_URL}?companyName=${encodeURIComponent(searchInput)}`, { signal });
        if (!response.ok) {
            throw new Error(`خطأ في الاتصال بالسيرفر. الحالة: ${response.status}`);
        }

        const result = await response.json();
        completeLoadingBar();
        hideLoadingMessage();
        document.getElementById('searchButton').disabled = false;

        if (Array.isArray(result) && result.length > 0) {
            displaySuggestions(result);
        } else if (result.error) {
            document.querySelector('.result-container').innerHTML = `<p class="text-danger">${sanitize(result.error)}</p>`;
            toastr.warning(result.error, '', { "positionClass": "toast-top-center" });
        } else {
            if (result.length === 0) {
                document.getElementById('noResultsMessage').classList.remove('hidden');
            } else {
                displayCompany(result);
            }
        }

        cacheResult(searchInput, result);

    } catch (error) {
        document.getElementById('loadingBarContainer').style.display = 'none';
        hideLoadingMessage();
        document.getElementById('searchButton').disabled = false;

        if (error.name === 'AbortError') {
            toastr.info('تم إلغاء البحث.', '', { "positionClass": "toast-top-center" });
        } else if (error.message.includes('Failed to fetch')) {
            toastr.error('حدث خطأ أثناء الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.', '', { "positionClass": "toast-top-center" });
        } else {
            toastr.error(`حدث خطأ أثناء جلب البيانات: ${error.message}`, '', { "positionClass": "toast-top-center" });
        }
    }
}

/**
 * تخزين نتيجة البحث في التخزين المؤقت
 */
function cacheResult(companyName, result) {
    localStorage.setItem(`search_${companyName}`, JSON.stringify(result));
}

/**
 * جلب النتيجة المخزنة مؤقتاً
 */
function getCachedResult(companyName) {
    const cached = localStorage.getItem(`search_${companyName}`);
    return cached ? JSON.parse(cached) : null;
}

/**
 * عرض النتيجة الدقيقة مع تأثير Fade-in
 */
function displayCompany(company) {
    const resultsContainer = document.querySelector('.result-container');
    resultsContainer.innerHTML = `
        <div class="result-card text-center shadow-lg transition-transform transform hover:scale-105 m-auto" data-aos="fade-up">
            <div class="card-header">
                <h3 class="text-blue-700 text-2xl font-semibold">${sanitize(company.name)}</h3>
            </div>
            <div class="card-body">
                <p><i class="fas fa-map-marker-alt text-blue-500"></i> <strong>العنوان:</strong> ${sanitize(company.address)}</p>
                <p><i class="fas fa-suitcase text-blue-500"></i> <strong>النشاط:</strong> ${sanitize(company.activity)}</p>
                <p><i class="fas fa-chart-pie text-blue-500"></i> <strong>حصة الحج:</strong> ${sanitize(company.hajjQuota)}</p>
                <p><i class="fas fa-envelope text-blue-500"></i> <strong>البريد الإلكتروني:</strong> <a href="mailto:${sanitize(company.email)}" class="text-blue-600">${sanitize(company.email)}</a></p>
                <p><i class="fas fa-phone-alt text-blue-500"></i> <strong>رقم التواصل:</strong> <a href="tel:${sanitize(company.contact)}" class="text-blue-600">${sanitize(company.contact)}</a></p>
            </div>
            <div class="card-footer text-center mt-4">
                <button class="btn btn-primary bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2 px-4 rounded-lg shadow-md hover:scale-105 transform transition-transform">
                    <i class="fas fa-envelope"></i> إرسال بريد
                </button>
                <button class="btn btn-secondary bg-gradient-to-r from-gray-400 to-gray-600 text-white py-2 px-4 rounded-lg shadow-md hover:scale-105 transform transition-transform">
                    <i class="fas fa-phone-alt"></i> اتصال
                </button>
            </div>
        </div>
    `;
}

/**
 * تمكين ميزة الاقتراحات التلقائية
 */
async function enableAutocomplete() {
    try {
        const response = await fetch(`${API_URL}?getCompanies=true&limit=10`);
        if (!response.ok) {
            throw new Error(`خطأ في الاتصال بالسيرفر. الحالة: ${response.status}`);
        }

        const companies = await response.json();
        if (Array.isArray(companies)) {
            $("#searchInput").autocomplete({
                source: companies
            });
        }
    } catch (error) {
        console.error("Error fetching companies for autocomplete:", error);
    }
}

/**
 * تطهير النصوص لمنع هجمات XSS
 */
function sanitize(input) {
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
}
