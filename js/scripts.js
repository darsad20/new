document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');

    // البحث عند الضغط على Enter
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
    document.getElementById('results').innerHTML = '';
    document.getElementById('progressBar').style.display = 'none';
    toastr.info('تم إعادة تعيين البحث.');
}

/**
 * عرض شريط التقدم
 */
function showProgressBar() {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = 'block';

    const bar = progressBar.querySelector('.progress-bar');
    bar.style.width = '0%';

    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
        } else {
            width += 10;
            bar.style.width = `${width}%`;
        }
    }, 300);
}

/**
 * البحث عن المنشأة
 */
async function searchCompany() {
    const searchInput = document.getElementById('searchInput').value.trim();
    if (!searchInput) {
        toastr.warning('الرجاء إدخال اسم المنشأة.');
        return;
    }

    showProgressBar();

    try {
        const API_URL = `https://script.google.com/macros/s/AKfycbwk2SLayWu8b8dryXNha3lWUoO8YwT1v_gtyG997YbYaH7R1pNMEdIYJMv17wm0GSRWZA/exec?companyName=${encodeURIComponent(searchInput)}`;
        
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('فشل الاتصال بالخادم.');

        const result = await response.json();
        document.getElementById('progressBar').style.display = 'none';

        if (!result || result.error) {
            document.getElementById('results').innerHTML = '<p>لا توجد نتائج مطابقة.</p>';
            toastr.warning('لم يتم العثور على نتائج.');
            return;
        }

        // عرض البيانات
        document.getElementById('results').innerHTML = `
            <div class="result-card">
                <h3>${sanitize(result.name)}</h3>
                <p><i class="fas fa-envelope"></i> البريد الإلكتروني: ${sanitize(result.email)}</p>
                <p><i class="fas fa-map-marker-alt"></i> الموقع: ${sanitize(result.province)}</p>
            </div>
        `;
    } catch (error) {
        document.getElementById('progressBar').style.display = 'none';
        toastr.error('حدث خطأ أثناء جلب البيانات.');
        console.error('Error:', error);
    }
}

/**
 * تطهير البيانات لمنع هجمات XSS
 * @param {string} input
 * @returns {string}
 */
function sanitize(input) {
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
}
