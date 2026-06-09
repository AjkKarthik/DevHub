import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn = signal(false);

  readonly isLoggedIn = this._isLoggedIn.asReadonly();
  readonly user = computed(() =>
    this._isLoggedIn() ? { name: 'Karthik', role: 'admin' } : null
  );

  login()  { this._isLoggedIn.set(true); }
  logout() { this._isLoggedIn.set(false); }
}
