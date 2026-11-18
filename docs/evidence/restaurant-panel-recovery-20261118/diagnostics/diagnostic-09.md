# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: restaurant-panel-recovery.browser.ts >> shared editor remains mounted when its hours module fails
- Location: tests\browser\restaurant-panel-recovery.browser.ts:218:6

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator: locator('.management-mobile-nav')
Expected: attached
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeAttached" locator('.management-mobile-nav') with timeout 5000ms
  - waiting for locator('.management-mobile-nav')

```

```yaml
- link "Aller au contenu":
  - /url: "#main-content"
- main:
  - link "Accueil NIHILOBA":
    - /url: /fr
    - text: NIHILOBA
  - link "SHIDA Restaurants":
    - /url: /fr/shida/restaurants
  - button "Langue": FR
  - button "Mon compte SHIDA · Francis Mabala": FM
  - group:
    - region "Restaurants & Malewa":
      - complementary:
        - strong: Chez maman — Restaurant & Malewa de la commune de Limete
        - navigation "Restaurants & Malewa":
          - button "Aujourd’hui"
          - button "Vendre"
          - button "Commandes"
          - button "Mon menu"
          - button "Mon stock"
          - button "Réservations"
          - button "Finances"
          - button "Statistiques"
          - button "Avis clients"
          - button "Mon établissement"
      - button "Plein écran"
      - group: ⋮
      - status: Modifications non enregistrées
      - form "Horaires et fermetures":
        - heading "Horaires d’ouverture" [level=2]
        - paragraph: Enregistrez ou annulez cette modification avant de changer d’établissement.
        - group:
          - paragraph: "Heure du restaurant: Kinshasa"
          - text: Horaires connus
          - checkbox "Horaires connus" [checked]
          - button "Copier des horaires"
          - group "lundi":
            - strong: lundi
            - checkbox "Ouvert" [checked]
            - text: Ouvert Début
            - textbox "Début": 09:00
            - text: Fin
            - textbox "Fin": 17:00
            - button "Retirer · lundi 09:00–17:00": ×
            - button "+ Ajouter un autre horaire"
          - group "mardi":
            - strong: mardi
            - checkbox "Fermé"
            - text: Fermé
          - group "mercredi":
            - strong: mercredi
            - checkbox "Fermé"
            - text: Fermé
          - group "jeudi":
            - strong: jeudi
            - checkbox "Fermé"
            - text: Fermé
          - group "vendredi":
            - strong: vendredi
            - checkbox "Fermé"
            - text: Fermé
          - group "samedi":
            - strong: samedi
            - checkbox "Fermé"
            - text: Fermé
          - group "dimanche":
            - strong: dimanche
            - checkbox "Fermé"
            - text: Fermé
          - heading "Fermetures exceptionnelles" [level=3]
          - text: Début
          - textbox "Début": 2026-12-01T09:00
          - text: Fin
          - textbox "Fin"
          - button "Retirer"
          - button "Ajouter une fermeture"
        - button "Enregistrer les modifications"
        - button "Annuler la modification"
- alert
```

# Test source

```ts
  1  | import {managementCopy} from '../../app/lib/restaurant-management-copy';
  2  | import {sellerDesignCopy} from '../../app/lib/restaurant-seller-design-copy';
  3  | import {workspaceCopy} from '../../app/lib/restaurant-workspace-copy';
  4  | import {expect,type Page} from '@playwright/test';
  5  | export async function managementNavigation(page:Page,name:string){
  6  |  const locale=(Object.keys(managementCopy) as (keyof typeof managementCopy)[]).find(l=>[managementCopy[l].settings,sellerDesignCopy[l].hours,sellerDesignCopy[l].sharing].includes(name));
  7  |  if(locale){await managementNavigation(page,sellerDesignCopy[locale].profile);const label=name===managementCopy[locale].settings?workspaceCopy[locale].configuration:name===sellerDesignCopy[locale].hours?workspaceCopy[locale].hours:workspaceCopy[locale].sharing;await page.locator('.rst-local-tabs').getByRole('button',{name:label,exact:true}).click();return;}
  8  |  const profileLocale=(Object.keys(sellerDesignCopy) as (keyof typeof sellerDesignCopy)[]).find(l=>sellerDesignCopy[l].profile===name);if(profileLocale)name=workspaceCopy[profileLocale].establishment;
> 9  |  await expect(page.locator('.management-mobile-nav')).toBeAttached();
     |                                                       ^ Error: expect(locator).toBeAttached() failed
  10 |  if(await page.locator('.management-mobile-nav').isVisible()){
  11 |   const direct=page.locator('.management-mobile-nav').getByRole('button',{name,exact:true});
  12 |   if(await direct.count()){await direct.click();return;}
  13 |   await page.locator('.management-mobile-nav button').last().click();
  14 |   await page.locator('.management-more-sheet').getByRole('button',{name,exact:true}).click();return;
  15 |  }
  16 |  await expect(page.locator('#restaurant-navigation')).toBeAttached();
  17 |  const button=page.locator('#restaurant-navigation').getByRole('button',{name,exact:true,includeHidden:true});
  18 |  const group=page.locator('.rst-desktop-group').filter({has:page.getByRole('button',{name,exact:true,includeHidden:true})});
  19 |  if(await group.count()&&await group.getAttribute('open')===null)await group.locator('summary').click();
  20 |  await button.click();
  21 | }
  22 |
```
