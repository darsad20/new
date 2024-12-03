const API_URL = "https://script.google.com/macros/s/AKfycbw6aK6beyCK_YK15L-I37yuycBD-pH9DfAlILSpo4TylvIDoQ2HGJS-B983cv0XNdnzKQ/exec";

let allHajData = []; // لتخزين جميع البيانات
let currentRowsPerPage = 10; // عدد الصفوف الافتراضي

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
    document.getElementById('hajResults').innerHTML = '';
    document.getElementById('hajResultsControls').style.display = 'none';
    document.getElementById('progressBar').style.display = 'none';
    toastr.info('تمت إعادة تعيين البحث.');
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
        const response = await fetch(`${API_URL}?companyName=${encodeURIComponent(searchInput)}&action=fetchCompanyData`);
        if (!response.ok) {
            console.error(`HTTP Error! Status: ${response.status}, Message: ${response.statusText}`);
            throw new Error(`خطأ في الاتصال بالسيرفر. الحالة: ${response.status}`);
        }

        const result = await response.json();
        document.getElementById('progressBar').style.display = 'none';

        if (result.error) {
            document.getElementById('results').innerHTML = `<p class="text-danger">${sanitize(result.error)}</p>`;
            toastr.warning('لم يتم العثور على نتائج.');
        } else {
            document.getElementById('results').innerHTML = `
                <div class="result-card">
                    <h3>${sanitize(result.name)}</h3>
                    <p><i class="fas fa-chart-pie"></i> الحصة: ${sanitize(result.quota)}</p>
                    <p><i class="fas fa-map-marker-alt"></i> المحافظة: ${sanitize(result.province)}</p>
                    <p><i class="fas fa-envelope"></i> البريد الإلكتروني: ${sanitize(result.email)}</p>
                    <p><i class="fas fa-phone-alt"></i> رقم التواصل: ${sanitize(result.contact)}</p>
                    <button onclick="fetchHajData('${sanitize(result.name)}')" class="btn btn-primary mt-3">عرض بيانات الحجاج</button>
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('progressBar').style.display = 'none';
        toastr.error(`حدث خطأ أثناء جلب البيانات: ${error.message}`);
    }
}

/**
 * جلب بيانات الحجاج
 */
async function fetchHajData(companyName) {
    try {
        const response = await fetch(`${API_URL}?companyName=${encodeURIComponent(companyName)}&action=fetchHajData`);
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

        const result = await response.json();
        const hajResults = document.getElementById('hajResults');
        const hajResultsControls = document.getElementById('hajResultsControls');

        if (result.error) {
            hajResults.innerHTML = `<p class="text-danger">${sanitize(result.error)}</p>`;
            toastr.warning('لم يتم العثور على بيانات الحجاج.');
            hajResultsControls.style.display = 'none';
        } else {
            allHajData = result; // حفظ جميع البيانات
            currentRowsPerPage = 10; // إعادة تعيين الصفوف الافتراضية
            renderTable(); // عرض الجدول
            hajResultsControls.style.display = 'flex'; // إظهار التحكم في الصفوف وزر التصدير
        }
    } catch (error) {
        toastr.error(`حدث خطأ أثناء جلب بيانات الحجاج: ${error.message}`);
    }
}

/**
 * عرض الجدول بناءً على عدد الصفوف المختار
 */
function renderTable() {
    const hajResults = document.getElementById('hajResults');
    const dataToDisplay = allHajData.slice(0, currentRowsPerPage); // عرض عدد محدد من الصفوف

    hajResults.innerHTML = `
        <table class="table table-bordered mt-4">
            <thead>
                <tr>
                    <th>#</th>
                    <th>رقم الجواز</th>
                    <th>اسم الحاج</th>
                </tr>
            </thead>
            <tbody>
                ${dataToDisplay.map((row, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${sanitize(row['رقم الجواز'])}</td>
                        <td>${sanitize(row['اسم الحاج'])}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/**
 * تحديث عدد الصفوف عند تغيير الخيار
 */
function updateTableRows() {
    const rowsPerPageSelect = document.getElementById('rowsPerPage');
    currentRowsPerPage = parseInt(rowsPerPageSelect.value, 10); // تحديث عدد الصفوف المحدد
    renderTable(); // إعادة عرض الجدول
}

/**
 * تصدير البيانات إلى Excel
 */
function exportToExcel() {
    const hajResults = document.getElementById('hajResults');
    if (!hajResults.querySelector('table')) {
        toastr.warning('لا توجد بيانات لتصديرها.');
        return;
    }

    const table = hajResults.querySelector('table');
    const wb = XLSX.utils.table_to_book(table, { sheet: "الحجاج" });
    XLSX.writeFile(wb, `بيانات_الحجاج.xlsx`);
}

/**
 * تصدير البيانات إلى PDF
 */
function exportToPDF() {
    const hajResults = document.getElementById('hajResults');
    if (!hajResults.querySelector('table')) {
        toastr.warning('لا توجد بيانات لتصديرها.');
        return;
    }

    const table = hajResults.querySelector('table');
    const pdf = new jsPDF();
    pdf.autoTable({ html: table });
    pdf.save(`بيانات_الحجاج.pdf`);
}

/**
 * تطهير النصوص لمنع هجمات XSS
 */
function sanitize(input) {
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
}
