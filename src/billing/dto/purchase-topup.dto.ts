import { IsString } from "class-validator";

export class PurchaseTopUpDto {
  @IsString()
  topUpPackId!: string;
}
