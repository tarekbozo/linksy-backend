import { IsOptional, IsString } from "class-validator";

export class ConfirmOrderDto {
  /**
   * Optional note/reference (e.g., payment receipt id).
   */
  @IsOptional()
  @IsString()
  reference?: string;
}
