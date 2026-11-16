// The preference is not authorization. Every private read checks the canonical
// session and the current Owner-managed test designation in the backend.
export const TEST_MARKETPLACE_COOKIE = "nihiloba_test_marketplace_session";
export const TEST_MARKETPLACE_MODE = "nihiloba_test_marketplace_mode";
export const PRIVATE_TEST_PREFIX = "/api/dashboard/test-marketplace";

export function privateTestPath(path: string): string | null {
  if (/^\/api\/public\/shida\/(?:wenze\/(?:stores|products)|hotels|services|restaurants|restaurant-dishes|businesses|entity-actions)(?:[/?]|$)/.test(path)) {
    return path.replace("/api/public/shida", PRIVATE_TEST_PREFIX);
  }
  if (/^\/api\/restaurants\/RST_[A-Za-z0-9_-]+\/reservations\/availability(?:\?|$)/.test(path)) {
    return path.replace("/api", PRIVATE_TEST_PREFIX);
  }
  return null;
}

export const testMarketplaceCopy = {
  fr: {open:"Ouvrir le marché de test", close:"Revenir au marché public", title:"Marché de test privé", help:"Visible uniquement aux comptes désignés pour les tests. Vos achats et réservations restent entre comptes et entreprises de test.", publicHelp:"Vous consultez le marché public. Utilisez le marché de test pour vos achats et réservations d’essai.", failed:"Impossible de changer de mode. Vérifiez votre connexion et réessayez.", working:"Changement en cours…"},
  en: {open:"Open test marketplace", close:"Return to public marketplace", title:"Private test marketplace", help:"Only designated test accounts can see this content. Test purchases and bookings stay between test accounts and businesses.", publicHelp:"You are browsing the public marketplace. Use the test marketplace for test purchases and bookings.", failed:"Could not change mode. Check your sign-in and try again.", working:"Changing mode…"},
  ln: {open:"Fungola zando ya komeka", close:"Zonga na zando ya bato nyonso", title:"Zando ya komeka ya sekele", help:"Kaka bakonti oyo baponami mpo na komeka nde bakoki komona yango. Kosomba mpe kosala réservation ya komeka ezali kaka kati na bakonti mpe bibongiseli ya komeka.", publicHelp:"Ozali na zando ya bato nyonso. Salelá zando ya komeka mpo na kosomba mpe kosala réservation ya komeka.", failed:"Tokoki kobongola mode te. Tala soki okɔti na konti mpe meka lisusu.", working:"Tozali kobongola mode…"},
  sw: {open:"Fungua soko la majaribio", close:"Rudi kwenye soko la umma", title:"Soko binafsi la majaribio", help:"Akaunti zilizoteuliwa kwa majaribio pekee zinaweza kuona maudhui haya. Ununuzi na uhifadhi wa majaribio hubaki kati ya akaunti na biashara za majaribio.", publicHelp:"Unaangalia soko la umma. Tumia soko la majaribio kwa ununuzi na uhifadhi wa majaribio.", failed:"Imeshindikana kubadilisha hali. Hakikisha umeingia kisha ujaribu tena.", working:"Inabadilisha hali…"},
};
