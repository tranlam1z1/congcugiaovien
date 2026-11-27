import { FontFields } from '@/components/CommonOptionFields';
import { COMMON_DEFAULTS } from '@/components/commonOptions';
import {
  CheckboxField,
  ColorField,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/fields';
import { ImageField } from '@/components/ImageField';
import { GRIDS, type Options } from './options';
import { MAX_BULK } from './qr';

type Props = {
  options: Options;
  onChange: (patch: Partial<Options>) => void;
};

function SingleFields({ options, onChange }: Props) {
  switch (options.type) {
    case 'link':
      return (
        <TextField
          label="Đường link"
          value={options.link}
          placeholder="truong.edu.vn/bai-tap"
          onChange={(link) => onChange({ link })}
        />
      );
    case 'text':
      return (
        <TextAreaField
          label="Văn bản"
          rows={5}
          value={options.text}
          onChange={(text) => onChange({ text })}
        />
      );
    case 'wifi':
      return (
        <>
          <TextField
            label="Tên mạng Wi-Fi"
            value={options.wifiName}
            onChange={(wifiName) => onChange({ wifiName })}
          />
          <SelectField
            label="Bảo mật"
            value={options.wifiSecurity}
            options={[
              { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
              { value: 'WEP', label: 'WEP' },
              { value: 'nopass', label: 'Không mật khẩu' },
            ]}
            onChange={(wifiSecurity) => onChange({ wifiSecurity })}
          />
          {options.wifiSecurity !== 'nopass' && (
            <TextField
              label="Mật khẩu"
              value={options.wifiPassword}
              hint="Ai quét được mã cũng vào được mạng. Mật khẩu chỉ lưu trên máy này."
              onChange={(wifiPassword) => onChange({ wifiPassword })}
            />
          )}
          <CheckboxField
            label="Mạng ẩn"
            checked={options.wifiHidden}
            onChange={(wifiHidden) => onChange({ wifiHidden })}
          />
        </>
      );
    case 'email':
      return (
        <>
          <TextField
            label="Địa chỉ email"
            value={options.email}
            onChange={(email) => onChange({ email })}
          />
          <TextField
            label="Tiêu đề thư"
            value={options.emailSubject}
            onChange={(emailSubject) => onChange({ emailSubject })}
          />
          <TextAreaField
            label="Nội dung thư"
            rows={3}
            value={options.emailBody}
            onChange={(emailBody) => onChange({ emailBody })}
          />
        </>
      );
    case 'phone':
      return (
        <TextField
          label="Số điện thoại"
          value={options.phone}
          onChange={(phone) => onChange({ phone })}
        />
      );
  }
}

export function ContentFields({ options, onChange, notice }: Props & { notice: string }) {
  return (
    <>
      <SelectField
        label="Số lượng"
        value={options.mode}
        options={[
          { value: 'single', label: 'Một mã' },
          { value: 'bulk', label: 'Nhiều mã, mỗi mã một nhãn' },
        ]}
        onChange={(mode) => onChange({ mode })}
      />
      {options.mode === 'single' ? (
        <>
          <SelectField
            label="Loại nội dung"
            value={options.type}
            options={[
              { value: 'link', label: 'Đường link' },
              { value: 'text', label: 'Văn bản' },
              { value: 'wifi', label: 'Wi-Fi' },
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Số điện thoại' },
            ]}
            onChange={(type) => onChange({ type })}
          />
          <SingleFields options={options} onChange={onChange} />
          <TextField
            label="Chữ dưới mã"
            value={options.label}
            onChange={(label) => onChange({ label })}
          />
        </>
      ) : (
        <TextAreaField
          label="Mỗi dòng: nhãn | nội dung"
          rows={8}
          value={options.bulk}
          placeholder={'Nguyễn An | truong.edu.vn/an\nTrần Bình | truong.edu.vn/binh'}
          hint={`Tối đa ${MAX_BULK} mã. Không có dấu | thì nội dung cũng là nhãn.`}
          onChange={(bulk) => onChange({ bulk })}
        />
      )}
      <p role="status" className="text-accent">
        {notice}
      </p>
    </>
  );
}

export function LookFields({
  options,
  onChange,
  warning,
}: Props & { warning: string | null }) {
  return (
    <>
      <div className="flex flex-wrap gap-4">
        <ColorField
          label="Màu mã"
          value={options.foreground}
          onChange={(foreground) => onChange({ foreground })}
        />
        <ColorField
          label="Màu nền"
          value={options.background}
          onChange={(background) => onChange({ background })}
        />
      </div>
      {warning && (
        <p role="status" className="text-accent">
          {warning}
        </p>
      )}
      <ImageField label="Chọn logo giữa mã" value={options.logo} onChange={(logo) => onChange({ logo })} />
      {options.logo ? (
        <p className="text-muted">Có logo nên dùng mức sửa lỗi cao nhất. Quét thử trước khi in.</p>
      ) : (
        <SelectField
          label="Mức sửa lỗi"
          value={options.level}
          options={[
            { value: 'L', label: 'Thấp (7%): mã thưa nhất' },
            { value: 'M', label: 'Vừa (15%)' },
            { value: 'Q', label: 'Khá (25%)' },
            { value: 'H', label: 'Cao (30%): chịu bẩn, rách tốt' },
          ]}
          onChange={(level) => onChange({ level })}
        />
      )}
    </>
  );
}

export function PrintFields({ options, onChange }: Props) {
  return (
    <>
      <SelectField
        label="Số mã mỗi trang"
        value={String(options.perPage)}
        options={Object.keys(GRIDS).map((n) => ({ value: n, label: `${n} mã` }))}
        onChange={(n) => onChange({ perPage: Number(n) })}
      />
      <CheckboxField
        label="Đường viền để cắt"
        checked={options.cutLines}
        onChange={(cutLines) => onChange({ cutLines })}
      />
      <TextField
        label="Tiêu đề trang"
        value={options.title}
        onChange={(title) => onChange({ title })}
      />
      <FontFields
        value={{ ...COMMON_DEFAULTS, font: options.font, largeText: options.largeText }}
        onChange={onChange}
      />
    </>
  );
}
