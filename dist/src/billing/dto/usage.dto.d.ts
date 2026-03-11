import { UsageType } from '@prisma/client';
export declare class UsageCheckDto {
    type: UsageType;
    tokens: number;
    images?: number;
    model?: string;
}
