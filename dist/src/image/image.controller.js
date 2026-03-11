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
exports.ImageController = exports.GenerateImageDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const image_service_1 = require("./image.service");
const decorators_1 = require("../auth/decorators");
class GenerateImageDto {
    prompt;
    aspectRatio;
}
exports.GenerateImageDto = GenerateImageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateImageDto.prototype, "prompt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['1:1', '16:9', '9:16', '4:3']),
    __metadata("design:type", String)
], GenerateImageDto.prototype, "aspectRatio", void 0);
let ImageController = class ImageController {
    imageService;
    constructor(imageService) {
        this.imageService = imageService;
    }
    generate(user, body) {
        return this.imageService.generate(user.id, body.prompt, body.aspectRatio ?? '1:1');
    }
    status(user) {
        return this.imageService.getStatus(user.id);
    }
    history(user) {
        return this.imageService.getHistory(user.id);
    }
};
exports.ImageController = ImageController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, GenerateImageDto]),
    __metadata("design:returntype", void 0)
], ImageController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImageController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImageController.prototype, "history", null);
exports.ImageController = ImageController = __decorate([
    (0, common_1.Controller)('image'),
    __metadata("design:paramtypes", [image_service_1.ImageService])
], ImageController);
//# sourceMappingURL=image.controller.js.map