import { ImagePlus, X } from 'lucide-react';
import { useState } from 'react';
import { readImageFile } from '@/core/image';

/** Chọn một ảnh nhỏ (logo). Ảnh được thu nhỏ và chỉ lưu trên máy. */
export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  /** Data URL, rỗng khi chưa chọn. */
  value: string;
  onChange: (value: string) => void;
}) {
  const [error, setError] = useState('');
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="btn cursor-pointer focus-within:outline-3 focus-within:outline-accent">
          <ImagePlus aria-hidden className="size-5" />
          {label}
          <input
            type="file"
            className="sr-only"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              try {
                setError('');
                onChange(await readImageFile(file));
              } catch {
                setError('Chưa mở được ảnh này. Chọn file PNG hoặc JPG khác.');
              }
            }}
          />
        </label>
        {value && (
          <>
            <img src={value} alt="Ảnh đã chọn" className="max-h-11 max-w-20 object-contain" />
            <button
              type="button"
              className="btn btn-icon"
              aria-label="Bỏ ảnh"
              title="Bỏ ảnh"
              onClick={() => onChange('')}
            >
              <X aria-hidden className="size-5" />
            </button>
          </>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
