import { Injectable, OnModuleDestroy } from "@nestjs/common";
import {
  AuthenticationService,
  PasswordResetService,
  PrismaIdentityStore,
  RegistrationService,
  RateLimitService,
  SessionService,
  UserManagementService,
  ProductService,
  PricingService,
  UploadService,
  GalleryService,
  ProductQueryService,
  DraftService,
  AttemptService,
  AcceptAttemptService,
  HistoryService,
  DeleteSessionService,
  DashboardService,
  createPrismaClient,
  LocalStorageAdapter,
  StorageService,
  normalizeEmail,
  ResetMailCipher,
} from "@industrial-dashboard/backend";

@Injectable()
export class IdentityService implements OnModuleDestroy {
  private readonly prisma = createPrismaClient(process.env.DATABASE_URL ?? "postgresql://dashboard:dashboard@localhost:5432/industrial_dashboard");
  private readonly store = new PrismaIdentityStore(this.prisma);
  private readonly sessions = new SessionService(this.store);
  private readonly registration = new RegistrationService(this.store);
  private readonly authentication = new AuthenticationService(this.store, this.sessions);
  private readonly resets = new PasswordResetService(this.store);
  private readonly limits = new RateLimitService(this.store, process.env.TOKEN_HASH_SECRET ?? "");
  private readonly resetCipher = new ResetMailCipher();
  private readonly users = new UserManagementService(this.prisma);
  private readonly products = new ProductService(this.prisma);
  private readonly pricing = new PricingService(this.prisma);
  private readonly uploads = new UploadService(this.prisma);
  private readonly gallery = new GalleryService(this.prisma);
  private readonly productQuery = new ProductQueryService(this.prisma);
  private readonly storage = new StorageService(new LocalStorageAdapter(process.env.STORAGE_ROOT ?? "storage"));
  private readonly drafts = new DraftService(this.prisma);
  private readonly attempts = new AttemptService(this.prisma);
  private readonly acceptAttempts = new AcceptAttemptService(this.attempts);
  private readonly history = new HistoryService(this.prisma);
  private readonly deleteSessions = new DeleteSessionService(this.prisma);
  private readonly dashboardService = new DashboardService(this.prisma);

  register(displayName: string, email: string, password: string, locale: "fa" | "en") {
    return this.registration.register(displayName, email, password, locale);
  }

  login(email: string, password: string) {
    return this.authentication.login(normalizeEmail(email), password);
  }

  async requestPasswordReset(email: string) {
    const account = await this.store.findByNormalizedEmail(normalizeEmail(email));
    if (account) {
      const reset = await this.resets.issue(account.id);
      const resetUrl = new URL("/reset-password", process.env.WEB_ORIGIN ?? "http://localhost:3000");
      resetUrl.searchParams.set("token", reset.token);
      await this.store.queueResetEmail(reset.resetId, this.resetCipher.encrypt({ recipient: account.email, resetUrl: resetUrl.toString(), locale: account.locale }));
    }
  }

  consumePasswordReset(token: string, password: string) {
    return this.resets.consume(token, password);
  }

  refresh(refreshToken: string) {
    return this.sessions.rotate(refreshToken);
  }

  logout(sessionId: string) {
    return this.sessions.revoke(sessionId);
  }

  verifyAccessToken(token: string) {
    return this.sessions.verifyAccessToken(token);
  }

  async currentAccount(userId: string, sessionId?: string, tokenAuthVersion?: number) {
    const account = await this.store.findAccountSummary(userId);
    if (!account || account.approval !== "APPROVED" || account.disabledAt) throw new Error("SESSION_INVALID");
    if (sessionId) {
      const session = await this.store.findActiveSession(sessionId, userId);
      if (!session || session.authVersionAtIssue !== tokenAuthVersion || account.authVersion !== tokenAuthVersion) throw new Error("SESSION_INVALID");
    }
    return { id: account.id, displayName: account.displayName, email: account.email, role: account.role, approval: account.approval, disabled: false, locale: account.locale, revision: account.revision, createdAt: account.createdAt, capabilities: account.role === "SUPER_ADMIN" ? ["MANAGE_ROLES", "VIEW_ALL_HISTORY"] : [] };
  }

  async updatePreferences(userId: string, locale: "fa" | "en") {
    await this.store.updateLocale(userId, locale);
    return this.currentAccount(userId);
  }

  rateLimit(scope: "loginIp" | "loginAccount" | "registerIp" | "resetAccount" | "resetIp" | "resetConsumeIp" | "refreshSession", subject: string) {
    return this.limits.check(scope, subject);
  }

  listUsers(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }, query: Parameters<UserManagementService["list"]>[1]) { return this.users.list(actor, query); }
  getUser(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }, id: string) { return this.users.get(actor, id); }
  setApproval(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }, id: string, decision: "APPROVED" | "REJECTED", revision?: number) { return this.users.setApproval(actor, id, decision, revision); }
  setAccess(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }, id: string, disabled: boolean, revision?: number) { return this.users.setAccess(actor, id, disabled, revision); }
  setRole(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }, id: string, role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER", revision?: number) { return this.users.setRole(actor, id, role, revision); }
  fixedRoles(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }) { return this.users.fixedRoles(actor); }
  productsList(actor: never) { return this.products.list(actor); } productGet(actor: never, id: string) { return this.products.get(actor, id); } productCreate(actor: never, body: object) { return this.products.create(actor, body as Record<string, unknown>); } productUpdate(actor: never, id: string, body: object, revision?: number) { return this.products.update(actor, id, body as Record<string, unknown>, revision); } productArchive(actor: never, id: string, revision?: number) { return this.products.archive(actor, id, revision); } productRestore(actor: never, id: string, revision?: number) { return this.products.restore(actor, id, revision); } productRemove(actor: never, id: string, revision?: number) { return this.products.remove(actor, id, revision); }
  currentRate(){return this.pricing.current();} setRate(actor:{id:string;role:string},rate:string,revision:number){return this.pricing.set(actor.id,actor.role,rate,revision);}
  async upload(id:string,bytes:Buffer,type:string,width:number,height:number){const asset=await this.uploads.register(id,bytes,type,width,height);await this.storage.put(asset.storageKey,bytes);return asset} attachImage(productId:string,assetId:string,actorId:string){return this.gallery.attach(productId,assetId,actorId)} primaryImage(productId:string,imageId:string,actorId:string){return this.gallery.setPrimary(productId,imageId,actorId)} removeImage(productId:string,imageId:string,actorId:string){return this.gallery.remove(productId,imageId,actorId)}
  searchProducts(actor:never,query:object){return this.productQuery.search(actor,query as never)}
  dashboard(actor:{id:string;role:"SUPER_ADMIN"|"ADMIN"|"PRODUCT_MANAGER"|"USER"}){return this.dashboardService.summary(actor)}
  deleteVisualizationSession(actor:{id:string;role:"SUPER_ADMIN"|"ADMIN"|"PRODUCT_MANAGER"|"USER"},sessionId:string){return this.deleteSessions.delete(actor,sessionId)}
  listHistory(actor:{id:string;role:"SUPER_ADMIN"|"ADMIN"|"PRODUCT_MANAGER"|"USER"},query:object){return this.history.list(actor,query as never)}
  getDraft(id:string){return this.drafts.get(id)} saveDraft(id:string,input:object,revision:number){return this.drafts.save(id,input as never,revision)} discardDraft(id:string){return this.drafts.discard(id)}
  async attachRoomAsset(ownerId:string,assetId:string,revision:number){const asset=await this.prisma.fileAsset.findFirst({where:{id:assetId,creatorId:ownerId,status:"READY"}});if(!asset)throw new Error("RECORD_NOT_FOUND");const draft=await this.drafts.get(ownerId);return this.drafts.save(ownerId,{floorSelected:draft.floorSelected,wallSelected:draft.wallSelected,floorProductId:draft.floorProductId,wallProductId:draft.wallProductId,roomAssetId:assetId},revision)}
  async submitAttempt(id:string,consentVersion?:string){return this.acceptAttempts.accept({ownerId:id,draft:await this.drafts.get(id),consentVersion:consentVersion??""})} getAttempt(ownerId:string,id:string){return this.attempts.get(ownerId,id)}
  async submitAttemptIdempotent(ownerId:string, sessionId:string, key:string, consentVersion:string){
    const existing=await this.prisma.idempotencyReceipt.findUnique({where:{userId_operation_key:{userId:ownerId,operation:"visualization.submit",key}}});
    if(existing?.resourceId)return this.getAttempt(ownerId,existing.resourceId);
    const attempt=await this.submitAttempt(ownerId,consentVersion);
    try { await this.prisma.idempotencyReceipt.create({data:{userId:ownerId,authSessionId:sessionId,operation:"visualization.submit",key,payloadHash:consentVersion,resourceId:attempt.id}}); }
    catch { const receipt=await this.prisma.idempotencyReceipt.findUniqueOrThrow({where:{userId_operation_key:{userId:ownerId,operation:"visualization.submit",key}}}); if(receipt.resourceId)return this.getAttempt(ownerId,receipt.resourceId); throw new Error("IDEMPOTENCY_CONFLICT"); }
    return attempt;
  }
  async retryAttempt(ownerId:string,attemptId:string,consentVersion?:string){await this.attempts.get(ownerId,attemptId);return this.attempts.submit(ownerId,await this.drafts.get(ownerId),consentVersion)}
  async visualizationResult(ownerId:string,attemptId:string){const attempt=await this.prisma.generationAttempt.findFirst({where:{id:attemptId,ownerId}});if(!attempt||attempt.status!=="COMPLETED"||!attempt.resultStorageKey)throw new Error("RECORD_NOT_FOUND");return{body:await this.storage.get(attempt.resultStorageKey),mediaType:attempt.resultMediaType??"image/png"}}

  onModuleDestroy() {
    return this.prisma.$disconnect();
  }
}
