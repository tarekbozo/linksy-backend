import { ConfigService } from '@nestjs/config';
import { Strategy as GooglePassportStrategy, VerifyCallback } from 'passport-google-oauth20';
import { Strategy as GitHubPassportStrategy } from 'passport-github2';
export type OAuthProfile = {
    provider: 'google' | 'github';
    providerAccountId: string;
    email: string;
    emailVerified: boolean;
};
declare const GoogleStrategy_base: new (...args: [options: import("passport-google-oauth20").StrategyOptionsWithRequest] | [options: import("passport-google-oauth20").StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptionsWithRequest]) => GooglePassportStrategy & {
    validate(...args: any[]): unknown;
};
export declare class GoogleStrategy extends GoogleStrategy_base {
    constructor(config: ConfigService);
    validate(_accessToken: string, _refreshToken: string, profile: any, done: VerifyCallback): void;
}
declare const GitHubStrategy_base: new (...args: [options: import("passport-github2").StrategyOptionsWithRequest] | [options: import("passport-github2").StrategyOptions]) => GitHubPassportStrategy & {
    validate(...args: any[]): unknown;
};
export declare class GitHubStrategy extends GitHubStrategy_base {
    constructor(config: ConfigService);
    validate(_accessToken: string, _refreshToken: string, profile: any, done: (err: unknown, user?: OAuthProfile) => void): void;
}
export {};
