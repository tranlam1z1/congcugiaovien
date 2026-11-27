import { Check } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

type Cycle = 'month' | 'year';

/** Giá khởi đầu theo PRD mục 7; về sau lấy từ cấu hình admin. */
const PRO_PRICE: Record<Cycle, { value: string; unit: string; note: string }> = {
  year: { value: '399.000 đ', unit: '/năm', note: 'Khoảng 33.250 đ mỗi tháng' },
  month: { value: '49.000 đ', unit: '/tháng', note: 'Trả từng tháng' },
};

type Plan = {
  name: string;
  kicker: string;
  price: string;
  unit?: string;
  note: string;
  features: string[];
  featured?: boolean;
};

const plans = (cycle: Cycle): Plan[] => [
  {
    name: 'Khách',
    kicker: 'Trải nghiệm nhanh',
    price: '0 đ',
    note: 'Không cần đăng nhập',
    features: [
      '10 công cụ cơ bản',
      '5 lượt In hoặc Tải PDF mỗi ngày',
      '1 mẫu đề mỗi lượt tạo',
      'Có dòng nhỏ chân trang khi in',
    ],
  },
  {
    name: 'Free',
    kicker: 'Cơ bản',
    price: '0 đ',
    note: 'Đăng nhập bằng Google hoặc email',
    features: [
      '25 công cụ',
      '30 lượt In hoặc Tải PDF mỗi ngày',
      'Tối đa 3 đề khác nhau mỗi lượt',
      'Lưu tối đa 10 mục',
      'Có dòng nhỏ chân trang khi in',
    ],
  },
  {
    name: 'Pro',
    kicker: 'Dành cho giáo viên',
    price: PRO_PRICE[cycle].value,
    unit: PRO_PRICE[cycle].unit,
    note: PRO_PRICE[cycle].note,
    features: [
      'Đủ 60 công cụ',
      'Không giới hạn lượt In và Tải PDF',
      'Không có dòng chân trang khi in',
      'In sẵn tên từng học sinh',
      'Xuất Word, Excel và gắn logo trường',
      'Dùng thử 7 ngày',
    ],
    featured: true,
  },
  {
    name: 'Trường học',
    kicker: 'Đơn vị giáo dục',
    price: 'Từ 2.000.000 đ',
    note: '20 giáo viên, mỗi năm',
    features: [
      'Đủ quyền Pro cho mọi giáo viên',
      'Logo trường dùng chung',
      'Thư viện đề và mẫu phiếu nội bộ',
      'Hỗ trợ qua Zalo riêng',
    ],
  },
];

const CYCLES: { id: Cycle; label: string }[] = [
  { id: 'month', label: 'Trả theo tháng' },
  { id: 'year', label: 'Trả theo năm, tiết kiệm 32%' },
];

export function Pricing() {
  const [cycle, setCycle] = useState<Cycle>('year');

  return (
    <section id="bang-gia" aria-labelledby="bang-gia-title" className="section band">
      <div className="container-page flex flex-col gap-8">
        <div className="section-head">
          <h2 id="bang-gia-title" className="heading-section">
            Bảng giá dự kiến
          </h2>
          <p className="text-muted">
            Tài khoản và thanh toán chưa mở. Giá có thể thay đổi trước khi bán.
          </p>
          <div role="group" aria-label="Kỳ thanh toán gói Pro" className="flex flex-wrap justify-center gap-2">
            {CYCLES.map((item) => (
              <button
                key={item.id}
                type="button"
                className="toggle rounded-full px-4"
                aria-pressed={cycle === item.id}
                onClick={() => setCycle(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans(cycle).map((plan) => (
            <li
              key={plan.name}
              className={`card flex flex-col gap-4 p-6 ${plan.featured ? 'border-2 border-accent' : ''}`}
            >
              <div>
                <p className={plan.featured ? 'font-semibold text-accent' : 'text-muted'}>
                  {plan.kicker}
                </p>
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>
              <div aria-live={plan.featured ? 'polite' : undefined}>
                <p className="text-2xl font-bold tabular-nums">
                  {plan.price}
                  {plan.unit && <span className="text-base font-medium text-muted">{plan.unit}</span>}
                </p>
                <p className="text-muted">{plan.note}</p>
              </div>
              <ul className="flex flex-col gap-2 border-t border-line pt-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check aria-hidden className="mt-1 size-5 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.name === 'Khách' ? (
                <Link to="/#cong-cu" className="btn mt-auto">
                  Xem công cụ
                </Link>
              ) : (
                <button type="button" className="btn mt-auto" disabled>
                  Sắp mở
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
