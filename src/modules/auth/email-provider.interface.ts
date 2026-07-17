<<<<<<< HEAD
=======
export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';

>>>>>>> f8bdf42 (a lot of work compiled and done under pressure)
export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(options: EmailSendOptions): Promise<boolean>;
}
