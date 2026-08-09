import type { Locale } from "../../lib/i18n";

export const marketplaceCopy = {
  en: {
    apartments: "Apartments", hotels: "Hotels", browse: "Browse on NIHILOBA", gateway: "Explore SHIDA listings",
    gatewayText: "Browse public apartments and hotels, then continue securely through SHIDA on WhatsApp.",
    apartmentTitle: "Apartments available through SHIDA", hotelTitle: "Hotels available through SHIDA",
    apartmentIntro: "Explore public apartment listings and request a visit through the official SHIDA journey.",
    hotelIntro: "Explore public hotels and room options, then continue to the official SHIDA booking journey.",
    details: "View details", visit: "Request a visit with SHIDA", book: "Book on WhatsApp", rooms: "rooms", perMonth: "per month",
    roomTypes: "Room options", roomPhotos: "Room photos", capacity: "Capacity", guests: "guests", availableRooms: "rooms listed",
    unavailable: "This marketplace is temporarily unavailable. Please try again shortly.",
    emptyApartments: "No apartments are publicly listed right now.", emptyHotels: "No hotels are publicly listed right now.",
    actionUnavailable: "The SHIDA action link is temporarily unavailable.", notFound: "This listing could not be found.",
    backApartments: "Back to apartments", backHotels: "Back to hotels", from: "From", location: "Location",
    imageUnavailable: "Image unavailable", availability: "Availability", landmark: "Landmark", price: "Price",
    breadcrumb: "Breadcrumb", home: "Home", photos: "Apartment photos", descriptionTitle: "About this apartment", detailsTitle: "Property details", visitTitle: "Interested in this apartment?", visitText: "Continue with SHIDA to request a visit through the official WhatsApp journey.",
  },
  fr: {
    apartments: "Appartements", hotels: "Hôtels", browse: "Parcourir sur NIHILOBA", gateway: "Explorer les annonces SHIDA",
    gatewayText: "Parcourez les appartements et hôtels publics, puis continuez en toute sécurité avec SHIDA sur WhatsApp.",
    apartmentTitle: "Appartements disponibles avec SHIDA", hotelTitle: "Hôtels disponibles avec SHIDA",
    apartmentIntro: "Explorez les annonces publiques et demandez une visite via le parcours officiel SHIDA.",
    hotelIntro: "Explorez les hôtels et les chambres, puis continuez vers le parcours officiel de réservation SHIDA.",
    details: "Voir les détails", visit: "Demander une visite avec SHIDA", book: "Réserver sur WhatsApp", rooms: "pièces", perMonth: "par mois",
    roomTypes: "Options de chambre", roomPhotos: "Photos de la chambre", capacity: "Capacité", guests: "personnes", availableRooms: "chambres indiquées",
    unavailable: "Ce marché est temporairement indisponible. Veuillez réessayer dans quelques instants.",
    emptyApartments: "Aucun appartement n’est publié pour le moment.", emptyHotels: "Aucun hôtel n’est publié pour le moment.",
    actionUnavailable: "Le lien d’action SHIDA est temporairement indisponible.", notFound: "Cette annonce est introuvable.",
    backApartments: "Retour aux appartements", backHotels: "Retour aux hôtels", from: "À partir de", location: "Localisation",
    imageUnavailable: "Image indisponible", availability: "Disponibilité", landmark: "Repère", price: "Prix",
    breadcrumb: "Fil d’Ariane", home: "Accueil", photos: "Photos de l’appartement", descriptionTitle: "À propos de cet appartement", detailsTitle: "Détails du logement", visitTitle: "Ce logement vous intéresse ?", visitText: "Continuez avec SHIDA pour demander une visite via le parcours WhatsApp officiel.",
  },
} as const satisfies Record<Locale, object>;
