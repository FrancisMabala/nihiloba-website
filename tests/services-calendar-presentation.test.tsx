import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {expect,it} from "vitest";
import {ShidaCalendar} from "../app/components/shida/shida-calendar";
import {serviceCalendarLabel} from "../app/lib/services-calendar-labels";
import categories from "../app/lib/services-category-experience.json";

it("places the Services day agenda first without changing other marketplace calendars",()=>{
 const props={locale:"en" as const,timeZone:"Africa/Kinshasa",month:"2030-01",selected:"2030-01-01",events:[],onMonthChange:()=>{},onSelect:()=>{}};
 const services=renderToStaticMarkup(<ShidaCalendar {...props} agendaFirst agendaLabel="Lessons"/>);
 const defaultCalendar=renderToStaticMarkup(<ShidaCalendar {...props}/>);
 expect(services.indexOf('class="shida-cal-agenda"')).toBeLessThan(services.indexOf('class="shida-cal-grid"'));
 expect(defaultCalendar.indexOf('class="shida-cal-grid"')).toBeLessThan(defaultCalendar.indexOf('class="shida-cal-agenda"'));
 expect(services).toContain("Lessons");expect(services).toContain("Nothing scheduled for this day.");
 const dateOnly=renderToStaticMarkup(<ShidaCalendar {...props} dateOnly agendaFirst/>);
 expect(dateOnly).not.toContain('class="shida-cal-agenda"');
});
it.each(["en","fr","ln","sw"] as const)("names all seven category schedules in %s without enabling unsupported categories",locale=>{
 for(const category of Object.keys(categories.categories))expect(serviceCalendarLabel(category,locale)).toBeTruthy();
 expect(serviceCalendarLabel("health",locale)).toBeUndefined();
 expect(serviceCalendarLabel(undefined,locale)).toBeUndefined();
 expect(serviceCalendarLabel("__proto__",locale)).toBeUndefined();
});
