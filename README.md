# Cosmetic Ecommerce Django & React Native

## Mô tả
Dự án này là hệ thống thương mại điện tử mỹ phẩm, gồm backend sử dụng Django (REST API, OAuth2) và frontend mobile app sử dụng React Native.

## Cấu trúc thư mục

- `cosmeticstoreapis/`: Backend Django
  - `manage.py`: File quản lý Django
  - `cosmeticstoreapis/`: Cấu hình chính
  - `store/`: App chính (models, views, serializers, migrations...)
- `cosmeticstoreapp/`: Frontend React Native
  - `components/`: Các màn hình và component
  - `configs/Apis.js`: Cấu hình API URL
  - `assets/`: Hình ảnh

## Yêu cầu

- Python >= 3.11
- Node.js >= 18
- MySQL
- Các package Python/Node đã liệt kê trong `requirements.txt` và `package.json`

## Hướng dẫn chạy Backend (Django)

1. Cài đặt package:
	```sh
	pip install -r requirements.txt
	```
2. Cấu hình biến môi trường (tạo file `.env`):
	```env
	SECRET_KEY=your_secret_key
	DB_NAME=your_db_name
	DB_USER=your_db_user
	DB_PASSWORD=your_db_password
	DB_HOST=localhost
	CLIENT_ID=your_client_id
	CLIENT_SECRET=your_client_secret
	CLOUDINARY_CLOUD_NAME=your_cloud_name
	CLOUDINARY_API_KEY=your_cloudinary_key
	CLOUDINARY_API_SECRET=your_cloudinary_secret
	```
3. Chạy migrate:
	```sh
	python manage.py migrate
	```
4. Chạy server với IP LAN (ví dụ):
	```sh
	python manage.py runserver 192.168.x.x:8000
	```
	(Thay `192.168.x.x` bằng IP máy chủ backend)

## Hướng dẫn chạy Frontend (React Native)

1. Cài đặt package:
	```sh
	npm install
	```
2. Cập nhật địa chỉ IP trong file `cosmeticstoreapp/configs/Apis.js`:
	```js
	export const API_URL = 'http://192.168.x.x:8000';
	```
	(Thay `192.168.x.x` bằng IP backend)
3. Chạy app:
	```sh
	npx expo start
	```

## Lưu ý

- Nếu đổi mạng WiFi, cần cập nhật lại IP ở cả backend và frontend.
- Khi deploy production, nên dùng domain thay cho IP.
- Đảm bảo backend trả về các URL đúng IP/domain cho client.

## Tác giả
- Le Hoang Phuc