// Situations fictives : aucun seuil ni délai légal n’est supposé.
export const INITIATION_CONTEXTS = [
  [
    "Fournitures, travaux et services",
    "une administration prépare plusieurs achats",
    [
      "Une administration achète des ordinateurs pour ses agents : il s’agit de répondre à un besoin de service, avec des fonds publics et des règles à respecter.",
      "La réhabilitation d’une route, l’achat de matériel informatique et une formation des agents répondent à des besoins différents. Le dossier doit préciser la nature de chaque prestation.",
      "Deux entreprises souhaitent fournir les mêmes ordinateurs. Elles doivent disposer des mêmes informations utiles pour préparer leurs offres."
    ]
  ],
  [
    "Une formation pour les agents",
    "un service prépare une formation professionnelle",
    [
      "Le service utilisateur décrit les compétences à acquérir. Les personnes chargées de la passation préparent la consultation selon leurs attributions ; le formateur candidat propose une offre.",
      "Un prestataire de formation remet une offre. Il ne décide ni des critères d’évaluation ni du classement des candidats.",
      "Une personne coordonne l’organisation de la formation. Cette coordination ne lui donne pas automatiquement le pouvoir de signer le contrat."
    ]
  ],
  [
    "Du matériel pour un centre de santé",
    "un centre de santé souhaite acquérir du matériel",
    [
      "Le centre de santé recense les usages, les quantités et les contraintes d’entretien avant de décrire le matériel attendu.",
      "L’estimation distingue l’achat du matériel, la livraison, l’installation et les prestations prévues, à partir de sources de prix documentées.",
      "Le centre dispose d’un besoin technique bien défini, mais l’équipe doit encore vérifier le financement disponible avant de lancer l’achat."
    ]
  ],
  [
    "La réhabilitation d’une route",
    "une collectivité envisage la réhabilitation d’une route",
    [
      "Le calendrier de la route doit tenir compte de la préparation des études, de la procédure et de la période d’exécution prévue.",
      "La collectivité rapproche l’objet des travaux, l’estimation et le cadre applicable pour choisir la procédure ; la seule volonté de commencer vite ne suffit pas.",
      "Des lots peuvent correspondre à des tronçons techniquement cohérents. Leur justification ne doit pas masquer un fractionnement visant à éviter une règle."
    ]
  ],
  [
    "Un équipement informatique",
    "un service achète des ordinateurs et leur installation",
    [
      "Le dossier décrit les performances, les usages et la compatibilité nécessaires des ordinateurs plutôt qu’une préférence pour une marque.",
      "Si l’installation et l’assistance sont exigées, le dossier doit expliquer comment ces éléments seront vérifiés lors de l’évaluation.",
      "Le cahier des charges prévoit l’installation sur plusieurs sites, mais le formulaire de prix n’en mentionne qu’un : cette contradiction doit être corrigée avant la consultation."
    ]
  ],
  [
    "Une entreprise de nettoyage candidate",
    "une entreprise prépare une offre de nettoyage",
    [
      "L’entreprise vérifie les surfaces, les horaires, le personnel et les équipements nécessaires avant de décider de participer.",
      "L’entreprise rapproche chaque exigence du dossier de nettoyage de la pièce correspondante ; elle vérifie notamment les formulaires et signatures demandés.",
      "Le chiffrage tient compte des produits, du personnel et des déplacements prévus. Les quantités et les totaux sont relus avant le dépôt."
    ]
  ],
  [
    "Des équipements pour l’eau",
    "un service prépare une consultation d’équipements de pompage",
    [
      "L’avis explique l’objet de l’achat de pompes, l’accès au dossier et les modalités de participation selon le cadre applicable.",
      "Un candidat demande si la livraison inclut l’installation des pompes. La réponse peut affecter le chiffrage des autres candidats et doit suivre le circuit prévu.",
      "À l’ouverture, un prix de fourniture de pompes est constaté. La conformité de l’équipement et l’évaluation des offres restent à examiner ensuite."
    ]
  ],
  [
    "Des fournitures de bureau",
    "une équipe évalue des offres de fournitures de bureau",
    [
      "Chaque offre est examinée avec la même grille : exigences annoncées, pièces observées et constats justifiés.",
      "Une offre affiche un prix réduit, mais ne respecte pas une caractéristique requise. Le prix seul ne permet pas de conclure au résultat.",
      "Le rapport explique les constats de conformité et la comparaison réalisée ; un simple tableau des prix ne rend pas toute l’analyse compréhensible."
    ]
  ],
  [
    "Un service de maintenance",
    "une administration attribue un contrat de maintenance",
    [
      "Une entreprise apprend qu’elle est proposée pour la maintenance. Elle doit vérifier les formalités applicables avant de considérer le contrat comme engagé.",
      "Une entreprise non retenue demande une explication. La réponse se fonde sur la décision et les éléments communicables de l’évaluation.",
      "Un candidat estime qu’un critère de maintenance non annoncé a été utilisé. Il rassemble les pièces et vérifie la voie et les délais de recours applicables."
    ]
  ],
  [
    "La réhabilitation d’un bâtiment",
    "une administration suit un chantier de réhabilitation",
    [
      "L’équipe de suivi rapproche les travaux attendus, le calendrier contractuel, les intervenants et les conditions de démarrage.",
      "Une livraison de matériaux prend du retard. L’équipe documente les dates et les effets sur le chantier avant de faire examiner les mesures possibles.",
      "Un utilisateur demande une pièce supplémentaire dans le bâtiment. Cette demande doit être analysée et autorisée selon le cadre applicable avant exécution."
    ]
  ],
  [
    "La livraison de mobilier",
    "une équipe réceptionne du mobilier administratif",
    [
      "Les bureaux et les armoires livrés sont comptés puis comparés aux caractéristiques du contrat ; leur présence sur le site ne suffit pas à prouver la conformité.",
      "Deux armoires présentent des défauts. Les réserves précisent les éléments concernés et permettent de vérifier le traitement convenu.",
      "La facture est rapprochée du contrat, des constats de réception et des pièces requises avant son traitement dans le circuit de paiement."
    ]
  ],
  [
    "Un achat public documenté",
    "une équipe reprend un dossier d’achat de matériel",
    [
      "Un membre de l’équipe découvre un lien avec une entreprise candidate. Il déclare la situation par le canal prévu avant de poursuivre son intervention.",
      "Le contrôleur cherche la justification d’une exigence technique. Les versions du dossier et les décisions classées permettent de reconstituer le raisonnement.",
      "Pour l’achat de matériel, l’équipe rassemble le besoin, le financement, la consultation, l’évaluation, le contrat, la réception et les pièces de paiement. Elle indique les vérifications encore nécessaires."
    ]
  ]
] as const;
