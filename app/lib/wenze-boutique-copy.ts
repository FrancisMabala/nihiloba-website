import type {WenzeLocale} from './wenze-copy';
const copy:Record<string,string[]>={
created:['Your shop has been created','Votre boutique a été créée','Butiki na yo esalemi','Duka lako limefunguliwa'],
manage:['Manage my shop','Gérer ma boutique','Tambwisa butiki na ngai','Simamia duka langu'],
addProduct:['Add a product','Ajouter un produit','Bakisa eloko','Ongeza bidhaa'],
createdHelp:['Your settings are saved. Add products and a shop photo in management.','Vos réglages sont enregistrés. Ajoutez des produits et une photo dans la gestion de votre boutique.','Maponi ebombami. Bakisa biloko mpe foto na gestion ya butiki.','Mipangilio imehifadhiwa. Ongeza bidhaa na picha katika usimamizi wa duka.'],
title:['Create my Wenze shop','Créer ma boutique Wenze','Fungola butiki na ngai Wenze','Fungua duka langu Wenze'],
intro:['A few details and your shop is ready.','Quelques informations et votre boutique est prête.','Makambo moke mpe butiki ebongami.','Taarifa chache na duka lako liko tayari.'],
welcome:['Open my shop on Wenze','Ouvrir ma boutique sur Wenze','Fungola butiki na Wenze','Fungua duka kwenye Wenze'],
benefit:['Sell your products, reach customers and manage your sales on SHIDA.','Vendez vos produits, développez votre clientèle et gérez vos ventes sur SHIDA.','Teka biloko, zwa bakiliya mpe tambwisa mombongo na SHIDA.','Uza bidhaa, pata wateja na simamia mauzo kwenye SHIDA.'],
identity:['My shop','Ma boutique','Butiki na ngai','Duka langu'],
selling:['Sales & delivery','Vente et livraison','Koteka mpe kotinda','Mauzo na uwasilishaji'],
review:['Review & create','Vérifier et créer','Tala mpe fungola','Kagua na fungua'],
name:['Shop name','Nom de la boutique','Nkombo ya butiki','Jina la duka'],
nameHelp:['The name customers will see on SHIDA.','C’est le nom que les clients verront sur SHIDA.','Nkombo oyo bakiliya bakomona na SHIDA.','Jina ambalo wateja wataona kwenye SHIDA.'],
category:['What do you mainly sell?','Que vendez-vous principalement ?','Otekaka nini mingi?','Unauza nini hasa?'],
description:['Introduce your shop (optional)','Présentez votre boutique (facultatif)','Limbola butiki (soki olingi)','Eleza duka lako (hiari)'],
later:['Configure ordering later in My Shop','Configurer les commandes plus tard dans Ma boutique','Bongisa ba commande sima na Butiki na ngai','Sanidi maagizo baadaye kwenye Duka langu'],
saved:['These settings will also be available in My Shop.','Ces réglages seront disponibles dans Ma boutique.','Maponi oyo ekozala na Butiki na ngai.','Mipangilio hii itapatikana kwenye Duka langu.'],
consent:['I agree to display this pickup address publicly.','J’accepte d’afficher cette adresse de retrait publiquement.','Nandimi komonisa adresse ya kozwa biloko na bato nyonso.','Nakubali kuonyesha anwani hii ya kuchukua bidhaa hadharani.'],
next:['Continue','Continuer','Koba','Endelea'],
back:['Back','Retour','Zonga','Rudi'],
create:['Create my shop','Créer ma boutique','Fungola butiki na ngai','Fungua duka langu'],
optional:['Optional','Facultatif','Soki olingi','Hiari'],
choose:['Choose a category','Choisir une catégorie','Pona catégorie','Chagua aina'],
external:['External Mobile Money','Mobile Money externe','Mobile Money libanda ya SHIDA','Mobile Money nje ya SHIDA'],
reviewHelp:['Check these details before creating your shop. You can update them in My Shop.','Vérifiez ces informations avant de créer votre boutique. Vous pourrez les modifier dans Ma boutique.','Tala makambo oyo liboso ya kofungola. Okoki kobongola yango na Butiki na ngai.','Kagua taarifa kabla ya kufungua duka. Unaweza kuzibadili kwenye Duka langu.'],
zonesHelp:['One delivery area per line','Une zone de livraison par ligne','Esika moko ya kotinda na ligne moko','Eneo moja la uwasilishaji kwa kila mstari'],
};
export const boutiqueText=(locale:WenzeLocale,key:string)=>copy[key]?.[['en','fr','ln','sw'].indexOf(locale)]??key;

export function boutiquePayload(f:Record<string,string>){
 const configured=f.configure==='yes';
 return {publication_ref:f.publication_ref,name:f.name.trim(),category:f.category,city:f.city.trim(),commune:f.commune?.trim()||null,description:f.description?.trim()||null,
  store_type:f.store_type||null,fulfillment_mode:configured?f.fulfillment_mode:null,
  address:configured&&f.fulfillment_mode!=='delivery'?f.address?.trim()||null:null,
  landmark:configured&&f.fulfillment_mode!=='delivery'?f.landmark?.trim()||null:null,
  delivery_fee_type:configured&&f.fulfillment_mode!=='pickup'?f.delivery_fee_type:null,
  delivery_fee:configured&&f.fulfillment_mode!=='pickup'&&f.delivery_fee_type==='fixed'?f.delivery_fee?.replace(',','.')||null:null,
  delivery_currency:configured&&f.fulfillment_mode!=='pickup'&&f.delivery_fee_type==='fixed'?f.delivery_currency||'CDF':null,
  delivery_areas:configured&&f.fulfillment_mode!=='pickup'?(f.delivery_areas||'').split('\n').map(v=>v.trim()).filter(Boolean):[],
  initial_settings:{payment_methods:(f.payment_methods||'').split(',').filter(Boolean),public_address_confirmed:configured&&f.consent==='yes',preparation_estimate:configured?f.preparation_estimate||null:null,delivery_estimate:configured?f.delivery_estimate||null:null}};
}
