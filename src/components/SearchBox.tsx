import { Search } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { formatGrades } from '@/core/catalog';
import { TOOLS } from '@/core/registry';
import { searchTools } from '@/core/search';

const LIMIT = 8;

/** Ô tìm công cụ: gợi ý khi gõ, chọn bằng mũi tên và Enter. */
export function SearchBox({ variant }: { variant: 'hero' | 'header' }) {
  const id = useId();
  const listId = `${id}-list`;
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = searchTools(TOOLS, query).slice(0, LIMIT);
  const expanded = open && query.trim() !== '';

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Bộ gõ tiếng Việt đang ghép chữ thì để nó xử lý phím.
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      if (results.length) {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActive((active + step + results.length) % results.length);
      }
    } else if (event.key === 'Enter') {
      const tool = results[active];
      if (expanded && tool) {
        event.preventDefault();
        close();
        event.currentTarget.blur();
        navigate(`/${tool.slug}`);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (expanded) setOpen(false);
      else setQuery('');
    }
  };

  return (
    <search
      className="relative block w-full"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={id} className="sr-only">
        Tìm công cụ
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted"
      />
      <input
        id={id}
        data-search={variant}
        type="text"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && results[active] ? `${listId}-${active}` : undefined}
        aria-keyshortcuts="/"
        autoComplete="off"
        className={`input pr-12 pl-11 ${variant === 'hero' ? 'min-h-14 border-2 border-accent text-lg' : ''}`}
        placeholder={variant === 'hero' ? 'Ví dụ: phiếu toán lớp 2' : 'Tìm công cụ'}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {!query && (
        <kbd
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-line px-2 text-muted"
        >
          /
        </kbd>
      )}

      <p role="status" className="sr-only">
        {expanded ? `${results.length} gợi ý` : ''}
      </p>

      <div
        hidden={!expanded}
        className="absolute top-full right-0 left-0 z-40 mt-1 max-h-[60dvh] overflow-y-auto rounded-xl border border-line bg-surface text-left shadow-lg"
      >
        <ul id={listId} role="listbox" aria-label="Gợi ý công cụ">
          {results.map((tool, index) => (
            <li
              key={tool.slug}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
            >
              <Link
                to={`/${tool.slug}`}
                tabIndex={-1}
                className={`flex min-h-12 items-center gap-3 px-4 py-2 ${index === active ? 'bg-hover' : ''}`}
                onClick={close}
              >
                <tool.icon aria-hidden className="size-5 shrink-0 text-accent" />
                <span className="flex-1">{tool.name}</span>
                <span className="hidden text-muted sm:inline">
                  {formatGrades(tool.grades).join(', ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {results.length === 0 && (
          <div className="p-4">
            <p>Chưa có công cụ khớp “{query.trim()}”.</p>
            <Link to="/gioi-thieu#gop-y" className="link" onClick={close}>
              Đề xuất công cụ mới
            </Link>
          </div>
        )}
      </div>
    </search>
  );
}
