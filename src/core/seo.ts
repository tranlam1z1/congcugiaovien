import { GRADES } from './catalog';
import { HOME_FAQ } from './homeFaq';
import { getTool, TOOLS } from './registry';
import { SITE } from './site';

export type PageSeo = {
  title: string;
  description: string;
  jsonLd?: object[];
  noindex?: boolean;
};

/** Các đường dẫn công khai được prerender. */
export const publicPaths = () => [
  '/',
  ...GRADES.map((g) => g.path),
  '/gioi-thieu',
  '/quyen-rieng-tu',
  ...TOOLS.map((t) => `/${t.slug}`),
];

const withSite = (title: string) => `${title} | ${SITE.name}`;

const faqJsonLd = (items: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
});

export function seoFor(pathname: string): PageSeo {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/')
    return { title: SITE.name, description: SITE.description, jsonLd: [faqJsonLd(HOME_FAQ)] };
  if (path === '/gioi-thieu')
    return {
      title: withSite('Giới thiệu và góp ý'),
      description: `Giới thiệu ${SITE.name}, câu hỏi thường gặp và mục góp ý.`,
    };
  if (path === '/quyen-rieng-tu')
    return {
      title: withSite('Quyền riêng tư'),
      description: 'Tên học sinh và file của bạn không rời khỏi trình duyệt.',
    };

  const grade = GRADES.find((g) => g.path === path);
  if (grade)
    return {
      title: withSite(`Công cụ ${grade.label}`),
      description: `Phiếu bài tập, trò chơi và công cụ in A4 cho giáo viên ${grade.label}.`,
    };

  const tool = getTool(path.slice(1));
  if (tool) {
    const jsonLd: object[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.description,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        inLanguage: 'vi',
      },
    ];
    if (tool.faq?.length) jsonLd.push(faqJsonLd(tool.faq));
    return { title: withSite(tool.name), description: tool.description, jsonLd };
  }

  return {
    title: withSite('Không tìm thấy trang'),
    description: SITE.description,
    noindex: true,
  };
}
