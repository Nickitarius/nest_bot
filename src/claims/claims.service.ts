import { Injectable } from '@nestjs/common';

@Injectable()
export class ClaimsService {
  echo(text: string): string {
    return `Echo: ${text}`;
  }
}
