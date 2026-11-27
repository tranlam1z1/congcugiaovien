import { Writable } from 'node:stream';
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { App } from './app/App';

export { publicPaths, seoFor } from './core/seo';

/** Dựng HTML của một đường dẫn, đợi cả các công cụ tải bằng React.lazy. */
export function render(url: string) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const sink = new Writable({
      write(chunk, _encoding, done) {
        chunks.push(Buffer.from(chunk));
        done();
      },
      final(done) {
        resolve(Buffer.concat(chunks).toString('utf8'));
        done();
      },
    });
    const stream = renderToPipeableStream(
      <StrictMode>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </StrictMode>,
      {
        // Không để React chia HTML thành nhiều mảnh chèn bằng script.
        progressiveChunkSize: Infinity,
        onAllReady: () => stream.pipe(sink),
        onError: reject,
      },
    );
  });
}
