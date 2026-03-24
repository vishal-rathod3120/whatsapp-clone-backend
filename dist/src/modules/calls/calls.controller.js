"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const calls_service_1 = require("./calls.service");
const turn_service_1 = require("../../integrations/turn/turn.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let CallsController = class CallsController {
    constructor(callsService, turnService) {
        this.callsService = callsService;
        this.turnService = turnService;
    }
    async getCalls(limit, cursor, user) {
        return this.callsService.getCallsByUser(user.sub, limit ? Number(limit) : 20, cursor);
    }
    async getCallById(callId, user) {
        return this.callsService.getCallById(callId, user.sub);
    }
    async getTurnCredentials() {
        const credentials = this.turnService.generateTurnCredentials();
        const servers = this.turnService.getTurnServers();
        return {
            iceServers: servers,
            ...credentials,
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
    }
};
exports.CallsController = CallsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get call history' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('cursor')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "getCalls", null);
__decorate([
    (0, common_1.Get)(':callId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get call details' }),
    __param(0, (0, common_1.Param)('callId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "getCallById", null);
__decorate([
    (0, common_1.Get)('turn-credentials'),
    (0, swagger_1.ApiOperation)({ summary: 'Get TURN server credentials for WebRTC' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "getTurnCredentials", null);
exports.CallsController = CallsController = __decorate([
    (0, swagger_1.ApiTags)('Calls'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('calls'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [calls_service_1.CallsService,
        turn_service_1.TurnService])
], CallsController);
//# sourceMappingURL=calls.controller.js.map