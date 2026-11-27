import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <h1 className="heading-1">Không tìm thấy trang</h1>
      <p className="text-muted">Địa chỉ này chưa có công cụ nào. Bạn tìm lại ở trang chủ nhé.</p>
      <Link to="/" className="btn btn-primary">
        Về trang chủ
      </Link>
    </div>
  );
}
