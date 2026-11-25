import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {expect,it} from "vitest";
import {RegistrationLocation} from "../app/components/shida/registration-location";
import {residenceCopy} from "../app/lib/registration/residence-copy";
import {ServicesProfessionalProfile} from "../app/components/shida/services-professional-profile";

it.each(["fr","en","ln","sw"] as const)("separates workplace and residence wording while keeping country/city requirements in %s",locale=>{
 const props={values:{country_code:"SE",city:"Stockholm"},onChange:()=>{},locale,prefix:"workplace",required:true};
 const workplace=renderToStaticMarkup(<RegistrationLocation {...props} context="workplace"/>);
 const residence=renderToStaticMarkup(<RegistrationLocation {...props}/>);
 expect(residence).toContain(residenceCopy[locale].country);expect(residence).toContain(residenceCopy[locale].city);
 expect(workplace).not.toContain(residenceCopy[locale].country);expect(workplace).not.toContain(residenceCopy[locale].city);
 expect(workplace).toContain('id="workplace-country_code"');expect(workplace).toContain('id="workplace-city"');
 expect(workplace.match(/required=""/g)).toHaveLength(2);
 expect(workplace).not.toContain('name="public_address"');
});
it("labels legacy profile coverage as service areas and exposes the existing services destination",()=>{
 const html=renderToStaticMarkup(<ServicesProfessionalProfile profile={{name:"Cabinet Horizon",bio:"",photo:null,social_link:null}} locale="fr" providerRef="SVI_demo" publicAvailable={false} area="Limete, Lemba, Matete" busy={false} onSave={async()=>true} linkLabel="Site" onServices={()=>{}}/>);
 expect(html).toContain("Zones de service");expect(html).toContain("Limete, Lemba, Matete");expect(html).toContain("Définies dans Mes services");expect(html).not.toContain("Pays de résidence");
});
