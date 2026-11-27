import { useState, type FormEvent } from 'react';
import { TextAreaField, TextField } from '@/components/fields';
import { SITE } from '@/core/site';

const FAQ = [
  {
    question: 'Có cần cài phần mềm không?',
    answer: 'Không. Bạn chỉ cần trình duyệt Chrome, Edge, Safari hoặc Firefox bản mới.',
  },
  {
    question: 'Danh sách học sinh có bị gửi đi đâu không?',
    answer: 'Không. Tên học sinh và file chỉ được xử lý trên máy của bạn.',
  },
  {
    question: 'In bị lệch kích thước thì làm sao?',
    answer: 'Trong hộp thoại in, chọn khổ A4, tỉ lệ 100% và tắt “Vừa với trang”.',
  },
];

function FeedbackForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!SITE.contactEmail) {
    return <p className="text-muted">Hộp thư góp ý đang được thiết lập.</p>;
  }

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      setError('Bạn viết vài dòng nội dung rồi gửi nhé.');
      return;
    }
    setError('');
    const params = [
      `subject=${encodeURIComponent(subject.trim() || `Góp ý cho ${SITE.name}`)}`,
      `body=${encodeURIComponent(message)}`,
    ];
    location.href = `mailto:${SITE.contactEmail}?${params.join('&')}`;
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={send} noValidate>
      <TextField label="Tiêu đề" value={subject} onChange={setSubject} />
      <TextAreaField
        label="Nội dung góp ý hoặc công cụ bạn muốn có"
        value={message}
        onChange={setMessage}
        hint="Đừng ghi tên học sinh."
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary self-start">
        Mở thư để gửi
      </button>
    </form>
  );
}

export function About() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="heading-1">Giới thiệu</h1>
        <p>{SITE.description}</p>
        <p>{SITE.tagline}.</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="heading-2">Câu hỏi thường gặp</h2>
        {FAQ.map((item) => (
          <div key={item.question}>
            <h3 className="font-semibold">{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>

      <section id="gop-y" className="flex scroll-mt-4 flex-col gap-3">
        <h2 className="heading-2">Góp ý</h2>
        <FeedbackForm />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="heading-2">Nguồn font và biểu tượng</h2>
        <ul className="list-disc pl-6">
          <li>Font Be Vietnam Pro, giấy phép SIL Open Font License 1.1.</li>
          <li>Biểu tượng Lucide, giấy phép ISC.</li>
        </ul>
      </section>
    </div>
  );
}
