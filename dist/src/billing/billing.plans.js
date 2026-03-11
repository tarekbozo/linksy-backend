"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAID_PLANS = exports.PLAN_CONFIG = void 0;
const client_1 = require("@prisma/client");
exports.PLAN_CONFIG = {
    FREE: {
        amountSYP: 0,
        durationDays: 30,
        tokenCap: 0,
        imageCap: 0,
        dailyTokenCap: 3000,
    },
    STARTER: {
        amountSYP: 125000,
        durationDays: 30,
        tokenCap: 400_000,
        imageCap: 0,
    },
    PRO: {
        amountSYP: 260000,
        durationDays: 30,
        tokenCap: 1_000_000,
        imageCap: 200,
    },
    ELITE: {
        amountSYP: 480000,
        durationDays: 30,
        tokenCap: 2_500_000,
        imageCap: 300,
    },
};
exports.PAID_PLANS = [client_1.Plan.STARTER, client_1.Plan.PRO, client_1.Plan.ELITE];
