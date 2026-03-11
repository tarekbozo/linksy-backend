export declare class MeController {
    me(user: {
        id: string;
        email: string;
        role: string;
        onboarded: boolean;
    }): Promise<{
        id: string;
        email: string;
        role: string;
        onboarded: boolean;
    }>;
}
