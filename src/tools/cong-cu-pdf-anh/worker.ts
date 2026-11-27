/** Xử lý file ngoài luồng giao diện. File không rời khỏi máy. */
import { createZip } from '@/core/zip';
import type { Job, Message, Output } from './jobs';
import {
  allPages,
  assemble,
  imagesToPdf,
  jpegOrientation,
  loadSource,
  ToolError,
  type ImageInput,
  type Progress,
} from './pdfOps';
import { baseName, groupName, uniqueNames } from './ranges';

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<Job>) => void) | null;
  postMessage: (message: Message, transfer?: Transferable[]) => void;
};

const PDF = 'application/pdf';

const read = async (file: File) => {
  try {
    return await file.arrayBuffer();
  } catch {
    throw new ToolError(`Không mở được “${file.name}”. File có thể đã bị xoá hoặc đổi chỗ.`);
  }
};

const load = async (file: File) => loadSource({ name: file.name, data: await read(file) });

/** JPEG đúng chiều và PNG đưa thẳng vào PDF; loại khác (kể cả ảnh cần xoay) thì vẽ lại. */
async function prepareImage(file: File, rotation: number): Promise<ImageInput> {
  const data = new Uint8Array(await read(file));
  const png = data[0] === 0x89 && data[1] === 0x50;
  const jpg = data[0] === 0xff && data[1] === 0xd8;
  if (png) return { name: file.name, data, type: 'png', rotation };
  if (jpg && jpegOrientation(data) === 1) return { name: file.name, data, type: 'jpg', rotation };
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
    bitmap.close();
    // Ảnh chụp giữ dạng JPEG cho nhẹ, loại khác giữ nền trong suốt.
    const type = jpg ? 'image/jpeg' : 'image/png';
    const blob = await canvas.convertToBlob({ type, quality: 0.92 });
    return {
      name: file.name,
      data: new Uint8Array(await blob.arrayBuffer()),
      type: jpg ? 'jpg' : 'png',
      rotation,
    };
  } catch {
    throw new ToolError(`Không đọc được ảnh “${file.name}”. Hãy dùng ảnh JPG hoặc PNG.`);
  }
}

async function run(job: Job, progress: Progress): Promise<Output> {
  if (job.kind === 'images') {
    const data = await imagesToPdf(
      job.files.length,
      (i) => prepareImage(job.files[i]!, job.rotations[i] ?? 0),
      job.settings,
      progress,
    );
    return { name: 'anh.pdf', type: PDF, data };
  }

  if (job.kind === 'assemble') {
    const documents = [];
    for (const [i, file] of job.files.entries()) {
      documents.push(await load(file));
      // Ghép cả file thì tiến độ đếm theo file, vì đọc file là phần lâu nhất.
      if (!job.pages) progress(i + 1, job.files.length + 1);
    }
    const data = await assemble(
      documents,
      job.pages ?? allPages(documents),
      job.pages ? progress : undefined,
    );
    return { name: job.name, type: PDF, data };
  }

  const document = await load(job.file);
  const base = baseName(job.file.name);
  const names = uniqueNames(job.groups.map((group) => `${base}-${groupName(group)}.pdf`));
  const files = [];
  for (const [i, group] of job.groups.entries()) {
    const data = await assemble(
      [document],
      group.map((page) => ({ source: 0, page, rotation: 0 })),
    );
    files.push({ name: names[i]!, data });
    progress(i + 1, job.groups.length);
  }
  return files.length === 1
    ? { ...files[0]!, type: PDF }
    : { name: `${base}-tach.zip`, type: 'application/zip', data: createZip(files) };
}

scope.onmessage = async ({ data: job }) => {
  try {
    const output = await run(job, (done, total) =>
      scope.postMessage({ type: 'progress', done, total }),
    );
    scope.postMessage({ type: 'done', output }, [output.data.buffer]);
  } catch (error) {
    console.error(error);
    scope.postMessage({
      type: 'error',
      message:
        error instanceof ToolError
          ? error.message
          : 'Chưa xử lý được. File có thể quá lớn so với máy; thử chia thành nhiều lượt.',
    });
  }
};
