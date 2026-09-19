import { Body, Controller, Get, Headers, Inject, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { IdentityService } from "./identity.service.js";
import { AccessDto, ApprovalDto, RoleDto, UserListQueryDto } from "./auth.dto.js";

type RequestUser = { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" };
const revision = (value: string | undefined) => { if (!value) return undefined; const match = value.match(/^(?:W\/)?"?(\d+)"?$/); if (!match) throw new Error("REVISION_REQUIRED"); return Number(match[1]); };

@Controller("users")
export class UsersController {
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}
  @Get() list(@Req() request: { user: RequestUser }, @Query() query: UserListQueryDto) { return this.identity.listUsers(request.user, query).then((data) => ({ data })); }
  @Get("roles") roles(@Req() request: { user: RequestUser }) { return { data: this.identity.fixedRoles(request.user) }; }
  @Get(":id") detail(@Req() request: { user: RequestUser }, @Param("id") id: string) { return this.identity.getUser(request.user, id).then((data) => ({ data })); }
  @Post(":id/approval") approval(@Req() request: { user: RequestUser }, @Param("id") id: string, @Body() body: ApprovalDto, @Headers("if-match") ifMatch?: string) { return this.identity.setApproval(request.user, id, body.decision, revision(ifMatch)).then((data) => ({ data })); }
  @Patch(":id/access") access(@Req() request: { user: RequestUser }, @Param("id") id: string, @Body() body: AccessDto, @Headers("if-match") ifMatch?: string) { return this.identity.setAccess(request.user, id, body.disabled, revision(ifMatch)).then((data) => ({ data })); }
  @Patch(":id/role") role(@Req() request: { user: RequestUser }, @Param("id") id: string, @Body() body: RoleDto, @Headers("if-match") ifMatch?: string) { return this.identity.setRole(request.user, id, body.role, revision(ifMatch)).then((data) => ({ data })); }
}
