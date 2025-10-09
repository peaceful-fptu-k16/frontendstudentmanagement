# Student Management System - Frontend# 🎓 Hệ thống Quản lý Sinh viên - Frontend



A modern, vanilla JavaScript frontend application for managing student records with full CRUD operations, analytics, and import/export features.Một website quản lý sinh viên chuyên nghiệp được xây dựng với HTML, CSS, và JavaScript thuần, tích hợp với backend FastAPI.



## ✨ Features## ✨ Tính năng chính



- **Student Management**: Complete CRUD operations (Create, Read, Update, Delete)### 📊 Quản lý sinh viên

- **Advanced Filtering**: Search by name, filter by hometown and grade- ✅ Thêm, sửa, xóa thông tin sinh viên

- **Sorting**: Sort by any column (ID, name, scores, etc.)- ✅ Hiển thị danh sách sinh viên với phân trang

- **Pagination**: Client-side pagination with customizable page size- ✅ Tìm kiếm và lọc sinh viên

- **Analytics Dashboard**: Visual charts and statistics- ✅ Tự động tính điểm trung bình và xếp loại

- **Import/Export**: Excel and CSV support- ✅ Validation dữ liệu đầu vào

- **XML Support**: Full XML response parsing from backend

- **Responsive Design**: Works on desktop and mobile devices### 📈 Phân tích dữ liệu

- ✅ Dashboard với thống kê tổng quan

## 🏗️ Architecture- ✅ Biểu đồ phân bố xếp loại

- ✅ So sánh điểm các môn học

### Frontend Structure- ✅ Phân bố sinh viên theo quê quán

```

FrontendStudentManagement/### 📁 Import/Export

├── index.html              # Main HTML file- ✅ Import dữ liệu từ file Excel/CSV

├── js/- ✅ Export dữ liệu ra Excel/CSV

│   ├── config.js          # Configuration constants- ✅ Tải template mẫu

│   ├── api.js             # API service with XML parsing- ✅ Báo cáo kết quả import chi tiết

│   ├── utils.js           # Utility functions

│   ├── students.js        # Student management logic## 🎨 Giao diện

│   ├── analytics.js       # Analytics and charts

│   ├── components.js      # UI components- **Responsive Design**: Tương thích mọi thiết bị

│   ├── app.js             # Application controller- **Modern UI**: Thiết kế hiện đại với gradient và animations

│   └── import-export.js   # Import/export functionality- **User-friendly**: Trải nghiệm người dùng mượt mà

└── styles/- **Accessible**: Hỗ trợ keyboard navigation

    └── main.css           # Styles

## 🚀 Cài đặt và chạy

```

### Yêu cầu

### Key Technologies- Backend FastAPI đang chạy tại `http://localhost:8000`

- **Pure JavaScript** (ES6+) - No frameworks- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)

- **Chart.js** - Data visualization

- **Font Awesome** - Icons### Chạy frontend

- **XML/JSON** - Dual format support1. Mở file `index.html` trong trình duyệt

2. Hoặc sử dụng Live Server (VS Code extension)

## 🚀 Getting Started3. Hoặc chạy local server:

   ```bash

### Prerequisites   # Python

- Modern web browser (Chrome, Firefox, Edge, Safari)   python -m http.server 3000

- Backend API running (FastAPI with XML support)   

   # Node.js

### Installation   npx serve .

   ```

1. Clone the repository:

```bash## 📁 Cấu trúc thư mục

git clone https://github.com/peaceful-fptu-k16/frontendstudentmanagement.git

cd frontendstudentmanagement```

```FrontendStudentManagement/

├── index.html              # Trang chính

2. Configure API endpoint in `js/config.js`:├── styles/

```javascript│   └── main.css            # CSS chính

const API_CONFIG = {├── js/

    BASE_URL: 'http://localhost:8000/api/v1',  // Change if needed│   ├── config.js           # Cấu hình ứng dụng

    RESPONSE_FORMAT: 'xml'  // Or 'json'│   ├── api.js              # API service layer

};│   ├── utils.js            # Tiện ích và validation

```│   ├── components.js       # UI components

│   ├── students.js         # Quản lý sinh viên

3. Open `index.html` in your browser│   ├── analytics.js        # Phân tích dữ liệu

│   ├── import-export.js    # Import/Export

## 📡 API Integration│   └── app.js              # Controller chính

└── README.md              # Tài liệu

### XML Response Format```



The frontend expects XML responses in this structure:## 🔧 Cấu hình



**Student List:**### API Configuration (`js/config.js`)

```xml```javascript

<students total="100" page="1" page_size="20" total_pages="5" has_next="true" has_prev="false">const API_CONFIG = {

    <student id="1">    BASE_URL: 'http://localhost:8000/api/v1',

        <student_id>SV001</student_id>    TIMEOUT: 10000

        <first_name>John</first_name>};

        <last_name>Doe</last_name>```

        <email>john@example.com</email>

        <birth_date>2000-01-01</birth_date>### Validation Rules

        <hometown>Hanoi</hometown>- **Mã sinh viên**: 6-12 ký tự alphanumeric

        <math_score>8.5</math_score>- **Họ tên**: 1-50 ký tự, bắt buộc

        <literature_score>7.8</literature_score>- **Email**: Định dạng email hợp lệ (tùy chọn)

        <english_score>9.0</english_score>- **Điểm số**: 0-10, có thể thập phân (tùy chọn)

        <average_score>8.43</average_score>

        <grade>A</grade>## 🎯 Chức năng chi tiết

    </student>

</students>### Quản lý sinh viên

```- **Thêm sinh viên**: Form với validation real-time

- **Sửa sinh viên**: Click nút Edit, form tự động fill dữ liệu

### Supported Endpoints- **Xóa sinh viên**: Xác nhận trước khi xóa

- **Tìm kiếm**: Tìm theo tên, mã sinh viên

- `GET /students` - Get student list with filters- **Lọc**: Theo quê quán, xếp loại

- `GET /students/{id}` - Get single student- **Phân trang**: 20 sinh viên/trang

- `POST /students` - Create new student

- `PUT /students/{id}` - Update student### Phân tích dữ liệu

- `DELETE /students/{id}` - Delete student- **Tổng quan**: Số lượng sinh viên, tuổi trung bình

- `GET /analytics/summary` - Get analytics summary- **Biểu đồ tròn**: Phân bố xếp loại (A, B, C, D, F)

- `POST /students/import` - Import from file- **Biểu đồ cột**: So sánh điểm trung bình các môn

- `GET /students/export` - Export to file- **Biểu đồ ngang**: Top 10 quê quán có nhiều sinh viên nhất



## 🎨 Features in Detail### Import/Export

- **Import**: 

### Student Management  - Hỗ trợ file .xlsx, .xls, .csv

- Add, edit, and delete students  - Giới hạn 10MB

- Real-time search with debouncing  - Báo cáo chi tiết lỗi từng dòng

- Multi-column sorting- **Export**: 

- Filter by hometown and grade  - Excel (.xlsx) hoặc CSV (.csv)

- Bulk selection and operations  - Tên file tự động theo ngày

- **Template**: Tải file mẫu để import

### Validation

- Student ID: 6-12 alphanumeric characters## 🎨 Tính năng UI/UX

- Email: Valid email format

- Scores: 0-10 range### Visual Features

- Birth date: Between 15-100 years ago- **Loading animations**: Spinner khi tải dữ liệu

- **Notifications**: Toast messages cho các hành động

### Analytics- **Modal dialogs**: Form thêm/sửa trong popup

- Total students count- **Hover effects**: Interactive buttons và cards

- Average scores by subject- **Gradient backgrounds**: Thiết kế hiện đại

- Grade distribution

- Hometown analysis### User Experience

- Interactive charts- **Auto-save**: Tự động lưu khi nhập liệu

- **Keyboard shortcuts**: 

### Import/Export  - `Ctrl+K`: Focus tìm kiếm

- Excel (.xlsx) import/export  - `Ctrl+N`: Thêm sinh viên mới  

- CSV import/export  - `1-3`: Chuyển đổi tabs

- Template download- **Error handling**: Thông báo lỗi chi tiết

- Error handling and validation- **Responsive**: Tương thích mobile



## 🔧 Configuration## 🔍 Validation & Security



Edit `js/config.js` to customize:### Client-side Validation

- Real-time validation khi nhập liệu

```javascript- Hiển thị lỗi ngay dưới từng field

const APP_CONFIG = {- Prevent submit nếu có lỗi

    PAGINATION: {

        DEFAULT_PAGE_SIZE: 20,### Security Features

        MAX_PAGE_SIZE: 100- HTML escaping để tránh XSS

    },- File type validation cho upload

    VALIDATION: {- Input sanitization

        STUDENT_ID: {

            MIN_LENGTH: 6,## 📱 Responsive Design

            MAX_LENGTH: 12,

            PATTERN: /^[a-zA-Z0-9]{6,12}$/### Breakpoints

        },- **Desktop**: > 768px - Full layout với sidebar

        SCORE: {- **Tablet**: 768px - Collapsed navigation  

            MIN: 0,- **Mobile**: < 480px - Stack layout

            MAX: 10

        }### Mobile Optimizations

    }- Touch-friendly buttons (44px minimum)

};- Swipe gestures cho navigation

```- Optimized table scroll

- Compact form layouts

## 📝 Code Structure

## 🎯 Performance

### API Service (`js/api.js`)

- Handles all HTTP requests### Optimizations

- XML/JSON parsing- Debounced search (300ms delay)

- Error handling- Pagination để giảm tải

- Timeout management- Lazy loading cho charts

- Cached API responses

### Students Manager (`js/students.js`)- Minimal DOM manipulations

- CRUD operations

- Client-side filtering and sorting### Browser Support

- Pagination logic- Chrome 60+

- UI state management- Firefox 55+  

- Safari 12+

### Components (`js/components.js`)- Edge 79+

- Reusable UI components

- Modal, Form, Table builders## 🚨 Error Handling

- Notification system

- Loading indicators### API Error Types

- **Network errors**: Mất kết nối

### Utilities (`js/utils.js`)- **Validation errors**: Dữ liệu không hợp lệ

- Data formatting- **Server errors**: Lỗi backend

- Validation functions- **Timeout errors**: Request quá lâu

- DOM helpers

- File handling### User-friendly Messages

- Thông báo lỗi bằng tiếng Việt

## 🎯 Best Practices- Gợi ý cách khắc phục

- Không hiển thị technical details

- **All code comments in English**

- **JSDoc documentation** for all functions## 🎓 Cách sử dụng

- **Error handling** at every level

- **Responsive design** principles### 1. Quản lý sinh viên

- **Performance optimization** with debouncing1. Click "Thêm sinh viên" để tạo mới

- **XML-first** with JSON fallback2. Nhập thông tin (chỉ mã SV, họ, tên là bắt buộc)

3. Click "Lưu" để hoàn tất

## 🐛 Troubleshooting4. Sử dụng tìm kiếm/lọc để tìm sinh viên

5. Click nút "Sửa"/"Xóa" trên từng dòng

### Common Issues

### 2. Xem phân tích

**Problem**: Students not loading1. Chuyển sang tab "Phân tích"

- Check if backend is running2. Xem dashboard tổng quan

- Verify API URL in config.js3. Quan sát các biểu đồ

- Check browser console for errors4. Click "Làm mới" để cập nhật



**Problem**: XML parsing errors### 3. Import/Export

- Ensure backend returns proper Content-Type header1. Chuyển sang tab "Import/Export"

- Verify XML structure matches expected format2. Tải template mẫu (khuyến nghị)

3. Chọn file Excel/CSV để import

**Problem**: Import fails4. Hoặc export dữ liệu hiện tại

- Check file format (Excel/CSV)

- Verify data structure## 🤝 Tích hợp Backend

- Check for validation errors

Website này được thiết kế để hoạt động với backend FastAPI. Đảm bảo:

## 📄 License

1. Backend đang chạy tại `http://localhost:8000`

This project is licensed under the MIT License.2. CORS đã được cấu hình cho frontend

3. Các endpoint API hoạt động bình thường

## 👥 Authors

## 🎉 Demo

- peaceful-fptu-k16

Truy cập website và thử các tính năng:

## 🙏 Acknowledgments1. Thêm vài sinh viên mẫu

2. Xem thống kê trên tab Phân tích  

- Chart.js for visualization3. Export dữ liệu ra Excel

- Font Awesome for icons4. Import lại dữ liệu từ file

- FastAPI backend team

---

**Tác giả**: Được xây dựng với ❤️ bằng HTML, CSS, JavaScript thuần
**License**: MIT