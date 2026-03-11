import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import {
  Strategy as GooglePassportStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as GitHubPassportStrategy } from "passport-github2";

export type OAuthProfile = {
  provider: "google" | "github";
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  GooglePassportStrategy,
  "google",
) {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("GOOGLE_CLIENT_ID")!,
      clientSecret: config.get<string>("GOOGLE_CLIENT_SECRET")!,
      callbackURL: config.get<string>("GOOGLE_CALLBACK_URL")!,
      scope: ["email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error("No email from Google"), undefined);

    done(null, {
      provider: "google",
      providerAccountId: String(profile.id),
      email,
      emailVerified: true,
    } satisfies OAuthProfile);
  }
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(
  GitHubPassportStrategy,
  "github",
) {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("GITHUB_CLIENT_ID")!,
      clientSecret: config.get<string>("GITHUB_CLIENT_SECRET")!,
      callbackURL: config.get<string>("GITHUB_CALLBACK_URL")!,
      scope: ["user:email"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: unknown, user?: OAuthProfile) => void,
  ) {
    const primaryEmail =
      profile.emails?.find((e: any) => e.primary) ?? profile.emails?.[0];
    const email = primaryEmail?.value;
    const emailVerified = Boolean(
      primaryEmail?.verified ?? profile?._json?.email_verified ?? false,
    );

    if (!email) return done(new Error("No email from GitHub"), undefined);

    done(null, {
      provider: "github",
      providerAccountId: String(profile.id),
      email,
      emailVerified,
    });
  }
}
