import { SetMetadata } from "@nestjs/common";
export const IS_PUBLIC = "isPublic";
export const PublicRoute = () => SetMetadata(IS_PUBLIC, true);
