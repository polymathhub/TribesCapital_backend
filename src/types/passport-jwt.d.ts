declare module 'passport-jwt' {
  export interface VerifyCallback {
    (err: Error | null, user?: any, info?: any): void;
  }

  export interface StrategyOptions {
    secretOrKey?: string | Buffer;
    secretOrKeyProvider?: (request: any, rawJwtToken: string, done: (err: Error | null, secret?: string | Buffer) => void) => void;
    jwtFromRequest: (request: any) => string | null;
    audience?: string;
    issuer?: string;
    algorithms?: string[];
    ignoreExpiration?: boolean;
    passReqToCallback?: boolean;
    jsonWebTokenOptions?: any;
  }

  export class Strategy {
    constructor(options: StrategyOptions, verify: (payload: any, done: VerifyCallback) => void);
    name: string;
  }

  export function ExtractJwt(options: any): (request: any) => string | null;
  export namespace ExtractJwt {
    function fromHeader(header_name: string): (request: any) => string | null;
    function fromBodyField(field_name: string): (request: any) => string | null;
    function fromUrlQueryParameter(param_name: string): (request: any) => string | null;
    function fromAuthHeaderAsBearerToken(): (request: any) => string | null;
    function fromExtractors(extractors: Array<(request: any) => string | null>): (request: any) => string | null;
  }
}
