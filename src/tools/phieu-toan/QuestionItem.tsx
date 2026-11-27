/** Một câu trên phiếu. Chỉ dùng chữ, viền và nền để PDF vẽ lại được. */
import { OP_SIGN, type Blank, type Calc, type Question } from './generator';

const Box = () => (
  <span className="inline-block h-[1.6em] w-[2.2em] shrink-0 rounded-[1mm] border border-black" />
);

const Circle = () => (
  <span className="inline-block size-[1.7em] shrink-0 rounded-full border border-black" />
);

/** Dòng chấm để viết đáp án. */
const AnswerLine = () => (
  <span className="h-[1.2em] max-w-[4.5em] min-w-[1.5em] flex-1 border-b border-dotted border-black" />
);

const Expression = ({ calc }: { calc: Calc }) => (
  <span>
    {calc.a} {OP_SIGN[calc.op]} {calc.b}
  </span>
);

function Part({ question, part }: { question: Calc & { hidden: Blank }; part: Blank }) {
  return question.hidden === part ? <Box /> : <span>{question[part]}</span>;
}

/** Chữ số rộng bằng nhau để các hàng đơn vị, chục, trăm thẳng cột. */
function Digits({ value, width }: { value: number; width: number }) {
  return (
    <span className="inline-flex justify-end">
      {[...String(value)].map((digit, index) => (
        <span key={index} className="inline-block text-center" style={{ width: `${width}em` }}>
          {digit}
        </span>
      ))}
    </span>
  );
}

function Vertical({ calc, digitWidth }: { calc: Calc; digitWidth: number }) {
  const width = digitWidth + 0.06;
  // Phép chia đặt tính kiểu Việt Nam: số bị chia bên trái, số chia trên vạch ngang.
  if (calc.op === 'div') {
    return (
      <div className="grid grid-cols-[auto_auto] leading-[1.6]">
        <span className="pr-[2mm]">
          <Digits value={calc.a} width={width} />
        </span>
        <span className="min-w-[3em] border-b border-l border-black pl-[2mm]">
          <Digits value={calc.b} width={width} />
        </span>
        <span />
        <span className="h-[2.8em] border-l border-black" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[1.4em_auto] items-center leading-[1.4]">
      <span className="row-span-2">{OP_SIGN[calc.op]}</span>
      <span className="justify-self-end">
        <Digits value={calc.a} width={width} />
      </span>
      <span className="justify-self-end">
        <Digits value={calc.b} width={width} />
      </span>
      <span className="col-span-2 mt-[1mm] min-w-[3em] border-t border-black" />
    </div>
  );
}

function Content({
  question,
  vertical,
  digitWidth,
}: {
  question: Question;
  vertical: boolean;
  digitWidth: number;
}) {
  if (question.kind === 'compare') {
    const { left, right } = question;
    return (
      <>
        {typeof left === 'number' ? <span>{left}</span> : <Expression calc={left} />}
        <Circle />
        <span>{right}</span>
      </>
    );
  }
  if (vertical) return <Vertical calc={question} digitWidth={digitWidth} />;
  if (question.hidden === 'result') {
    return (
      <>
        <Expression calc={question} />
        <span>=</span>
        <AnswerLine />
      </>
    );
  }
  return (
    <>
      <Part question={question} part="a" />
      <span>{OP_SIGN[question.op]}</span>
      <Part question={question} part="b" />
      <span>=</span>
      <Part question={question} part="result" />
    </>
  );
}

export function QuestionItem({
  number,
  question,
  vertical,
  digitWidth,
}: {
  number: number;
  question: Question;
  vertical: boolean;
  digitWidth: number;
}) {
  return (
    <li
      data-question
      className={`flex min-w-0 gap-[0.35em] whitespace-nowrap ${vertical ? 'items-start' : 'items-center'}`}
    >
      <span className="min-w-[2.1em] shrink-0 text-[0.75em]">{number})</span>
      <Content question={question} vertical={vertical} digitWidth={digitWidth} />
    </li>
  );
}
