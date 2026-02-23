import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Email already in use.');
    }

    // OWASP recommends modern hashing like bcrypt/argon2 with proper cost.
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        // pass is optional; you can create FREE pass later if you want
      },
      select: { id: true, email: true, createdAt: true },
    });

    return this.issueToken(user.id, user.email);
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials.');

    return this.issueToken(user.id, user.email);
  }

  private async issueToken(userId: string, email: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        // You can configure these via JwtModule too. Keeping explicit is fine.
      },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
    };
  }
}
