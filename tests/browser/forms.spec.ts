import sharp from "sharp";
import { test, expect } from "@playwright/test";

// All form requests and bot-provider scripts are intercepted: no email is sent.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/booking", route => route.fulfill({ status: 500, json: { error: "unexpected test request" } }));
  await page.route("**/api/waitlist", route => route.fulfill({ status: 500, json: { error: "unexpected test request" } }));
  await page.route("https://challenges.cloudflare.com/**", route => route.fulfill({ contentType: "application/javascript", body: `
    window.turnstile = {
      render(element, options) {
        const input = document.createElement('input');
        input.type='hidden'; input.name='cf-turnstile-response'; input.value='mock-token';
        element.appendChild(input); element.dataset.widget='ready'; options.callback('mock-token');
        return 'widget';
      },
      remove() { document.querySelectorAll('[name="cf-turnstile-response"]').forEach(e=>e.remove()); }
    };
  ` }));
});

for (const kind of ["booking", "waitlist"] as const) {
  test(`${kind}: validation, error recovery, verification reset, and success`, async ({ page }) => {
    await page.goto(`/${kind}`);
    await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue('mock-token');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(page.locator('a[href="/booking"],a[href="/waitlist"]')).toHaveCount(0);
    let sends=0;
    await page.route(`**/api/${kind}`, async route => {
      sends++;
      expect(route.request().postData()).toContain('mock-token');
      await route.fulfill(sends===1 ? {status:429,json:{error:'too many attempts. please wait before trying again.'}} : {json:{success:true,confirmationSent:true}});
    });
    await page.locator('button[type="submit"]').click();
    expect(sends).toBe(0);
    const values: Record<string,string> = {name:'Browser Test',email:'browser@example.com',instagram:'@browser'};
    if(kind==='booking') Object.assign(values,{placement:'upper arm',size:'4 inches',design:'Flowers',budget:'600–800',availability:'November'});
    else {
      await page.route("**/api/locations?*",route=>route.fulfill({json:{locations:[{id:"2643743",name:"London",region:"England",country:"United Kingdom"}]}}));
      await page.getByRole('combobox').fill('London');
      await page.getByRole('option',{name:'London, England, United Kingdom'}).click();
    }
    for(const [name,value] of Object.entries(values)) await page.locator(`input[name="${name}"],textarea[name="${name}"]`).fill(value);
    if(kind==='booking') {
      await page.locator('input[type="file"]').setInputFiles({name:'reference.png',mimeType:'image/png',buffer:await sharp({create:{width:20,height:20,channels:3,background:'white'}}).png().toBuffer()});
      await expect(page.getByText('1 of 10 photos attached')).toBeVisible();
      await page.getByRole('button',{name:/remove reference/}).click();
      await expect(page.getByText('0 of 10 photos attached')).toBeVisible();
    }
    for(const check of await page.locator('input[type="checkbox"]').all()) await check.check();
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('form').getByRole('alert')).toContainText('too many attempts');
    await expect(page.locator('input[name="name"]')).toHaveValue('Browser Test');
    await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue('mock-token');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByRole('status').filter({hasText:kind==='booking'?"in esther's inbox":'worldwide waitlist'})).toBeVisible();
    await expect(page.locator('input[name="name"]')).toHaveValue('');
    expect(sends).toBe(2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  });
}

test('public navigation and contact photo',async({page})=>{
  await page.goto('/');await expect(page).toHaveURL(/\/home$/);
  for(const path of ['home','about','works','ink','contact']) {
    await page.goto('/'+path);
    await expect(page.locator('a[href="/booking"],a[href="/waitlist"]')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  }
  await expect(page.locator('a[href="mailto:3ndsofth33arth@gmail.com"]')).toBeVisible();
  const photo=page.getByAltText(/tattoo studio/);await photo.scrollIntoViewIfNeeded();
  await expect.poll(()=>photo.evaluate((i:HTMLImageElement)=>i.naturalWidth)).toBe(5712);
});
