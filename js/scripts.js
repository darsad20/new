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
        const API_URL = "https://script.google.com/macros/s/AKfycbzyNDbip5gjjBeidhr0-NEW6uxMkZc-VwaLybeEb5bPUS5jpCuaaZFSWaAQIj5O5uj6Hg/exec";
        
        const response = await fetch(`${API_URL}?companyName=${encodeURIComponent(searchInput)}`);
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const result = await response.json();
        document.getElementById('progressBar').style.display = 'none';

        if (result.error) {
            document.getElementById('results').innerHTML = `<p>${sanitize(result.error)}</p>`;
            toastr.warning('لم يتم العثور على نتائج.');
        } else {
            document.getElementById('results').innerHTML = `
                <div class="result-card">
                    <h3>${sanitize(result.name)}</h3>
                    <p><i class="fas fa-envelope"></i> البريد الإلكتروني: ${sanitize(result.email)}</p>
                    <p><i class="fas fa-map-marker-alt"></i> المحافظة: ${sanitize(result.province)}</p>
                    <p><i class="fas fa-chart-pie"></i> الحصة: ${sanitize(result.quota || "غير محددة")}</p>
                    <p><i class="fas fa-phone-alt"></i> رقم التواصل: ${sanitize(result.contact || "غير متوفر")}</p>
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('progressBar').style.display = 'none';
        toastr.error(`حدث خطأ: ${error.message}`);
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
