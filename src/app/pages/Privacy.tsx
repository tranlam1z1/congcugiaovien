export function Privacy() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h1 className="heading-1">Quyền riêng tư</h1>
      <ul className="list-disc pl-6">
        <li>Công cụ chạy ngay trên trình duyệt của bạn.</li>
        <li>Tên học sinh, nội dung bạn nhập và file bạn chọn không được gửi lên máy chủ.</li>
        <li>
          Tùy chọn, công cụ đã ghim và dùng gần đây lưu trong bộ nhớ của trình duyệt trên máy này.
        </li>
        <li>Trang không dùng cookie quảng cáo và hiện chưa gắn công cụ phân tích truy cập.</li>
      </ul>
      <p>
        Nếu dùng máy chung, bạn xoá dữ liệu trang web trong phần cài đặt của trình duyệt sau khi
        làm xong.
      </p>
    </div>
  );
}
