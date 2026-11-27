/** Các việc giao cho Web Worker và tin nhắn trả về. */
import type { ImageSettings, PageRef } from './pdfOps';

export type Job =
  | { kind: 'images'; files: File[]; rotations: number[]; settings: ImageSettings }
  /** `pages` bỏ trống: lấy mọi trang của mọi file theo thứ tự. */
  | { kind: 'assemble'; files: File[]; pages?: PageRef[]; name: string }
  | { kind: 'split'; file: File; groups: number[][] };

export type Output = { name: string; type: string; data: Uint8Array };

export type Message =
  | { type: 'progress'; done: number; total: number }
  | { type: 'done'; output: Output }
  | { type: 'error'; message: string };
