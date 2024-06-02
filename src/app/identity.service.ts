import { Injectable } from '@angular/core';

const ID_KEY = 'QSTAR_APP_ID';

function generateUniqueId(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

@Injectable({
  providedIn: 'root'
})
export class IdentityService {

  private id: string | null = null;

  constructor() {
    if (!(ID_KEY in localStorage)) {
      localStorage[ID_KEY] = generateUniqueId();
    }
    this.id = localStorage[ID_KEY];
  }

  getId(): string { return this.id!; }
}
