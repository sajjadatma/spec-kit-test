import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
export class RegisterDto { @IsString() @MinLength(1) @MaxLength(100) displayName!: string; @IsEmail() email!: string; @IsString() @MinLength(12) @MaxLength(128) password!: string; @IsString() @MinLength(12) @MaxLength(128) passwordConfirmation!: string; @IsIn(["fa", "en"]) locale!: "fa" | "en"; }
export class ResetRequestDto { @IsEmail() email!: string; }
export class ResetPasswordDto { @IsString() token!: string; @IsString() @MinLength(12) @MaxLength(128) password!: string; @IsString() @MinLength(12) @MaxLength(128) passwordConfirmation!: string; }
export class LoginDto { @IsEmail() email!: string; @IsString() @MinLength(12) @MaxLength(128) password!: string; }
export class UpdatePreferencesDto { @IsIn(["fa", "en"]) locale!: "fa" | "en"; }
export class ApprovalDto { @IsIn(["APPROVED", "REJECTED"]) decision!: "APPROVED" | "REJECTED"; }
export class AccessDto { @IsBoolean() disabled!: boolean; }
export class RoleDto { @IsIn(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "USER"]) role!: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER"; }
export class UserListQueryDto { @IsOptional() @IsString() @MaxLength(100) q?: string; @IsOptional() @IsIn(["PENDING", "APPROVED", "REJECTED"]) approval?: "PENDING" | "APPROVED" | "REJECTED"; @IsOptional() @IsBoolean() disabled?: boolean; @IsOptional() @IsInt() @Min(1) page = 1; @IsOptional() @IsInt() @Min(1) @Max(100) pageSize = 20; }
