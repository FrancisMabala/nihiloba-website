import config from './playwright.responsive-rollout.config';
const regression={...config,testMatch:['services-work-pilot.browser.ts','services-mobile-batches.browser.ts','management-mobile-layout.browser.ts','wenze-expenses-mobile.browser.ts','mobile-finance-four.browser.ts']};
export default regression;
