"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAgent = exports.IpAddress = exports.CurrentUser = exports.Public = exports.IS_PUBLIC_KEY = exports.Roles = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
exports.CurrentUser = (0, common_1.createParamDecorator)((_, ctx) => {
    return ctx.switchToHttp().getRequest().user;
});
exports.IpAddress = (0, common_1.createParamDecorator)((_, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string')
        return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress ?? 'unknown';
});
exports.UserAgent = (0, common_1.createParamDecorator)((_, ctx) => {
    return ctx.switchToHttp().getRequest().headers['user-agent'] ?? 'unknown';
});
//# sourceMappingURL=decorators.js.map