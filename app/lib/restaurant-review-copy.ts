import type { RestaurantLocale } from "../services/shida/restaurants-client";

export const restaurantReviewCopy: Record<RestaurantLocale, {
 reviews: string; noReviews: string; verified: string; reviewer: string; response: string;
 leave: string; update: string; withdraw: string; rating: string; comment: string;
 publish: string; report: string; reportSaved: string; failed: string; previous: string; next: string;
}> = {
 en: {reviews:"Customer reviews",noReviews:"No reviews yet",verified:"Verified SHIDA order",reviewer:"SHIDA customer",response:"Restaurant response",leave:"Leave a review",update:"Update your review",withdraw:"Withdraw review",rating:"Rating",comment:"Comment (optional)",publish:"Publish review",report:"Report review",reportSaved:"Your report was saved privately for SHIDA review.",failed:"Reviews are temporarily unavailable.",previous:"Previous",next:"Next"},
 fr: {reviews:"Avis clients",noReviews:"Aucun avis pour le moment",verified:"Commande SHIDA vérifiée",reviewer:"Client SHIDA",response:"Réponse du restaurant",leave:"Laisser un avis",update:"Modifier mon avis",withdraw:"Retirer mon avis",rating:"Note",comment:"Commentaire (facultatif)",publish:"Publier l’avis",report:"Signaler l’avis",reportSaved:"Votre signalement privé est enregistré pour SHIDA.",failed:"Les avis sont temporairement indisponibles.",previous:"Précédent",next:"Suivant"},
 ln: {reviews:"Makanisi ya bakiliya",noReviews:"Makanisi ezali naino te",verified:"Commande SHIDA endimami",reviewer:"Client SHIDA",response:"Eyano ya restaurant",leave:"Pesa likanisi",update:"Bongisa likanisi na ngai",withdraw:"Longola likanisi",rating:"Minzoto",comment:"Maloba (soki olingi)",publish:"Bimisa likanisi",report:"Loba mokakatano",reportSaved:"Lapolo na yo ebombami mpo SHIDA etala yango.",failed:"Makanisi ezali sikoyo te.",previous:"Ya liboso",next:"Oyo elandi"},
 sw: {reviews:"Maoni ya wateja",noReviews:"Hakuna maoni bado",verified:"Oda ya SHIDA imethibitishwa",reviewer:"Mteja wa SHIDA",response:"Jibu la mgahawa",leave:"Andika maoni",update:"Badili maoni yako",withdraw:"Ondoa maoni",rating:"Nyota",comment:"Maelezo (si lazima)",publish:"Chapisha maoni",report:"Ripoti maoni",reportSaved:"Ripoti yako imehifadhiwa kwa SHIDA kwa faragha.",failed:"Maoni hayapatikani kwa sasa.",previous:"Iliyotangulia",next:"Ifuatayo"},
};

export const restaurantReviewReasons: Record<RestaurantLocale, Record<string,string>> = {
 en:{harassment:"Harassment",inappropriate:"Inappropriate content",inaccurate:"Inaccurate information",privacy:"Privacy issue",spam:"Spam",other:"Other"},
 fr:{harassment:"Harcèlement",inappropriate:"Contenu déplacé",inaccurate:"Information inexacte",privacy:"Vie privée",spam:"Spam",other:"Autre"},
 ln:{harassment:"Kotungisa",inappropriate:"Ebongi te",inaccurate:"Ezali solo te",privacy:"Sekele",spam:"Spam",other:"Mosusu"},
 sw:{harassment:"Unyanyasaji",inappropriate:"Maandishi yasiyofaa",inaccurate:"Habari zisizo sahihi",privacy:"Faragha",spam:"Spam",other:"Nyingine"},
};
