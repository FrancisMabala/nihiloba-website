import type {Page} from '@playwright/test';

export async function signInReader(page:Page) {
  await page.context().addCookies([{name:'nihiloba_personal_session',value:'isolated-job-test-session',domain:'127.0.0.1',path:'/api/shida',httpOnly:true}]);
  await page.route('**/api/shida/employment/session/',route=>route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Candidate'}}}));
}
