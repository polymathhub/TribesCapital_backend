export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';

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
