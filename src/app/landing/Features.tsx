import { GraduationCap, MonitorPlay, Printer, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    icon: Printer,
    group: 'phieu-bai-tap',
    title: 'In đúng khổ A4',
    text: 'Canh lề A4 dọc hoặc ngang, trang đáp án riêng cho thầy cô, in ngay hoặc tải PDF chữ nét.',
  },
  {
    icon: ShieldCheck,
    group: 'giay-tap-viet',
    title: 'Dữ liệu ở lại trên máy',
    text: 'Danh sách học sinh, điểm số, nhận xét và file của thầy cô không được gửi lên máy chủ.',
  },
  {
    icon: GraduationCap,
    group: 'the-bang',
    title: 'Bám sát GDPT 2018',
    text: 'Nhận xét học sinh theo Thông tư 27, tính điểm và xếp loại theo Thông tư 22.',
  },
  {
    icon: MonitorPlay,
    group: 'tro-choi',
    title: 'Trình chiếu trên tivi',
    text: 'Vòng quay gọi tên, đếm ngược, trò chơi ôn tập với cỡ chữ lớn nhìn rõ từ cuối lớp.',
  },
] as const;

export function Features() {
  return (
    <section id="tinh-nang" aria-labelledby="tinh-nang-title" className="section">
      <div className="container-page">
        <h2 id="tinh-nang-title" className="sr-only">
          Tính năng
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="card flex flex-col gap-3 p-5">
              <span data-group={feature.group} className="tint size-12">
                <feature.icon aria-hidden className="size-6" />
              </span>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted">{feature.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
