interface PassActivatedEmailProps {
    plan: string;
    endsAt: string;
    dashboardUrl: string;
}
export declare function passActivatedEmailHtml({ plan, endsAt, dashboardUrl, }: PassActivatedEmailProps): string;
export declare function passActivatedEmailText({ plan, endsAt, dashboardUrl, }: PassActivatedEmailProps): string;
export {};
