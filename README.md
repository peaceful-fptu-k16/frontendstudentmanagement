# 🎓 Hệ thống Quản lý Sinh viên - Frontend

Một website quản lý sinh viên chuyên nghiệp được xây dựng với HTML, CSS, và JavaScript thuần, tích hợp với backend FastAPI.

## ✨ Tính năng chính

### 📊 Quản lý sinh viên
- ✅ Thêm, sửa, xóa thông tin sinh viên
- ✅ Hiển thị danh sách sinh viên với phân trang
- ✅ Tìm kiếm và lọc sinh viên
- ✅ Tự động tính điểm trung bình và xếp loại
- ✅ Validation dữ liệu đầu vào

### 📈 Phân tích dữ liệu
- ✅ Dashboard với thống kê tổng quan
- ✅ Biểu đồ phân bố xếp loại
- ✅ So sánh điểm các môn học
- ✅ Phân bố sinh viên theo quê quán

### 📁 Import/Export
- ✅ Import dữ liệu từ file Excel/CSV
- ✅ Export dữ liệu ra Excel/CSV
- ✅ Tải template mẫu
- ✅ Báo cáo kết quả import chi tiết

## 🎨 Giao diện

- **Responsive Design**: Tương thích mọi thiết bị
- **Modern UI**: Thiết kế hiện đại với gradient và animations
- **User-friendly**: Trải nghiệm người dùng mượt mà
- **Accessible**: Hỗ trợ keyboard navigation

## 🚀 Cài đặt và chạy

### Yêu cầu
- Backend FastAPI đang chạy tại `http://localhost:8000`
- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)

### Chạy frontend
1. Mở file `index.html` trong trình duyệt
2. Hoặc sử dụng Live Server (VS Code extension)
3. Hoặc chạy local server:
   ```bash
   # Python
   python -m http.server 3000
   
   # Node.js
   npx serve .
   ```

## 📁 Cấu trúc thư mục

```
FrontendStudentManagement/
├── index.html              # Trang chính
├── styles/
│   └── main.css            # CSS chính
├── js/
│   ├── config.js           # Cấu hình ứng dụng
│   ├── api.js              # API service layer
│   ├── utils.js            # Tiện ích và validation
│   ├── components.js       # UI components
│   ├── students.js         # Quản lý sinh viên
│   ├── analytics.js        # Phân tích dữ liệu
│   ├── import-export.js    # Import/Export
│   └── app.js              # Controller chính
└── README.md              # Tài liệu
```

## 🔧 Cấu hình

### API Configuration (`js/config.js`)
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api/v1',
    TIMEOUT: 10000
};
```

### Validation Rules
- **Mã sinh viên**: 6-12 ký tự alphanumeric
- **Họ tên**: 1-50 ký tự, bắt buộc
- **Email**: Định dạng email hợp lệ (tùy chọn)
- **Điểm số**: 0-10, có thể thập phân (tùy chọn)

## 🎯 Chức năng chi tiết

### Quản lý sinh viên
- **Thêm sinh viên**: Form với validation real-time
- **Sửa sinh viên**: Click nút Edit, form tự động fill dữ liệu
- **Xóa sinh viên**: Xác nhận trước khi xóa
- **Tìm kiếm**: Tìm theo tên, mã sinh viên
- **Lọc**: Theo quê quán, xếp loại
- **Phân trang**: 20 sinh viên/trang

### Phân tích dữ liệu
- **Tổng quan**: Số lượng sinh viên, tuổi trung bình
- **Biểu đồ tròn**: Phân bố xếp loại (A, B, C, D, F)
- **Biểu đồ cột**: So sánh điểm trung bình các môn
- **Biểu đồ ngang**: Top 10 quê quán có nhiều sinh viên nhất

### Import/Export
- **Import**: 
  - Hỗ trợ file .xlsx, .xls, .csv
  - Giới hạn 10MB
  - Báo cáo chi tiết lỗi từng dòng
- **Export**: 
  - Excel (.xlsx) hoặc CSV (.csv)
  - Tên file tự động theo ngày
- **Template**: Tải file mẫu để import

## 🎨 Tính năng UI/UX

### Visual Features
- **Loading animations**: Spinner khi tải dữ liệu
- **Notifications**: Toast messages cho các hành động
- **Modal dialogs**: Form thêm/sửa trong popup
- **Hover effects**: Interactive buttons và cards
- **Gradient backgrounds**: Thiết kế hiện đại

### User Experience
- **Auto-save**: Tự động lưu khi nhập liệu
- **Keyboard shortcuts**: 
  - `Ctrl+K`: Focus tìm kiếm
  - `Ctrl+N`: Thêm sinh viên mới  
  - `1-3`: Chuyển đổi tabs
- **Error handling**: Thông báo lỗi chi tiết
- **Responsive**: Tương thích mobile

## 🔍 Validation & Security

### Client-side Validation
- Real-time validation khi nhập liệu
- Hiển thị lỗi ngay dưới từng field
- Prevent submit nếu có lỗi

### Security Features
- HTML escaping để tránh XSS
- File type validation cho upload
- Input sanitization

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 768px - Full layout với sidebar
- **Tablet**: 768px - Collapsed navigation  
- **Mobile**: < 480px - Stack layout

### Mobile Optimizations
- Touch-friendly buttons (44px minimum)
- Swipe gestures cho navigation
- Optimized table scroll
- Compact form layouts

## 🎯 Performance

### Optimizations
- Debounced search (300ms delay)
- Pagination để giảm tải
- Lazy loading cho charts
- Cached API responses
- Minimal DOM manipulations

### Browser Support
- Chrome 60+
- Firefox 55+  
- Safari 12+
- Edge 79+

## 🚨 Error Handling

### API Error Types
- **Network errors**: Mất kết nối
- **Validation errors**: Dữ liệu không hợp lệ
- **Server errors**: Lỗi backend
- **Timeout errors**: Request quá lâu

### User-friendly Messages
- Thông báo lỗi bằng tiếng Việt
- Gợi ý cách khắc phục
- Không hiển thị technical details

## 🎓 Cách sử dụng

### 1. Quản lý sinh viên
1. Click "Thêm sinh viên" để tạo mới
2. Nhập thông tin (chỉ mã SV, họ, tên là bắt buộc)
3. Click "Lưu" để hoàn tất
4. Sử dụng tìm kiếm/lọc để tìm sinh viên
5. Click nút "Sửa"/"Xóa" trên từng dòng

### 2. Xem phân tích
1. Chuyển sang tab "Phân tích"
2. Xem dashboard tổng quan
3. Quan sát các biểu đồ
4. Click "Làm mới" để cập nhật

### 3. Import/Export
1. Chuyển sang tab "Import/Export"
2. Tải template mẫu (khuyến nghị)
3. Chọn file Excel/CSV để import
4. Hoặc export dữ liệu hiện tại

## 🤝 Tích hợp Backend

Website này được thiết kế để hoạt động với backend FastAPI. Đảm bảo:

1. Backend đang chạy tại `http://localhost:8000`
2. CORS đã được cấu hình cho frontend
3. Các endpoint API hoạt động bình thường

## 🎉 Demo

Truy cập website và thử các tính năng:
1. Thêm vài sinh viên mẫu
2. Xem thống kê trên tab Phân tích  
3. Export dữ liệu ra Excel
4. Import lại dữ liệu từ file

---

**Tác giả**: Được xây dựng với ❤️ bằng HTML, CSS, JavaScript thuần
**License**: MIT