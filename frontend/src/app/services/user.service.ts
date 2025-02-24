import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root', 
})
export class UserService {
  
  private nicknameSource = new BehaviorSubject<string>(''); 
  nickname$ = this.nicknameSource.asObservable(); 

  
  updateNickname(newNickname: string) {
    this.nicknameSource.next(newNickname);
  }
  updateBio(newBio: string) {
    this.nicknameSource.next(newBio);
  }
}
