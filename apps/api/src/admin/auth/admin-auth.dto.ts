import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class AdminLoginDto {
  @ApiProperty({ example: "admin@example.ru" })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  password!: string;
}
