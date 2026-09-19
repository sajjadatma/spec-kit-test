import { IsEmail, IsIn, IsString, MaxLength, MinLength } from "class-validator";
export class RegisterDto { @IsString() @MinLength(1) @MaxLength(100) displayName!: string; @IsEmail() email!: string; @IsString() @MinLength(12) @MaxLength(128) password!: string; @IsString() @MinLength(12) @MaxLength(128) passwordConfirmation!: string; @IsIn(["fa", "en"]) locale!: "fa" | "en"; }
export class ResetRequestDto { @IsEmail() email!: string; }
export class ResetPasswordDto { @IsString() token!: string; @IsString() @MinLength(12) @MaxLength(128) password!: string; @IsString() @MinLength(12) @MaxLength(128) passwordConfirmation!: string; }
export class LoginDto { @IsEmail() email!: string; @IsString() @MinLength(12) @MaxLength(128) password!: string; }
export class UpdatePreferencesDto { @IsIn(["fa", "en"]) locale!: "fa" | "en"; }
