import { CourseModule } from '../types';
import imgCoverSeminar from '../assets/images/marches_publics_seminar_1789983166275.jpg';
import imgCoverFormation from '../assets/images/formation_numerique_1789983181347.jpg';
import imgCoverAudit from '../assets/images/expert_audit_cgpmp_1789983194702.jpg';

export const COURSES_DATA: CourseModule[] = [
  {
    id: 'MOD-001',
    code: 'MP-RDC-101',
    title: 'Fondamentaux de la Loi n° 10/010 relative aux Marchés Publics',
    category: 'Réglementation',
    targetAudience: ['cgpmp_member', 'armp_agent', 'dgcmp_agent', 'particulier', 'dfat_admin', 'formateur'],
    duration: '6 Heures',
    level: 'Fondamental',
    legalRef: 'Loi n° 10/010 du 27 avril 2010',
    description:
      'Maîtrisez le socle juridique de la commande publique en République Démocratique du Congo : champ d’application, principes d’équité, acteurs institutionnels et typologie opérationnelle des contrats publics.',
    coverImage: imgCoverSeminar,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 1420,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-101-1',
        title: 'Architecture et Piliers de la Loi n° 10/010',
        duration: '45 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 1er Loi 10/010 (Principes fondamentaux)',
          'Art. 2 Loi 10/010 (Champ d’application)',
          'Art. 4 Loi 10/010 (Définitions légales)',
          'Art. 19 Loi 10/010 (Interdiction du fractionnement)',
          'Art. 37 Loi 10/010 (Publicité obligatoire)'
        ],
        content: `[Scène: citizen_impact_law] Finalité humaine et vocation sociale des deniers publics : Bienvenue dans cette formation dédiée à l’éthique de la commande publique. Derrière chaque franc congolais engagé par notre administration, il y a le travail des familles et l’espoir bien réel d’une école accueillante pour nos enfants, d’un centre de santé équipé ou d’une route durable qui relie nos communautés. | Application terrain : Avant de lancer toute procédure d’achat, prenez toujours un instant pour penser aux citoyens qui attendent cet ouvrage et vérifiez avec soin la disponibilité des crédits budgétaires.

[Scène: open_competition_access] Liberté d’accès et égalité des chances entrepreneuriales : Qu’un entrepreneur exerce son métier à Kinshasa, à Lubumbashi, à Kisangani, à Bukavu ou à Mbuji-Mayi, la loi lui garantit la même chance loyale d’accéder à la commande publique grâce à une publication large et transparente des avis d’appel d’offres. | Application terrain : Décrivez toujours vos besoins de manière neutre et fonctionnelle, sans jamais imposer une marque commerciale précise qui écarterait injustement d’autres entreprises compétentes.

[Scène: scale_justice] Égalité de traitement et respect du travail des candidats : Chaque entreprise qui dépose un dossier a consacré des semaines d’études et d’énergie humaine pour répondre à l’administration. Notre devoir d’équité consiste à examiner toutes les offres avec la même bienveillance objective, selon les seuls critères annoncés d’avance. | Application terrain : Lorsqu’un candidat sollicite un éclaircissement sur le dossier, partagez immédiatement votre réponse écrite avec l’ensemble des soumissionnaires afin que chacun avance sur un pied d’égalité.

[Scène: transparency_traceability] Transparence des décisions et dialogue respectueux : La confiance durable entre l’État et les opérateurs économiques grandit dans la clarté, lorsque chaque étape est fidèlement consignée par écrit et que tout candidat non retenu reçoit avec courtoisie l’explication sincère des motifs du rejet de son offre. | Application terrain : Rédigez toujours des lettres de notification claires et constructives qui permettent aux petites et moyennes entreprises d’améliorer leurs dossiers pour les prochaines consultations.

[Scène: threshold_gauge] Juste gestion des deniers publics et refus du fractionnement : Protéger l’épargne de la nation, c’est rechercher des ouvrages solides au prix juste afin d’équiper davantage de collectivités, sans jamais découper artificiellement un besoin annuel en petits achats dispersés pour contourner l’appel d’offres. | Application terrain : Rassemblez dès la préparation budgétaire l’ensemble des besoins annuels de même nature afin de favoriser une concurrence saine et de réaliser des économies utiles au bien commun.`
      },
      {
        id: 'L-101-2',
        title: 'Séparation des Fonctions : CGPMP, DGCMP et ARMP',
        duration: '50 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 13 Loi 10/010 (Autorité Contractante & CGPMP)',
          'Art. 14 Loi 10/010 (Contrôle a priori DGCMP)',
          'Art. 15 Loi 10/010 (Régulation ARMP)',
          'Décret n° 10/27 (Organisation des CGPMP)',
          'Décret n° 10/21 (Statuts de l’ARMP)'
        ],
        content: `[Scène: scale_justice] Incompatibilité des fonctions et sérénité éthique : Pour protéger l’intégrité des femmes et des hommes qui servent l’État, le législateur congolais a séparé avec sagesse celui qui prépare le marché, celui qui le contrôle a priori et celui qui régule ou arbitre les différends, évitant à chacun d’être à la fois juge et partie. | Application terrain : Un membre d’une Cellule de Gestion des Marchés Publics ne doit jamais siéger dans les organes de contrôle de la DGCMP ni au Comité de Règlement des Différends.

[Scène: ministry_cgpmp] Rôle humain et technique de la CGPMP : Au cœur de chaque ministère ou gouvernorat, la Cellule de Gestion des Projets et des Marchés Publics écoute les besoins concrets des médecins, des enseignants et des ingénieurs pour les transformer en plans de passation et en dossiers d’appel d’offres rigoureux. | Application terrain : Installez un dialogue permanent entre les directions utilisatrices et la CGPMP dès la conception du projet pour que les achats répondent fidèlement aux réalités du terrain.

[Scène: dgcmp_shield] Contrôle préventif et accompagnement de la DGCMP : Loin d’être un frein administratif, la revue a priori exercée par la Direction Générale du Contrôle des Marchés Publics agit comme un garde-fou bienveillant qui vérifie la régularité juridique et budgétaire avant de délivrer l’Avis de Non-Objection. | Application terrain : Transmettez à la DGCMP un dossier complet et soigneusement vérifié afin d’obtenir rapidement le visa préalable qui sécurise la suite de votre procédure.

[Scène: armp_tower] Régulation, pédagogie et veille normative de l’ARMP : Placée sous la tutelle de la Primature, l’Autorité de Régulation des Marchés Publics accompagne la montée en compétence humaine des acheteurs publics et des PME grâce à ses formations, ses dossiers types obligatoires et ses audits indépendants. | Application terrain : Appuyez-vous systématiquement sur la dernière édition des Dossiers Standards d’Appel d’Offres de l’ARMP pour garantir l’équité et la clarté de vos consultations.

[Scène: citizen_impact_law] Harmonie de la chaîne de responsabilité publique : Lorsque la CGPMP prépare avec soin, que la DGCMP valide avec rigueur et que l’ARMP veille au respect des normes, l’Autorité Approbatrice peut signer un contrat exemplaire qui donnera naissance à des infrastructures durables pour la nation. | Application terrain : Avant toute présentation du contrat à la signature finale, vérifiez la présence conjointe du visa de non-objection, de l’engagement budgétaire et de l’absence de recours.`
      },
      {
        id: 'L-101-3',
        title: 'Typologie des Marchés et Seuils Financiers',
        duration: '45 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 5 Loi 10/010 (Marchés de travaux)',
          'Art. 6 Loi 10/010 (Marchés de fournitures)',
          'Art. 7 Loi 10/010 (Services & Prestations intellectuelles)',
          'Art. 18 Loi 10/010 (Seuils de passation et de contrôle)',
          'Décret n° 10/33 (Seuils réglementaires)'
        ],
        content: `[Scène: construction_crane] Marchés de travaux publics au service des communautés : Construire une école primaire, réhabiliter une route de desserte agricole ou ériger un pont, c’est transformer durablement le quotidien de milliers de familles grâce à un marché de travaux soumis à une obligation stricte de solidité et de sécurité. | Application terrain : Exigez toujours des études géotechniques sérieuses et un suivi quotidien du chantier pour que l’ouvrage résiste aux intempéries pendant des décennies.

[Scène: supply_truck] Marchés de fournitures et dignité des services publics : Qu’il s’agisse de livrer des médicaments essentiels dans un centre de santé, des bancs scolaires pour des élèves ou des transformateurs électriques, le marché de fournitures garantit que les équipements arrivent à bon port et en parfait état de marche. | Application terrain : Lorsqu’un contrat inclut à la fois la fourniture d’équipements médicaux et leur mise en service, prévoyez systématiquement la formation pratique des techniciens locaux.

[Scène: intellectual_compass] Prestations intellectuelles et valorisation de l’expertise : Avant de bâtir un ouvrage ou de réformer un service, l’État a besoin de l’intelligence humaine d’ingénieurs-conseils, d’architectes et d’auditeurs dont la sélection repose avant tout sur la qualité méthodologique des études plutôt que sur le seul prix. | Application terrain : Évaluez d’abord avec soin l’expérience humaine des experts et la pertinence de leur méthodologie avant d’ouvrir les propositions financières des cabinets qualifiés.

[Scène: threshold_gauge] Juste mesure des seuils financiers réglementaires : Les seuils financiers fixés par décret permettent de proportionner la procédure à l’importance de l’achat : procédure rapide de cotation pour les petits besoins urgents, et appel d’offres complet avec revue DGCMP pour les investissements structurants. | Application terrain : Chiffrez toujours vos estimations avec sincérité en vous référant aux prix réels pratiqués sur le marché local afin de choisir d’emblée la bonne procédure.

[Scène: allotment_puzzle] Agrégation annuelle et planification solidaire : Pour respecter l’esprit de la loi, l’administration additionne les besoins de même nature sur toute l’année budgétaire, tout en les organisant en lots cohérents afin que les PME nationales puissent participer activement à l’effort de développement. | Application terrain : Au lieu de multiplier de petits achats isolés entre services, regroupez vos commandes annuelles au sein d’un appel d’offres alloti, transparent et ouvert aux PME.`
      }
    ],
    quiz: [
      {
        question: 'Selon la Loi n° 10/010, quelle institution assure le contrôle a priori de la procédure de passation et délivre les Avis de Non-Objection (ANO) ?',
        options: [
          'L’Autorité de Régulation des Marchés Publics (ARMP)',
          'La Direction Générale du Contrôle des Marchés Publics (DGCMP)',
          'La Cellule de Gestion des Projets et des Marchés Publics (CGPMP)',
          'La Cour des Comptes'
        ],
        correctIndex: 1,
        explanation:
          'Conformément à l’article 14 de la Loi n° 10/010, la DGCMP assure le contrôle a priori des procédures de passation et délivre les Avis de Non-Objection (ANO).'
      },
      {
        question: 'Lequel de ces principes n’est PAS un principe fondamental énoncé à l’article 1er de la Loi n° 10/010 ?',
        options: [
          'La liberté d’accès à la commande publique',
          'L’égalité de traitement des candidats',
          'La préférence discrétionnaire accordée aux anciens titulaires',
          'La transparence des procédures'
        ],
        correctIndex: 2,
        explanation:
          'L’article 1er consacre la liberté d’accès, l’égalité de traitement, la transparence et l’économie. Toute préférence discrétionnaire est illégale.'
      },
      {
        question: 'Comment qualifie-t-on le fait de scinder artificiellement un besoin unique en plusieurs petits contrats pour contourner le seuil d’appel d’offres ?',
        options: [
          'L’allotissement technique',
          'Le fractionnement interdit des marchés',
          'La délégation de maîtrise d’ouvrage',
          'L’avenant de régularisation'
        ],
        correctIndex: 1,
        explanation:
          'L’article 19 de la Loi n° 10/010 interdit formellement le fractionnement d’un marché dans le but de le soustraire aux règles de concurrence ou aux seuils de contrôle.'
      },
      {
        question: 'Quel organe est institué au sein de chaque Autorité Contractante pour préparer les dossiers et conduire les opérations de passation ?',
        options: [
          'Le Comité de Règlement des Différends (CRD)',
          'La Cellule de Gestion des Projets et des Marchés Publics (CGPMP)',
          'L’Inspection Générale des Finances (IGF)',
          'Le Conseil d’Administration de l’ARMP'
        ],
        correctIndex: 1,
        explanation:
          'L’article 13 de la Loi n° 10/010 et le Décret n° 10/27 instituent une CGPMP au sein de chaque Autorité Contractante.'
      }
    ]
  },
  {
    id: 'MOD-002',
    code: 'MP-RDC-201',
    title: 'Planification (PPM), Élaboration des DAO et Allotissement',
    category: 'Passation',
    targetAudience: ['cgpmp_member', 'dgcmp_agent', 'particulier', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Intermédiaire',
    legalRef: 'Décret n° 10/22 & Loi n° 10/010 (Art. 16 à 25)',
    description:
      'Apprenez à concevoir un Plan de Passation des Marchés (PPM) réaliste, à rédiger un Dossier d’Appel d’Offres (DAO) conforme aux dossiers types ARMP et à structurer l’allotissement pour favoriser les PME.',
    coverImage: imgCoverFormation,
    chaptersCount: 3,
    rating: 4.8,
    studentsCount: 1180,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-201-1',
        title: 'Définition des Besoins et Plan de Passation (PPM)',
        duration: '55 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 16 Loi 10/010 (Détermination préalable des besoins)',
          'Art. 17 Loi 10/010 (Plan de Passation des Marchés)',
          'Art. 20 Loi 10/010 (Disponibilité des crédits)',
          'Manuel de procédures ARMP (Canevas PPM)'
        ],
        content: `[Scène: ministry_cgpmp] Écoute des usagers et définition sincère des besoins : Un bon marché public commence toujours par l’écoute attentive des réalités humaines sur le terrain : comprendre ce dont ont réellement besoin les élèves, les soignants ou les usagers avant de rédiger le moindre cahier des charges. | Application terrain : Réunissez dès le quatrième trimestre les équipes de terrain, les financiers et la CGPMP pour définir des besoins justes, utiles et adaptés aux conditions locales.

[Scène: dgcmp_shield] Sincérité budgétaire et respect du travail des entreprises : Engager un appel d’offres sans disposer des crédits budgétaires mettrait en péril les entreprises et leurs travailleurs. C’est pourquoi la loi exige que les fonds soient effectivement inscrits au budget avant tout lancement de procédure. | Application terrain : Joignez systématiquement l’attestation de disponibilité des crédits validée par le contrôleur budgétaire avant de solliciter le visa du dossier d’appel d’offres.

[Scène: dao_calendar] Construction méthodique du Plan de Passation (PPM) : Le Plan de Passation des Marchés est la boussole annuelle de l’Autorité Contractante : il organise sereinement sur douze mois chaque acquisition en fixant des délais réalistes pour la rédaction des dossiers, le contrôle préalable et l’ouverture des plis. | Application terrain : Prévoyez dans votre calendrier PPM au moins trente jours calendaires pour la préparation des offres par les candidats et quinze jours pour la revue DGCMP.

[Scène: open_competition_access] Publication du PPM et visibilité donnée aux PME : Publier le Plan de Passation des Marchés sur le portail de l’ARMP dès le début de l’année est un acte d’équité qui permet aux PME congolaises de s’organiser à l’avance, de mobiliser leurs ingénieurs et de préparer des offres de qualité. | Application terrain : Ne lancez aucun marché qui ne figure pas dans le PPM publié ; en cas de besoin nouveau, faites d’abord approuver et publier une mise à jour formelle du plan.

[Scène: transparency_traceability] Suivi vivant et ajustement responsable du calendrier : Parce que la vie d’une administration évolue, la CGPMP suit chaque semaine l’avancement réel du PPM avec rigueur et transparence, afin de prévenir les retards qui priveraient les citoyens des ouvrages attendus. | Application terrain : Tenez un tableau de bord mensuel partagé avec toute l’équipe pour détecter immédiatement tout glissement de date et accompagner les services techniques.`
      },
      {
        id: 'L-201-2',
        title: 'Structure et Rédaction du Dossier d’Appel d’Offres (DAO)',
        duration: '60 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 24 Loi 10/010 (Contenu du DAO)',
          'Art. 25 Loi 10/010 (Spécifications techniques neutres)',
          'Art. 39 Loi 10/010 (Critères d’évaluation)',
          'Dossiers Types de Passation ARMP RDC'
        ],
        content: `[Scène: legal_codex] Clarté et sécurité des Dossiers Types de l’ARMP : Un Dossier d’Appel d’Offres bien rédigé est un contrat de confiance : en suivant l’architecture tripartite homologuée par l’ARMP, l’acheteur public offre aux entreprises des règles du jeu limpides, stables et compréhensibles par tous. | Application terrain : Conservez intactes les clauses générales des Dossiers Types et personnalisez uniquement les Données Particulières propres à votre projet.

[Scène: dao_calendar] Équilibre humain des Données Particulières (DPAO) : En fixant dans les DPAO le délai de remise des offres et le taux de la garantie de soumission, l’Autorité Contractante veille à protéger l’État sans dresser de barrière financière disproportionnée qui découragerait les petites entreprises locales. | Application terrain : Maintenez la garantie d’offre entre un et deux pour cent du montant estimatif afin de permettre aux PME congolaises sérieuses de participer à la compétition.

[Scène: open_competition_access] Neutralité bienveillante des spécifications techniques : Décrire un besoin par ses performances utiles plutôt que par une marque commerciale permet d’ouvrir grand la porte à l’innovation et à la diversité des fournisseurs, tout en garantissant la qualité finale pour l’usager public. | Application terrain : Si une référence technique précise est indispensable pour décrire une pièce, accompagnez-la toujours de la mention « ou équivalent » pour préserver l’ouverture.

[Scène: scale_justice] Critères d’évaluation équitables et connus d’avance : Pour que chaque candidat se sente respecté, les critères de qualification financière et d’expérience technique doivent être objectifs, mesurables et intégralement annoncés dans le DAO avant même le dépôt des plis. | Application terrain : N’inventez jamais de nouveau critère ou sous-critère après l’ouverture des offres ; évaluez les candidats avec la stricte grille publiée dans le DAO.

[Scène: bank_guarantee_vault] Harmonie contractuelle du CCAP et respect des paiements : Le Cahier des Clauses Administratives Particulières prépare une exécution sereine en fixant clairement le rythme des acomptes, les délais de livraison et des conditions équilibrées qui sécurisent à la fois l’ouvrage public et la trésorerie de l’entreprise. | Application terrain : Vérifiez la cohérence parfaite entre le devis quantitatif et les échéances de paiement du CCAP avant de publier votre Dossier d’Appel d’Offres.`
      },
      {
        id: 'L-201-3',
        title: 'Allotissement Stratégique et Promotion des PME (Loi 17/001)',
        duration: '45 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 19 al. 2 Loi 10/010 (Allotissement)',
          'Art. 41 Loi 10/010 (Marge de préférence nationale)',
          'Loi n° 17/001 du 8 février 2017 (Sous-traitance)',
          'Décret n° 10/22 (Dispositions PME & artisanat)'
        ],
        content: `[Scène: allotment_puzzle] L’allotissement au service de l’emploi local et des PME : Répartir un grand programme public en plusieurs lots géographiques ou techniques permet à nos PME congolaises et à nos artisans locaux de remporter des marchés à leur mesure, créant ainsi des emplois directs au cœur des provinces. | Application terrain : Pour construire trente écoles rurales, privilégiez cinq lots géographiques de six écoles afin de faire travailler simultanément cinq entreprises locales et de livrer les classes plus vite.

[Scène: threshold_gauge] Allotir dans la transparence sans jamais fractionner : Contrairement au fractionnement illégal qui cache la taille réelle du besoin, l’allotissement est une démarche loyale où tous les lots sont lancés ensemble selon la procédure correspondant à leur valeur totale cumulée. | Application terrain : Additionnez toujours les montants estimatifs de l’ensemble des lots pour déterminer le seuil légal et soumettre le dossier complet au visa de la DGCMP.

[Scène: scale_justice] Équité d’attribution multi-lots et capacité réelle : Pour éviter qu’une seule entreprise ne cumule plus de lots qu’elle ne peut humainement et techniquement en exécuter, le DAO vérifie que le candidat retenu sur plusieurs lots possède bien l’addition des équipes et du matériel requis pour chaque chantier. | Application terrain : Indiquez clairement dans le DAO comment la commission vérifiera le cumul des chefs de chantier et des engins avant d’attribuer plusieurs lots à un même soumissionnaire.

[Scène: citizen_impact_law] Marge de préférence nationale et valorisation du savoir-faire congolais : Afin d’encourager la production locale et l’industrialisation de la RDC, la loi permet d’appliquer, lors des appels d’offres internationaux, une marge de préférence transparente en faveur des entreprises congolaises et des biens fabriqués au pays. | Application terrain : Annoncez explicitement dans le DAO le taux et la formule de la marge de préférence nationale afin de valoriser loyalement les producteurs locaux lors du classement.

[Scène: ministry_cgpmp] Sous-traitance solidaire et transfert de compétences : La sous-traitance encadrée et les groupements d’entreprises permettent aux jeunes PME congolaises d’acquérir de nouvelles compétences techniques aux côtés d’entreprises expérimentées, sous le regard protecteur de l’Autorité Contractante. | Application terrain : Agréez formellement chaque sous-traitant local avant son entrée sur le chantier et veillez à ce que ses prestations soient équitablement rémunérées.`
      }
    ],
    quiz: [
      {
        question: 'Quelle est la conséquence juridique d’un marché public lancé sans être inscrit au Plan de Passation des Marchés (PPM) approuvé et publié ?',
        options: [
          'Une simple recommandation verbale en fin d’exercice',
          'La nullité de la procédure pour défaut de planification réglementaire',
          'Une réduction automatique de 5 % du prix du contrat',
          'Le transfert automatique du marché à un autre ministère'
        ],
        correctIndex: 1,
        explanation:
          'Tout marché non inscrit dans un PPM préalablement validé par la DGCMP et publié par l’ARMP est entaché d’irrégularité grave entraînant sa nullité.'
      },
      {
        question: 'Comment doit-on rédiger les spécifications techniques dans un Dossier d’Appel d’Offres (DAO) ?',
        options: [
          'En citant exclusivement la marque commerciale préférée du service utilisateur',
          'De manière neutre et fonctionnelle, et si une marque est indispensable, en ajoutant « ou équivalent »',
          'En laissant les candidats deviner les quantités lors de la visite de site',
          'En modifiant librement le Cahier des Clauses Administratives Générales (CCAG)'
        ],
        correctIndex: 1,
        explanation:
          'L’article 25 impose la neutralité des spécifications techniques. Toute référence à une marque est interdite, sauf impossibilité descriptive accompagnée de la mention « ou équivalent ».'
      },
      {
        question: 'Quelle est la différence juridique entre l’allotissement et le fractionnement interdit ?',
        options: [
          'L’allotissement est réservé aux marchés de gré à gré',
          'Dans l’allotissement, le seuil de procédure est calculé sur la valeur cumulée de tous les lots',
          'Le fractionnement est autorisé s’il est signé par le comptable',
          'Il n’existe aucune différence entre les deux notions'
        ],
        correctIndex: 1,
        explanation:
          'L’allotissement est légal et encouragé car tous les lots restent soumis à la procédure correspondant à leur montant cumulé, contrairement au fractionnement qui vise à contourner les seuils.'
      }
    ]
  },
  {
    id: 'MOD-003',
    code: 'MP-RDC-301',
    title: 'Procédures de Passation, Ouverture des Plis, Évaluation et ANO',
    category: 'Contrôle',
    targetAudience: ['cgpmp_member', 'dgcmp_agent', 'armp_agent', 'dfat_admin', 'formateur'],
    duration: '10 Heures',
    level: 'Avancé',
    legalRef: 'Loi n° 10/010 (Art. 26 à 55) & Décret n° 10/22',
    description:
      'Maîtrisez la conduite opérationnelle des appels d’offres ouverts ou restreints, les conditions strictes du gré à gré, la séance publique d’ouverture des plis, les travaux de la sous-commission d’analyse et le circuit de l’ANO.',
    coverImage: imgCoverAudit,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 985,
    requiresDfatApproval: true,
    lessons: [
      {
        id: 'L-301-1',
        title: 'Appel d’Offres Ouvert, Restreint et Conditions du Gré à Gré',
        duration: '60 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 26 Loi 10/010 (L’Appel d’Offres est la règle)',
          'Art. 28 Loi 10/010 (Appel d’Offres Ouvert)',
          'Art. 32 Loi 10/010 (Appel d’Offres Restreint)',
          'Art. 42 & 43 Loi 10/010 (Conditions strictes du Gré à Gré)'
        ],
        content: `[Scène: open_competition_access] L’Appel d’Offres Ouvert comme règle d’or démocratique : En République Démocratique du Congo, l’appel d’offres ouvert est la voie royale qui garantit à chaque entreprise compétente le droit de concourir au grand jour et aux citoyens l’assurance d’obtenir la meilleure offre pour la collectivité. | Application terrain : Accordez toujours le délai légal complet d’au moins trente jours calendaires afin que les candidats des provinces disposent du temps nécessaire pour déposer leur offre.

[Scène: construction_crane] Pré-qualification pour les grands ouvrages complexes : Lorsqu’il s’agit de bâtir un grand pont, un barrage hydroélectrique ou un hôpital de référence, une étape préalable de pré-qualification permet de vérifier sereinement quelles entreprises disposent de l’expérience humaine et technique requise. | Application terrain : Utilisez la pré-qualification pour les grands projets d’infrastructures afin d’accompagner un dialogue technique approfondi avec des candidats réellement qualifiés.

[Scène: scale_justice] Encadrement loyal de l’Appel d’Offres Restreint : Lorsqu’un équipement très pointu n’est maîtrisé que par un cercle restreint de spécialistes connus, l’appel d’offres restreint — préalablement autorisé par la DGCMP — permet de les mettre en concurrence équitablement sans alourdir inutilement la procédure. | Application terrain : Veillez à inviter simultanément tous les opérateurs qualifiés figurant sur la liste restreinte validée par la DGCMP pour préserver une vraie émulation.

[Scène: citizen_impact_law] Le gré à gré réservé aux urgences humaines impérieuses : Le marché de gré à gré n’est légitime que dans les situations exceptionnelles prévues par la loi, notamment lorsqu’une catastrophe naturelle, une épidémie ou un effondrement de pont exige une intervention immédiate pour secourir les populations. | Application terrain : Ne recourez jamais au gré à gré pour rattraper un simple retard administratif interne ; l’urgence impérieuse doit toujours être imprévisible et extérieure.

[Scène: dgcmp_shield] Autorisation préalable de la DGCMP et négociation juste des prix : Même en cas d’urgence autorisée en gré à gré par la DGCMP, l’acheteur public mène une négociation transparente et humaine sur le sous-détail des prix afin de protéger le budget de l’État tout en rémunérant justement l’entreprise mobilisée. | Application terrain : Rédigez un procès-verbal de négociation détaillant les coûts unitaires vérifiés avant de soumettre le contrat de gré à gré au contrôle de la DGCMP.`
      },
      {
        id: 'L-301-2',
        title: 'Réception des Offres, Séance Publique d’Ouverture et Évaluation',
        duration: '65 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 38 Loi 10/010 (Ouverture publique des plis)',
          'Art. 39 Loi 10/010 (Évaluation et comparaison des offres)',
          'Art. 40 Loi 10/010 (Attribution provisoire)',
          'Décret n° 10/22 (Fonctionnement de la Commission)'
        ],
        content: `[Scène: sealed_ballot_ano] Accueil respectueux des plis et rigueur de l’heure limite : Chaque soumissionnaire qui vient déposer son offre est accueilli avec courtoisie : son pli est immédiatement numéroté, horodaté avec précision et mis en sécurité dans l’urne jusqu’à l’heure officielle d’ouverture. | Application terrain : Pour respecter l’équité envers les entreprises arrivées à l’heure, refusez avec politesse mais fermeté tout pli présenté après l’heure limite officielle sans jamais l’ouvrir.

[Scène: transparency_traceability] Cérémonie publique d’ouverture et lecture à haute voix : La séance publique d’ouverture des plis est un moment solennel de démocratie administrative où, devant tous les candidats réunis, la commission ouvre chaque enveloppe et lit clairement à haute voix les prix et les garanties. | Application terrain : Ne rejetez aucune offre sur le fond pendant la séance publique d’ouverture ; contentez-vous de proclamer et de consigner fidèlement les éléments constatés au procès-verbal.

[Scène: intellectual_compass] Examen attentif et impartial en sous-commission d’analyse : Dans le calme de la sous-commission, les experts examinent avec conscience professionnelle la conformité administrative et la qualité technique de chaque offre au regard des besoins réels des futurs usagers de l’ouvrage. | Application terrain : En cas d’écart entre un montant en chiffres et un montant en lettres sur un bordereau, appliquez avec constance la règle légale qui donne foi au montant écrit en toutes lettres.

[Scène: scale_justice] Vérification arithmétique et classement équitable : Une fois les offres techniquement valides identifiées, la sous-commission vérifie honnêtement les opérations arithmétiques afin de classer les candidats en toute justice et d’identifier l’offre conforme évaluée la moins-disante. | Application terrain : Si une erreur de calcul arithmétique est corrigée selon les règles du DAO, informez-en par écrit le candidat afin qu’il confirme loyalement le montant rectifié.

[Scène: ministry_cgpmp] Post-qualification et prévention des offres anormalement basses : Choisir le moins-disant ne signifie jamais sacrifier la qualité de l’école ou de la route : la commission vérifie que le lauréat possède réellement les équipes qualifiées et que son prix permet de payer dignement les matériaux et les ouvriers. | Application terrain : Si une offre paraît anormalement basse et dangereuse pour la survie du chantier, demandez par écrit des explications économiques précises au candidat avant de statuer.`
      },
      {
        id: 'L-301-3',
        title: 'Circuit de l’Avis de Non-Objection (ANO), Standstill et Signature',
        duration: '50 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 14 Loi 10/010 (Visa ANO de la DGCMP)',
          'Art. 45 Loi 10/010 (Notification et délai d’attente / Standstill)',
          'Art. 46 Loi 10/010 (Approbation et entrée en vigueur)',
          'Art. 47 Loi 10/010 (Garantie de bonne exécution)'
        ],
        content: `[Scène: dgcmp_shield] Revue du rapport d’analyse et délivrance du visa ANO : Avant d’annoncer le résultat, l’Autorité Contractante soumet le rapport d’évaluation et toutes les offres originales au regard extérieur et objectif de la DGCMP afin d’obtenir l’Avis de Non-Objection qui valide l’équité du choix. | Application terrain : Assurez-vous que chaque membre de la sous-commission a signé le rapport et annexé ses grilles d’évaluation avant la transmission à la DGCMP.

[Scène: transparency_traceability] Publication de l’attribution provisoire et respect des candidats évincés : Dès l’obtention de l’ANO, l’administration publie l’attribution provisoire et prend soin d’écrire à chaque candidat non retenu pour lui expliquer avec transparence et respect pourquoi son offre n’a pas été sélectionnée. | Application terrain : Libérez rapidement les garanties de soumission des candidats non retenus dès la conclusion du contrat afin de ne pas bloquer inutilement leur trésorerie.

[Scène: gavel_tribunal] Le délai d’attente de standstill, garantie de paix et d’écoute : Observer le délai légal de quinze jours ouvrables avant de signer le contrat est une preuve de maturité démocratique qui laisse à tout candidat s’estimant lésé le temps d’être entendu par un recours gracieux. | Application terrain : Ne signez jamais un contrat pendant le délai de standstill ; respecter cette pause légale protège l’administration contre toute annulation ultérieure du marché.

[Scène: legal_codex] Signature, approbation officielle et naissance juridique du contrat : Une fois le délai d’attente écoulé en toute sérénité, le contrat est signé, approuvé par l’autorité compétente, enregistré et officiellement notifié à l’entreprise lauréate, scellant un engagement réciproque au service du bien commun. | Application terrain : N’autorisez aucun début d’exécution sur le chantier tant que le contrat approuvé n’a pas été formellement notifié par écrit au titulaire.

[Scène: bank_guarantee_vault] Garantie de bonne exécution et lancement serein du chantier : En remettant sa garantie bancaire de bonne exécution dans les vingt jours suivant la notification, l’entreprise démontre sa solidité et reçoit l’ordre de service lui permettant de mobiliser ses équipes sur le terrain. | Application terrain : Vérifiez toujours l’authenticité de la caution bancaire auprès de la banque émettrice avant d’ordonner le versement de l’avance de démarrage.`
      }
    ],
    quiz: [
      {
        question: 'Que doit faire la Commission de Passation des Marchés lorsqu’un pli arrive 10 minutes après l’heure limite fixée dans le DAO ?',
        options: [
          'L’accepter exceptionnellement si le candidat invoque les embouteillages',
          'Le déclarer irrecevable hors délai et le restituer sans l’ouvrir',
          'L’ouvrir avec une pénalité de 2 points sur la note technique',
          'Demander un vote à main levée des autres candidats présents'
        ],
        correctIndex: 1,
        explanation:
          'Le respect de la date et de l’heure limites de dépôt des offres est une règle d’ordre public garantissant l’égalité des candidats. Tout pli arrivé hors délai est écarté sans être ouvert.'
      },
      {
        question: 'Pourquoi l’Autorité Contractante doit-elle obligatoirement respecter le délai de standstill après la publication de l’attribution provisoire ?',
        options: [
          'Pour permettre aux candidats évincés d’exercer leur droit de recours préalable avant la signature du contrat',
          'Pour permettre au titulaire de commencer les travaux avant la signature',
          'Pour renégocier à la hausse le montant de l’offre',
          'Pour modifier les critères d’évaluation du DAO'
        ],
        correctIndex: 0,
        explanation:
          'L’article 45 impose ce délai d’attente (standstill) afin de garantir l’effectivité du droit au recours suspensif des soumissionnaires évincés avant que le contrat ne soit signé.'
      },
      {
        question: 'Dans quel cas le recours au marché de gré à gré pour « urgence impérieuse » est-il illégal ?',
        options: [
          'Lorsqu’il survient après une catastrophe naturelle imprévisible',
          'Lorsque l’urgence résulte du retard ou de la négligence de l’Autorité Contractante elle-même',
          'Lorsqu’il a reçu l’autorisation préalable de la DGCMP',
          'Lorsqu’il fait l’objet d’un procès-verbal de négociation des prix'
        ],
        correctIndex: 1,
        explanation:
          'Aux termes de l’article 43, les circonstances justificatives de l’urgence impérieuse ne doivent en aucun cas être imputables à l’Autorité Contractante.'
      }
    ]
  },
  {
    id: 'MOD-004',
    code: 'MP-RDC-401',
    title: 'Gestion des Contrats, Garanties, Avenants et Réceptions',
    category: 'Gestion & Audit',
    targetAudience: ['cgpmp_member', 'dgcmp_agent', 'armp_agent', 'particulier', 'dfat_admin', 'formateur'],
    duration: '7 Heures',
    level: 'Intermédiaire',
    legalRef: 'Loi n° 10/010 (Art. 47 à 65) & CCAG RDC',
    description:
      'Sécurisez la phase d’exécution physique et financière des marchés publics : gestion des garanties bancaires, décomptes, encadrement légal des avenants, pénalités de retard et réceptions provisoire et définitive.',
    coverImage: imgCoverSeminar,
    chaptersCount: 3,
    rating: 4.8,
    studentsCount: 890,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-401-1',
        title: 'Garanties Financières, Avances et Décomptes d’Exécution',
        duration: '50 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 47 Loi 10/010 (Garantie de bonne exécution)',
          'Art. 48 Loi 10/010 (Garantie de remboursement d’avance)',
          'Art. 49 Loi 10/010 (Retenue de garantie)',
          'Art. 56 Loi 10/010 (Règlement des acomptes et intérêts moratoires)'
        ],
        content: `[Scène: bank_guarantee_vault] La garantie de bonne exécution, bouclier contre l’abandon de chantier : Fixée entre trois et cinq pour cent du montant du contrat, cette garantie bancaire protège la communauté contre le drame d’une école ou d’un pont laissé inachevé en assurant que l’entreprise honorera ses engagements jusqu’au bout. | Application terrain : Exigez une garantie émise par une banque agréée en RDC et vérifiez attentivement sa date de validité par rapport au calendrier réel des travaux.

[Scène: bank_guarantee_vault] Sécuriser à cent pour cent l’avance de démarrage tout en soutenant le chantier : Verser une avance de démarrage aide concrètement l’entrepreneur à mobiliser ses équipes et ses matériaux, mais chaque franc public avancé doit être intégralement couvert à cent pour cent par une caution bancaire de remboursement. | Application terrain : Remboursez progressivement l’avance par déduction sur chaque décompte mensuel au fur et à mesure que l’ouvrage sort de terre.

[Scène: construction_crane] Retenue de garantie et protection durable de la qualité de l’ouvrage : Prélever une retenue plafonnée à cinq pour cent — ou accepter une caution équivalente — responsabilise l’entrepreneur sur la solidité réelle de son travail pendant toute l’année d’épreuve technique suivant la livraison. | Application terrain : Ne libérez cette retenue de garantie qu’après avoir constaté sur place, à la fin du délai d’épreuve, qu’aucun vice caché ne compromet l’ouvrage.

[Scène: audit_scanner] Certification contradictoire sur le terrain avant tout paiement d’acompte : Payer le juste prix du travail accompli exige de se rendre sur le chantier pour mesurer ensemble, contradictoirement, les quantités réellement exécutées avant de valider chaque décompte périodique. | Application terrain : Ne validez jamais une facture depuis un bureau ; exigez toujours la feuille d’attachement signée sur le chantier par l’ingénieur de contrôle et l’entreprise.

[Scène: scale_justice] Payer à temps et respecter les intérêts moratoires pour préserver les emplois : Une administration humaine et responsable paie ses fournisseurs dans les délais convenus ; retarder injustement un paiement fragilise les salaires des ouvriers et déclenche de plein droit le paiement d’intérêts moratoires par l’État. | Application terrain : Horodatez chaque facture dès son dépôt à la CGPMP et suivez son circuit de liquidation pour honorer la signature de l’État sans retard.`
      },
      {
        id: 'L-401-2',
        title: 'Encadrement des Avenants, Pénalités et Résiliation',
        duration: '55 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 52 Loi 10/010 (Régime et plafond des avenants)',
          'Art. 53 Loi 10/010 (Révision des prix)',
          'Art. 58 Loi 10/010 (Pénalités de retard)',
          'Art. 61 à 64 Loi 10/010 (Ajournement et résiliation)'
        ],
        content: `[Scène: threshold_gauge] Encadrement strict des avenants et plafond protecteur de quinze pour cent : Un chantier peut rencontrer des imprévus techniques, mais l’avenant ne doit jamais servir à contourner la concurrence initiale ; la loi le soumet à l’ANO de la DGCMP et plafonne son montant cumulé à quinze pour cent. | Application terrain : Si des adaptations techniques dépassent le plafond légal de quinze pour cent, préparez en toute transparence une nouvelle procédure de passation.

[Scène: legal_codex] Distinguer l’ajustement des quantités de la création de travaux nouveaux : Savoir gérer un contrat avec discernement consiste à régler les simples variations de quantités prévues au devis par ordre de service, tout en exigeant un avenant formel dès qu’un prix nouveau apparaît. | Application terrain : Ne demandez jamais à une entreprise d’exécuter des travaux supplémentaires sur simple parole ; formalisez toujours un ordre de service écrit et budgété.

[Scène: scale_justice] La révision contractuelle des prix face aux réalités économiques : Lorsque le coût mondial de l’acier ou du carburant flambe sur un chantier de longue durée, la formule de révision prévue au contrat préserve l’équilibre économique afin que l’entreprise puisse achever l’ouvrage sans faillite. | Application terrain : Vérifiez que la formule de révision utilise exclusivement les indices officiels prévus au CCAP avant d’accorder tout ajustement financier.

[Scène: dao_calendar] Les pénalités de retard, rappel du temps précieux des usagers : Chaque mois de retard sur la livraison d’une maternité ou d’une route pénalise directement les familles qui l’attendent ; les pénalités journalières s’appliquent donc automatiquement pour encourager le respect du calendrier promis. | Application terrain : En cas de force majeure réelle et prouvée, accordez avec équité un avenant de prolongation de délai plutôt que d’appliquer des pénalités injustes.

[Scène: gavel_tribunal] Mise en demeure loyale et résiliation face à une défaillance grave : Même face à une entreprise défaillante, l’administration agit avec droit et humanité en lui adressant d’abord une mise en demeure claire de se ressaisir avant de prononcer, en dernier ressort, la résiliation protectrice de l’intérêt public. | Application terrain : Dressez toujours un état contradictoire des travaux réalisés sur place avant de clore un chantier résilié afin de sauvegarder les droits de chacun.`
      },
      {
        id: 'L-401-3',
        title: 'Réception Provisoire, Délai de Garantie et Réception Définitive',
        duration: '45 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 59 Loi 10/010 (Réception provisoire et définitive)',
          'CCAG Travaux & Fournitures RDC',
          'Manuel d’exécution et de clôture des marchés ARMP'
        ],
        content: `[Scène: construction_crane] La réception provisoire, examen attentif de l’ouvrage remis aux citoyens : Lorsque les travaux s’achèvent, la commission parcourt chaque salle et chaque ouvrage avec l’entrepreneur pour vérifier que la qualité promise est bien au rendez-vous avant de signer le procès-verbal de réception provisoire. | Application terrain : Notez avec précision toute imperfection constatée sur une liste de réserves annexée au procès-verbal et fixez un délai court pour la corriger.

[Scène: dao_calendar] L’année de garantie technique, épreuve de vérité dans l’usage quotidien : Dès la réception provisoire, l’école ou la route accueille ses premiers usagers tandis que s’ouvre une période de garantie d’un an durant laquelle l’entrepreneur reste tenu de réparer à ses frais tout défaut qui apparaîtrait. | Application terrain : Organisez des visites de suivi avec les utilisateurs du bâtiment pendant l’année de garantie pour signaler à temps toute anomalie technique.

[Scène: intellectual_compass] Remise des plans de récolement et formation des équipes locales : Un ouvrage public n’est vraiment livré que lorsque les techniciens congolais chargés de l’entretenir disposent des plans exacts d’exécution, des manuels en français et du savoir-faire nécessaire pour en assurer la maintenance. | Application terrain : Subordonnez le règlement du solde à la remise complète des dossiers techniques de maintenance et à la formation pratique des agents utilisateurs.

[Scène: citizen_impact_law] La réception définitive, consécration d’un investissement durable : Au terme de l’année de garantie, lorsque toutes les réserves ont été levées et que l’ouvrage sert pleinement la population, la réception définitive est prononcée et libère honorablement l’entrepreneur de ses sûretés. | Application terrain : Délivrez immédiatement la mainlevée de la retenue de garantie dès la signature du procès-verbal de réception définitive.

[Scène: transparency_traceability] Décompte général définitif et mémoire exemplaire du dossier : Clôturer un marché avec rigueur par un Décompte Général et Définitif signé des deux parties et un archivage complet permet de laisser une trace limpide du bon usage de l’argent public. | Application terrain : Rassemblez dans un dossier unique toutes les pièces depuis le PPM jusqu’à la réception définitive pour faciliter le travail des auditeurs.`
      }
    ],
    quiz: [
      {
        question: 'Au-delà de quel pourcentage cumulé du montant initial du marché un avenant ne peut-il plus être conclu en RDC ?',
        options: ['5 %', '15 %', '30 %', '50 %'],
        correctIndex: 1,
        explanation:
          'L’article 52 de la Loi n° 10/010 plafonne le montant cumulé des avenants à 15 % de la valeur du marché initial et exige l’Avis de Non-Objection préalable de la DGCMP.'
      },
      {
        question: 'Quel acte marque l’extinction définitive des réserves et permet la restitution de la retenue de garantie ?',
        options: [
          'L’ordre de service de démarrage',
          'Le procès-verbal d’ouverture des plis',
          'Le procès-verbal de réception définitive',
          'L’avis d’appel d’offres'
        ],
        correctIndex: 2,
        explanation:
          'La réception définitive, prononcée à l’issue du délai de garantie après levée de toutes les réserves, libère la retenue de garantie ou la caution qui en tient lieu.'
      },
      {
        question: 'À quelle condition une avance de démarrage peut-elle être versée au titulaire d’un marché public ?',
        options: [
          'Sur simple lettre de demande du directeur commercial',
          'Après constitution d’une garantie bancaire de remboursement d’avance couvrant 100 % de son montant',
          'Avant même la signature et l’approbation du contrat',
          'En espèces directement à la caisse du ministère'
        ],
        correctIndex: 1,
        explanation:
          'Conformément à l’article 48 de la Loi n° 10/010, toute avance de démarrage doit obligatoirement être couverte à 100 % par une garantie bancaire de remboursement d’avance.'
      }
    ]
  },
  {
    id: 'MOD-005',
    code: 'MP-RDC-501',
    title: 'Contentieux, Recours (CRD/ARMP), Audits et Régime des Sanctions',
    category: 'Contentieux',
    targetAudience: ['armp_agent', 'dgcmp_agent', 'cgpmp_member', 'particulier', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Spécialisé',
    legalRef: 'Loi n° 10/010 (Art. 73 à 82) & Décret n° 10/21',
    description:
      'Maîtrisez la gestion des litiges de passation et d’exécution, la procédure de recours suspensif devant le Comité de Règlement des Différends (CRD) de l’ARMP, les audits indépendants et les sanctions pénales et administratives.',
    coverImage: imgCoverAudit,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 760,
    requiresDfatApproval: true,
    lessons: [
      {
        id: 'L-501-1',
        title: 'Recours Gracieux et Arbitrage du CRD (ARMP)',
        duration: '55 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 73 Loi 10/010 (Recours gracieux préalable obligatoire)',
          'Art. 74 Loi 10/010 (Saisine du CRD de l’ARMP)',
          'Art. 75 Loi 10/010 (Effet suspensif de plein droit)',
          'Art. 76 Loi 10/010 (Décision exécutoire du CRD)'
        ],
        content: `[Scène: transparency_traceability] Le recours gracieux préalable, privilégier le dialogue et l’écoute : Avant tout conflit ouvert, la loi invite le candidat qui s’estime lésé à s’adresser d’abord par écrit à l’Autorité Contractante dans les cinq jours ouvrables, offrant à l’administration l’occasion d’écouter et de corriger d’elle-même une erreur. | Application terrain : Déposez toujours votre recours gracieux contre un accusé de réception daté afin de sécuriser la preuve du respect du délai légal.

[Scène: armp_tower] Saisine du Comité de Règlement des Différends de l’ARMP : Si l’administration rejette la réclamation ou garde le silence, le candidat dispose de trois jours ouvrables pour saisir le Comité de Règlement des Différends de l’ARMP, gardien indépendant de la justice contractuelle. | Application terrain : Joignez à votre requête devant le CRD la copie du recours gracieux initial, le récépissé de dépôt et les pièces démontrant l’irrégularité.

[Scène: gavel_tribunal] L’effet suspensif automatique, protéger les droits avant qu’il ne soit trop tard : Pour éviter la politique du fait accompli, l’introduction d’un recours dans les délais suspend immédiatement et de plein droit la procédure de signature jusqu’à ce que le juge administratif de l’ARMP ait rendu sa décision. | Application terrain : Dès la réception d’un recours régulier pendant le délai de standstill, suspendez immédiatement tout acte de signature du contrat.

[Scène: scale_justice] Instruction contradictoire et écoute équitable par le jury tripartite du CRD : Réunissant l’État, le secteur privé et la société civile, le CRD écoute les arguments des deux parties avec impartialité et statue sous quinze jours ouvrables pour rétablir le droit. | Application terrain : L’Autorité Contractante doit transmettre sans délai toutes les pièces originales d’évaluation au CRD pour permettre un examen contradictoire loyal.

[Scène: legal_codex] Force exécutoire des décisions du CRD et apaisement des litiges : Les décisions du CRD s’imposent immédiatement à tous pour assainir la passation, tandis que les différends techniques ou financiers en cours de chantier privilégient d’abord la conciliation amiable avant le juge ou l’arbitre. | Application terrain : Appliquez loyalement et sans délai toute décision de correction ou de reprise d’évaluation ordonnée par le Comité de Règlement des Différends.`
      },
      {
        id: 'L-501-2',
        title: 'Audits Indépendants, Contrôle A Posteriori et Redevabilité',
        duration: '50 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 15 Loi 10/010 (Missions d’audit de l’ARMP)',
          'Art. 71 & 72 Loi 10/010 (Contrôle a posteriori et archivage)',
          'Loi n° 11/011 relative aux Finances Publiques (LPF)'
        ],
        content: `[Scène: audit_scanner] Le contrôle a posteriori de l’ARMP, parce que chaque franc compte : Même les marchés de moindre montant passés sous le seuil d’ANO sont examinés a posteriori par les auditeurs indépendants de l’ARMP, rappelant que la rigueur et l’honnêteté s’appliquent à chaque dépense publique. | Application terrain : Soignez la tenue des dossiers de demandes de cotation avec la même exigence documentaire que vos grands appels d’offres.

[Scène: transparency_traceability] La piste d’audit documentaire, raconter fidèlement l’histoire du marché : Un dossier bien tenu permet à tout vérificateur de suivre pas à pas le cheminement honnête de la décision, depuis l’expression du besoin au PPM jusqu’au procès-verbal de réception finale. | Application terrain : Utilisez une fiche de suivi numérotée dans chaque chemise de marché pour vérifier en un coup d’œil qu’aucune pièce obligatoire ne manque.

[Scène: construction_crane] L’audit physique de matérialité sur le terrain, vérifier la réalité des ouvrages : L’audit véritable sort des bureaux pour aller sur le terrain vérifier que l’école, le forage ou la route payés par le Trésor public existent réellement et servent dignement les habitants. | Application terrain : Joignez à chaque décompte des photos datées et géolocalisées montrant clairement l’avancement physique réel des travaux sur le site.

[Scène: dgcmp_shield] Synergie des contrôles avec l’IGF et la Cour des Comptes : La protection du patrimoine commun repose sur la complémentarité entre les audits techniques de l’ARMP, la vigilance financière de l’Inspection Générale des Finances et le contrôle juridictionnel de la Cour des Comptes. | Application terrain : Veillez à une concordance parfaite entre les montants engagés au budget et les contrats enregistrés auprès de la DGCMP.

[Scène: citizen_impact_law] Publication des rapports d’audit et progrès continu au service du citoyen : Rendre publics les rapports d’audit n’a pas pour seul but de pointer les erreurs, mais surtout d’éclairer les citoyens et d’aider chaque administration à progresser en compétence et en intégrité. | Application terrain : Transformez chaque recommandation d’audit en plan d’amélioration concret partagé avec toute l’équipe de votre CGPMP.`
      },
      {
        id: 'L-501-3',
        title: 'Éthique, Conflits d’Intérêts et Régime des Sanctions',
        duration: '50 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 77 & 78 Loi 10/010 (Infractions des candidats et agents publics)',
          'Art. 79 Loi 10/010 (Exclusion temporaire ou définitive par l’ARMP)',
          'Art. 80 à 82 Loi 10/010 (Nullité des contrats et sanctions pénales)',
          'Charte d’éthique des acteurs de la commande publique'
        ],
        content: `[Scène: scale_justice] Prévenir les conflits d’intérêts par la transparence et l’honneur personnel : L’intégrité commence dans la conscience de chaque évaluateur : se récuser spontanément lorsqu’un proche parent ou un associé soumissionne est le plus bel acte de respect envers le service public. | Application terrain : Faites signer à chaque membre de commission une déclaration individuelle d’absence de conflit d’intérêts avant l’ouverture des plis.

[Scène: audit_scanner] Démasquer les ententes illicites et les faux documents qui lèsent la collectivité : Lorsque des entreprises truquent leurs prix ou présentent de fausses attestations fiscales, elles pénalisent les entrepreneurs honnêtes et privent les citoyens d’infrastructures au juste prix. | Application terrain : Vérifiez systématiquement l’authenticité des attestations fiscales, sociales et bancaires auprès des organismes émetteurs avant toute attribution.

[Scène: armp_tower] La liste d’exclusion de l’ARMP pour protéger l’intégrité du marché : En écartant temporairement ou définitivement les entreprises coupables de fraude ou de corruption, l’ARMP assainit l’économie nationale et encourage les opérateurs intègres qui travaillent dans le respect des lois. | Application terrain : Consultez toujours la liste officielle des entreprises exclues publiée par l’ARMP avant de proposer l’attribution d’un marché.

[Scène: gavel_tribunal] Responsabilité personnelle de l’agent public gardien de la confiance : Recevoir la mission de gérer l’argent public est un honneur qui engage la responsabilité disciplinaire et pénale de l’agent ; trahir le secret des offres ou favoriser un candidat détruit le lien de confiance avec la nation. | Application terrain : Protégez strictement la confidentialité des estimations et des délibérations jusqu’à la publication officielle des résultats.

[Scène: legal_codex] Nullité absolue des contrats entachés de corruption et engagement d’intégrité : Un contrat obtenu par la fraude ou la corruption ne peut produire aucun droit durable ; la loi le frappe de nullité absolue afin que l’intérêt général triomphe toujours des arrangements illicites. | Application terrain : Exigez dans chaque offre la charte d’engagement d’intégrité dûment signée par le dirigeant de l’entreprise soumissionnaire.`
      }
    ],
    quiz: [
      {
        question: 'Quel est l’effet immédiat d’un recours régulièrement introduit dans les délais légaux devant l’Autorité Contractante ou le CRD ?',
        options: [
          'Il permet de signer le contrat plus rapidement',
          'Il suspend de plein droit la procédure de passation jusqu’à la décision définitive',
          'Il annule automatiquement le budget du ministère',
          'Il remplace la sous-commission d’évaluation par un tirage au sort'
        ],
        correctIndex: 1,
        explanation:
          'Conformément à l’article 75 de la Loi n° 10/010, le recours exercé dans les délais légaux a un effet suspensif automatique sur la poursuite de la procédure de passation.'
      },
      {
        question: 'Quelle autorité a le pouvoir de prononcer l’exclusion temporaire ou définitive (liste noire) d’une entreprise coupable de fraude ?',
        options: [
          'La Fédération des Entreprises du Congo (FEC)',
          'L’Autorité de Régulation des Marchés Publics (ARMP)',
          'Le fournisseur concurrent classé deuxième',
          'La banque commerciale du soumissionnaire'
        ],
        correctIndex: 1,
        explanation:
          'L’article 79 confère à l’ARMP le pouvoir de prononcer des sanctions d’exclusion temporaire ou définitive de toute participation aux marchés publics.'
      },
      {
        question: 'Que doit faire un membre de la sous-commission d’analyse s’il découvre qu’un candidat est dirigé par un proche parent ?',
        options: [
          'Noter ce candidat avec bienveillance',
          'Déclarer immédiatement le conflit d’intérêts par écrit et se récuser des travaux d’évaluation',
          'Garder le silence jusqu’à la fin de l’audit annuel',
          'Demander l’annulation complète du budget de l’État'
        ],
        correctIndex: 1,
        explanation:
          'Tout membre en situation de conflit d’intérêts a l’obligation déontologique et légale de le déclarer immédiatement et de s’abstenir de participer à la procédure.'
      }
    ]
  },
  {
    id: 'MOD-006',
    code: 'MP-RDC-601',
    title: 'Dématérialisation des Marchés Publics, E-Procurement et SIGMAP',
    category: 'Gestion & Audit',
    targetAudience: ['cgpmp_member', 'dgcmp_agent', 'armp_agent', 'particulier', 'dfat_admin', 'formateur'],
    duration: '6 Heures',
    level: 'Avancé',
    legalRef: 'Décret n° 10/22 & Directives E-Procurement ARMP / DGCMP',
    description:
      'Préparez-vous à la transformation numérique de la commande publique en RDC : utilisation du Système Intégré de Gestion des Marchés Publics (SIGMAP), publication électronique, traçabilité numérique et gouvernance des données ouvertes.',
    coverImage: imgCoverFormation,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 640,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-601-1',
        title: 'Architecture du SIGMAP et Traçabilité Numérique',
        duration: '45 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 37 Loi 10/010 (Supports électroniques de publicité)',
          'Directives DGCMP/ARMP sur le déploiement du SIGMAP',
          'Normes d’interopérabilité avec la chaîne de la dépense publique'
        ],
        content: `[Scène: sigmap_server] Le SIGMAP, mettre le numérique au service de la clarté humaine : Le Système Intégré de Gestion des Marchés Publics n’est pas une simple machine informatique ; c’est un outil d’équité qui accompagne les acheteurs publics de la planification du PPM jusqu’au paiement final sans perte de dossier. | Application terrain : Enregistrez chaque marché dans le SIGMAP dès sa validation budgétaire pour lui attribuer son identifiant national unique.

[Scène: dgcmp_shield] Des garde-fous automatisés pour sécuriser le travail des agents : En vérifiant automatiquement les délais légaux de publicité et la présence des visas ANO requis, le système numérique protège les agents de bonne foi contre les oublis procéduraux et bloque les contournements. | Application terrain : Téléversez toutes les pièces signées au format numérique certifié avant de soumettre votre demande d’ANO en ligne.

[Scène: threshold_gauge] Interconnexion avec la chaîne de la dépense pour assainir les paiements : Relier directement le SIGMAP au système budgétaire de l’État garantit que chaque franc engagé correspond à un contrat réel et régulier, accélérant ainsi le paiement honnête des entreprises. | Application terrain : Vérifiez la concordance exacte du code d’imputation budgétaire entre la loi de finances et la fiche marché du SIGMAP.

[Scène: transparency_traceability] Horodatage inaltérable et fin des antidates : Grâce à l’empreinte numérique horodatée à chaque étape, la vérité chronologique des actes est protégée, valorisant le travail rigoureux des commissions et rendant impossible toute manipulation après coup. | Application terrain : Connectez-vous toujours avec votre identifiant nominatif personnel pour valider les actes relevant de votre fonction.

[Scène: allotment_puzzle] Pilotage en temps réel pour mesurer l’impact économique et PME : Les tableaux de bord du SIGMAP permettent de voir en direct si les projets avancent à temps et si les PME congolaises accèdent réellement à la commande publique dans chaque province. | Application terrain : Consultez chaque semaine les alertes du tableau de bord pour anticiper l’échéance des délais de validité des offres et des cautions.`
      },
      {
        id: 'L-601-2',
        title: 'Soumission Électronique, Coffre-Fort Numérique et Sécurité',
        duration: '50 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Ordonnance-Loi n° 23/010 portant Code du Numérique en RDC',
          'Dispositions relatives aux échanges électroniques dans les DAO',
          'Standards de chiffrement et d’horodatage des plis électroniques'
        ],
        content: `[Scène: open_competition_access] Abolir les distances géographiques grâce à l’accès numérique aux DAO : Permettre à une entreprise de Goma, de Mbuji-Mayi ou de Matadi de télécharger gratuitement ou instantanément un Dossier d’Appel d’Offres en ligne rétablit une véritable égalité des chances sur tout le territoire national. | Application terrain : Publiez simultanément toutes les réponses aux questions des candidats sur le portail afin que chacun reçoive une alerte immédiate.

[Scène: sealed_ballot_ano] Le coffre-fort électronique chiffré, garant du secret absolu des plis : Déposer son offre dans un coffre-fort numérique à chiffrement asymétrique rassure pleinement le soumissionnaire : personne, pas même l’administrateur système, ne peut lire ses prix avant l’heure officielle d’ouverture. | Application terrain : Conseillez aux candidats d’anticiper le dépôt électronique de leurs offres vingt-quatre heures avant la clôture pour éviter tout stress lié à la connexion.

[Scène: dao_calendar] L’accusé de réception horodaté à la seconde près, preuve de confiance : Dès que le pli numérique est déposé, le candidat reçoit immédiatement un récépissé électronique horodaté qui sécurise son travail et élimine toute contestation humaine sur l’heure d’arrivée. | Application terrain : Rappelez aux soumissionnaires que le serveur clôt automatiquement la réception des plis à la seconde exacte fixée dans l’avis d’appel d’offres.

[Scène: legal_codex] La signature électronique qualifiée, un engagement juridique moderne : Le droit congolais du numérique reconnaît à la signature électronique qualifiée la même valeur d’engagement solennel qu’une signature manuscrite, tout en garantissant que le document n’a subi aucune altération. | Application terrain : Vérifiez lors de la séance d’ouverture que le certificat électronique du signataire de l’offre est bien valide et non révoqué.

[Scène: sigmap_server] Ouverture numérique simultanée et transparence partagée en direct : Le déverrouillage conjoint des plis par les clés cryptographiques des membres de la commission permet une séance d’ouverture limpide que chaque soumissionnaire peut suivre en salle ou à distance. | Application terrain : Projetez en direct l’écran de décryptage des offres et publiez immédiatement le procès-verbal généré par le système.`
      },
      {
        id: 'L-601-3',
        title: 'Open Contracting Data Standard (OCDS) et Transparence Citoyenne',
        duration: '40 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Principes de transparence (Art. 1er Loi 10/010)',
          'Standard international Open Contracting (OCDS)',
          'Portail public de publication de l’ARMP (www.armp-rdc.org)'
        ],
        content: `[Scène: transparency_traceability] Les données ouvertes OCDS pour rendre des comptes aux citoyens : Publier en format ouvert chaque étape du marché — de la planification jusqu’à l’exécution réelle — permet aux citoyens, aux chercheurs et aux entreprises de comprendre comment l’argent public transforme le pays. | Application terrain : Renseignez systématiquement l’objet clair du marché, le nom de l’attributaire et le montant exact lors de chaque publication en ligne.

[Scène: audit_scanner] Détecter tôt les anomalies pour protéger l’équité de la concurrence : L’analyse intelligente des données aide les régulateurs à repérer rapidement les situations anormales, comme des appels d’offres à candidat unique répétés, afin d’accompagner les acheteurs vers plus d’ouverture. | Application terrain : Lorsqu’un appel d’offres reçoit moins de trois plis, interrogez-vous avec honnêteté sur la clarté de la publicité et l’ouverture des critères techniques.

[Scène: citizen_impact_law] Le contrôle citoyen de proximité sur les chantiers d’écoles et de santé : Lorsqu’un habitant peut lire sur le portail public et sur le panneau du chantier quel budget a été alloué à l’école de son quartier et quand elle doit ouvrir, toute la communauté devient gardienne de l’ouvrage. | Application terrain : Exigez dès le premier jour des travaux l’installation d’un panneau de chantier lisible indiquant le coût, la durée, l’entreprise et le maître d’ouvrage.

[Scène: sigmap_server] L’archivage numérique pérenne pour préserver la mémoire de l’État : Sauvegarder numériquement chaque dossier de marché protège le patrimoine administratif contre les incendies ou les pertes de documents et facilite la transmission du savoir entre générations d’agents publics. | Application terrain : Numérisez et indexez chaque procès-verbal signé et chaque caution bancaire dans les quarante-huit heures suivant leur validation.

[Scène: intellectual_compass] L’alliance de la compétence humaine et du numérique au service de la RDC : La technologie la plus avancée ne remplacera jamais la conscience morale, la compétence juridique et le sens humain de l’acheteur public qui œuvre chaque jour pour la dignité et le développement du Congo. | Application terrain : Alliez toujours la rigueur de la Loi n° 10/010, la transparence du SIGMAP et l’éthique professionnelle dans chacune de vos décisions.`
      }
    ],
    quiz: [
      {
        question: 'Quel est l’avantage majeur de l’horodatage cryptographique et du coffre-fort numérique dans une procédure e-Procurement ?',
        options: [
          'Permettre à la CGPMP de lire les offres financières trois jours avant la date limite',
          'Garantir l’inviolabilité des plis avant l’heure officielle d’ouverture et tracer de manière irréfutable l’heure exacte de dépôt',
          'Supprimer l’obligation de rédiger un Dossier d’Appel d’Offres',
          'Autoriser automatiquement les plis déposés en retard'
        ],
        correctIndex: 1,
        explanation:
          'Le chiffrement et l’horodatage cryptographique garantissent que nul ne peut prendre connaissance du contenu des offres avant la séance officielle d’ouverture et certifient le respect de l’heure limite.'
      },
      {
        question: 'Pourquoi l’interconnexion entre le SIGMAP et la chaîne informatisée de la dépense publique est-elle stratégique ?',
        options: [
          'Elle empêche tout engagement budgétaire ou paiement pour un marché qui n’a pas respecté les étapes légales de passation et de contrôle',
          'Elle permet de payer les fournisseurs sans facture ni réception',
          'Elle supprime le contrôle a priori de la DGCMP',
          'Elle remplace la signature de l’Autorité Approbatrice'
        ],
        correctIndex: 0,
        explanation:
          'L’interopérabilité garantit la conformité budgétaire et procédurale en conditionnant l’engagement et le paiement des fonds publics à la régularité du marché dans SIGMAP.'
      }
    ]
  }
];

export const INITIAL_COURSES: CourseModule[] = COURSES_DATA;
