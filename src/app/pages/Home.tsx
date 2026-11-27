import { Audiences } from '../landing/Audiences';
import { Faq } from '../landing/Faq';
import { Features } from '../landing/Features';
import { Hero } from '../landing/Hero';
import { Pricing } from '../landing/Pricing';
import { ToolExplorer } from '../landing/ToolExplorer';

/** Landing page, phương án giao diện "Sổ tay sắc màu". Các khối tự bọc container riêng. */
export function Home() {
  return (
    <>
      <Hero />
      <Features />
      <ToolExplorer />
      <Audiences />
      <Pricing />
      <Faq />
    </>
  );
}
