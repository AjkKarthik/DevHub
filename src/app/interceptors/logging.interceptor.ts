import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone the request to add a fake auth header
  const authReq = req.clone({
    setHeaders: { Authorization: 'Bearer demo-token-123' },
  });

  const started = Date.now();
  console.log(`[HTTP] ${authReq.method} ${authReq.url} — started`);

  return next(authReq).pipe(
    tap({
      next: () => {
        const elapsed = Date.now() - started;
        console.log(`[HTTP] ${authReq.method} ${authReq.url} — ${elapsed}ms`);
      },
      error: err => {
        console.error(`[HTTP] ${authReq.method} ${authReq.url} — ERROR`, err);
      },
    })
  );
};
