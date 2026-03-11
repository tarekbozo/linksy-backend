"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsrfMiddleware = void 0;
exports.issueCsrfToken = issueCsrfToken;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const cookie_config_1 = require("../../auth/cookie.config");
let CsrfMiddleware = class CsrfMiddleware {
    SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
    use(req, _res, next) {
        if (this.SAFE_METHODS.has(req.method)) {
            return next();
        }
        if (req.path.includes('/callback') || req.path.endsWith('/auth/magic/verify')) {
            return next();
        }
        const cookieToken = req.cookies?.[cookie_config_1.CSRF_COOKIE_NAME];
        const headerToken = req.headers[cookie_config_1.CSRF_HEADER_NAME];
        if (!cookieToken || !headerToken) {
            throw new common_1.ForbiddenException('Invalid CSRF token.');
        }
        const cookieBuffer = Buffer.from(cookieToken);
        const headerBuffer = Buffer.from(headerToken);
        if (cookieBuffer.length !== headerBuffer.length || !(0, crypto_1.timingSafeEqual)(cookieBuffer, headerBuffer)) {
            throw new common_1.ForbiddenException('Invalid CSRF token.');
        }
        next();
    }
};
exports.CsrfMiddleware = CsrfMiddleware;
exports.CsrfMiddleware = CsrfMiddleware = __decorate([
    (0, common_1.Injectable)()
], CsrfMiddleware);
function issueCsrfToken(res) {
    const token = (0, crypto_1.randomBytes)(32).toString('hex');
    res.cookie(cookie_config_1.CSRF_COOKIE_NAME, token, (0, cookie_config_1.buildCsrfCookieOptions)());
    return token;
}
//# sourceMappingURL=csrf.middleware.js.map