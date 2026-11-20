// Mocked response-ordering coverage. Run only on the coordinator's accepted local server.
import {test, expect, type Page, type Route} from '@playwright/test';
import {medaCopy} from '../../app/lib/meda-copy';
import {medaDiscoveryCopy} from '../../app/lib/meda-discovery-copy';

const listing={reference:'MED_race',status:'published',title:'Synthetic books to Kinshasa',side:'offer',category:'luggage',origin_country:'FR',origin_city:'Paris',destination_country:'CD',destination_city:'Kinshasa',departure_at:'2027-02-20T14:00:00Z',deadline_at:'2027-02-19T14:00:00Z',capacity:'10',unit:'kg',description:'Synthetic objects',price:null,currency:null,price_basis:'discuss'};
const message=(id:number,body=`Synthetic message ${id}`)=>({reference:`MEM_${id}`,body,mine:false,created_at:new Date(Date.UTC(2026,10,20,12,0,id)).toISOString()});
const initial=(reference='MEQ_A')=>({reference,revision:1,status:'open',listing,role:'owner',participant_label:reference==='MEQ_A'?'Synthetic sender A':'Synthetic sender B',can_reply:true,unread:0,messages:[message(50)],older:'MEM_50'});

async function fixtures(page:Page){
  let current=initial(),reads=0,hold=false,pending:Route|null=null;
  await page.context().route('**/*',route=>['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort('blockedbyclient'));
  await page.route('**/api/shida/**',async route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');
    if(path.endsWith('/employment/session'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Synthetic member'}}});
    if(path.endsWith('/security/navigation'))return route.fulfill({json:{can_manage:false,markets:[],organization_management:false}});
    if(path.includes('/notifications'))return route.fulfill({json:path.endsWith('count')?{count:0,unread:0}:{items:[]}});
    if(path.endsWith('/meda/enquiries'))return route.fulfill({json:{items:[initial(),initial('MEQ_B')],page:1,has_more:false}});
    if(path.endsWith('/MEQ_A/messages')){current={...current,revision:2,messages:[message(50),message(51,String(req.postDataJSON().body))]};return route.fulfill({json:current});}
    if(path.endsWith('/MEQ_A')&&url.searchParams.has('before'))return route.fulfill({json:{...initial(),messages:[message(1,'Earlier loaded history')],older:null}});
    if(path.endsWith('/MEQ_A')){reads++;if(hold){pending=route;return;}return route.fulfill({json:current});}
    if(path.endsWith('/MEQ_B'))return route.fulfill({json:initial('MEQ_B')});
    if(path.endsWith('/read'))return route.fulfill({json:{ok:true}});
    return route.fulfill({status:404,json:{}});
  });
  return {hold:()=>{hold=true;},pending:()=>pending,reads:()=>reads,release:async()=>{hold=false;await pending?.fulfill({json:initial()});pending=null;}};
}

for(const width of [390,1440])test(`Meda preserves loaded history and a new reply after a delayed refresh ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.clock.install();const state=await fixtures(page);
  await page.goto('/fr/shida/space/?view=messages&market=meda&meda_view=conversation&ref=MEQ_A');
  const conversation=page.locator('.meda-conversation');await expect(conversation).toBeVisible();
  await expect(conversation.getByRole('heading',{name:listing.title,exact:true})).toBeVisible();
  await expect(conversation.locator('header')).toContainText('Synthetic sender A');
  await conversation.getByRole('button',{name:medaCopy.fr.older,exact:true}).click();
  await expect(conversation).toContainText('Earlier loaded history');
  state.hold();await page.clock.fastForward(15001);await expect.poll(()=>Boolean(state.pending())).toBe(true);
  await conversation.getByRole('textbox',{name:medaCopy.fr.message,exact:true}).fill('Latest reply stays visible');
  await conversation.getByRole('button',{name:medaCopy.fr.reply,exact:true}).click();
  await expect(conversation).toContainText('Latest reply stays visible');await state.release();
  await expect(conversation).toContainText('Earlier loaded history');await expect(conversation).toContainText('Latest reply stays visible');
  await expect(conversation.locator('.meda-messages > li')).toHaveCount(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('Meda ignores a delayed response for a different selected sender',async({page})=>{
  await page.clock.install();const state=await fixtures(page);
  await page.goto('/shida/space/?view=messages&market=meda&meda_view=conversation&ref=MEQ_A');
  await expect(page.locator('.meda-conversation header')).toContainText('Synthetic sender A');
  state.hold();await page.clock.fastForward(15001);await expect.poll(()=>Boolean(state.pending())).toBe(true);
  await page.locator('.meda-conversation').getByRole('button',{name:medaDiscoveryCopy.en.backMessages,exact:true}).click();
  await page.locator('.meda-card').filter({hasText:'Synthetic sender B'}).getByRole('button',{name:medaCopy.en.details,exact:true}).click();
  await expect(page.locator('.meda-conversation header')).toContainText('Synthetic sender B');await state.release();
  await expect(page.locator('.meda-conversation header')).toContainText('Synthetic sender B');
  await expect(page.locator('.meda-conversation header')).not.toContainText('Synthetic sender A');
});
