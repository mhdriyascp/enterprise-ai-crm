import bcrypt from 'bcryptjs';

// =============================================================================
// Password Service — hashing & verification (bcrypt).
// =============================================================================

export class PasswordService {
  constructor(private readonly rounds: number = 12) {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
