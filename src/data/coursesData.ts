import { CourseModule } from '../types';
import imgCoverSeminar from '../assets/images/marches_publics_seminar_1789983166275.jpg';
import imgCoverFormation from '../assets/images/formation_numerique_1789983181347.jpg';
import imgCoverAudit from '../assets/images/expert_audit_cgpmp_1789983194702.jpg';
import imgCoverMentor from '../assets/images/mentor_juriste_africain_1789983212035.jpg';

export const COURSES_DATA: CourseModule[] = [
  {
    id: 'MOD-001',
    code: 'MP-RDC-101',
    title: 'Fondamentaux de la Loi n° 10/010 relative aux Marchés Publics',
    category: 'Réglementation',
    targetAudience: ['cgpmp_member', 'armp_agent', 'dgcmp_agent', 'pme', 'particulier', 'dfat_admin', 'formateur'],
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
    targetAudience: ['cgpmp_member', 'dgcmp_agent', 'pme', 'particulier', 'dfat_admin', 'formateur'],
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
    targetAudience: ['cgpmp_member', 'dgcmp_agent', 'pme', 'particulier', 'dfat_admin', 'formateur'],
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
    targetAudience: ['armp_agent', 'dgcmp_agent', 'pme', 'particulier', 'dfat_admin', 'formateur'],
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
    targetAudience: ['cgpmp_member', 'dgcmp_agent', 'armp_agent', 'pme', 'dfat_admin', 'formateur'],
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
  },
  {
    id: 'MOD-007',
    code: 'MP-RDC-701',
    title: 'Sous-Traitance, Contenu Local (Loi n° 17/001) et Accès des PME aux Marchés Publics',
    category: 'Réglementation',
    targetAudience: ['pme', 'particulier', 'armp_agent', 'dfat_admin', 'formateur'],
    duration: '7 Heures',
    level: 'Fondamental',
    legalRef: 'Loi n° 17/001 du 8 février 2017 & Loi n° 10/010 (Art. 19, 41 & 50)',
    description:
      'Parcours certifiant dédié aux PME congolaises et aux acheteurs publics : maîtrise de la Loi sur la sous-traitance, quota de 40 % réservé aux PME à capitaux congolais, marge de préférence nationale et mécanismes d’allotissement inclusif.',
    coverImage: imgCoverFormation,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 1120,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-701-1',
        title: 'Cadre Légal de la Sous-Traitance et Contenu Local (Loi 17/001 & Loi 10/010)',
        duration: '50 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Loi n° 17/001 du 8 février 2017 (Sous-traitance dans le secteur privé)',
          'Art. 50 Loi 10/010 (Conditions de la sous-traitance dans les marchés publics)',
          'Art. 41 Loi 10/010 (Préférence nationale et communautaire)'
        ],
        content: `[Scène: allotment_puzzle] Émergence d’une classe moyenne entrepreneuriale congolaise : L’accès des petites et moyennes entreprises congolaises à la commande publique est le moteur de la souveraineté économique et de la création d’emplois durables pour la jeunesse dans nos vingt-six provinces. | Application terrain : En tant que dirigeant de PME, enregistrez votre entreprise auprès de l’ARSP et de l’ANADEC afin de justifier votre éligibilité aux quotas de sous-traitance et aux marchés réservés.

[Scène: legal_codex] Articulation entre l’Article 50 de la Loi 10/010 et la Loi 17/001 : Dans tout marché public en RDC, le titulaire principal peut confier une part de l’exécution à des PME congolaises sous-traitantes, dans la limite légale de quarante pour cent de la valeur globale du marché. | Application terrain : Vérifiez toujours que le contrat de sous-traitance est formellement soumis à l’agrément préalable de l’Autorité Contractante avant le démarrage des prestations.

[Scène: scale_justice] Agrément obligatoire du sous-traitant et protection contre les abus : L’agrément préalable par le maître d’ouvrage protège la PME sous-traitante en vérifiant ses capacités techniques tout en lui ouvrant le droit au paiement direct ou sécurisé de ses prestations. | Application terrain : N’intervenez jamais sur un chantier public comme sous-traitant de fait sans un acte d’agrément signé par l’Autorité Contractante.

[Scène: citizen_impact_law] Marge de préférence nationale jusqu’à quinze pour cent : Lors des appels d’offres internationaux ou nationaux, la Loi n° 10/010 permet d’accorder une marge de préférence financière aux entreprises de droit congolais et aux biens manufacturés ou transformés localement. | Application terrain : Joignez à votre soumission les certificats d’origine et la structure du capital social prouvant la détention majoritaire par des nationaux congolais.

[Scène: bank_guarantee_vault] Paiement sécurisé des PME sous-traitantes et maintien de la trésorerie : Pour éviter que les grands attributaires ne retardent le règlement des PME locales, le cahier des charges peut prévoir le paiement direct des décomptes du sous-traitant agréé par le Trésor ou le bailleur. | Application terrain : Insérez dans votre convention de sous-traitance un échéancier de paiement adossé aux attachements contradictoires mensuels du chantier.`
      },
      {
        id: 'L-701-2',
        title: 'Allotissement Technique et Géographique en Faveur des PME Locales',
        duration: '45 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 19 al. 2 Loi 10/010 (Principe de l’allotissement)',
          'Décret n° 10/22 (Manuel de procédures ARMP - Allotissement)',
          'Directives ARMP sur la promotion des PME et de l’artisanat'
        ],
        content: `[Scène: allotment_puzzle] Structurer des lots adaptés aux capacités techniques des PME : Lorsqu’un ministère répartit un programme national en lots provinciaux ou par corps d’état, il permet aux PME de Kinshasa, Lubumbashi, Mbuji-Mayi, Kisangani ou Bukavu de soumissionner directement sans barrière disproportionnée. | Application terrain : Identifiez dès la publication du PPM les marchés allotis correspondant exactement au chiffre d’affaires et au matériel de votre PME.

[Scène: threshold_gauge] Proportionnalité des critères de qualification pour les lots PME : Une Autorité Contractante bienveillante calibre l’expérience exigée et le chiffre d’affaires moyen au montant spécifique de chaque lot, et non au budget global de l’ensemble du programme. | Application terrain : Si un DAO exige pour un petit lot le chiffre d’affaires du marché global, demandez par écrit un éclaircissement à la CGPMP au moins quinze jours avant l’ouverture.

[Scène: construction_crane] Valorisation des matériaux locaux et de la main-d’œuvre provinciale : Les marchés de construction d’écoles, de centres de santé et de routes de desserte agricole favorisent l’emploi des ingénieurs, techniciens et artisans résidant dans la province d’exécution. | Application terrain : Présentez dans votre offre technique un plan de recrutement local et d’approvisionnement auprès des producteurs congolais de votre province.

[Scène: open_competition_access] Accès simplifié aux Demandes de Cotation et marchés à procédure adaptée : Pour les achats courants sous le seuil d’appel d’offres, la procédure de Demande de Cotation offre aux jeunes PME une porte d’entrée rapide pour bâtir leurs premières références publiques. | Application terrain : Faites inscrire votre PME dans le répertoire officiel des fournisseurs et prestataires des CGPMP ministérielles et provinciales.

[Scène: transparency_traceability] Traçabilité des références de bonne exécution pour grandir : Chaque contrat public exécuté avec ponctualité donne droit à une attestation officielle de bonne fin d’exécution délivrée par l’Autorité Contractante, véritable passeport pour remporter des marchés plus importants. | Application terrain : À chaque réception définitive, sollicitez immédiatement votre certificat de bonne exécution signé par le maître d’ouvrage et archivez-le numériquement.`
      }
    ],
    quiz: [
      {
        question: 'Selon la réglementation des marchés publics en RDC, quel est le plafond maximal d’un marché public pouvant être confié en sous-traitance ?',
        options: ['10 % du montant du marché', '40 % du montant du marché', '80 % du montant du marché', '100 % du montant du marché'],
        correctIndex: 1,
        explanation:
          'Conformément à l’article 50 de la Loi n° 10/010, la sous-traitance ne peut en aucun cas dépasser 40 % de la valeur globale du marché et requiert l’agrément préalable de l’Autorité Contractante.'
      },
      {
        question: 'Quelle condition est indispensable pour qu’un sous-traitant PME soit juridiquement reconnu sur un chantier public ?',
        options: [
          'Un simple accord verbal avec le chef de chantier',
          'L’agrément préalable écrit de l’Autorité Contractante sur sa personne et ses conditions de paiement',
          'Le paiement d’une commission à la sous-commission d’analyse',
          'Une ancienneté minimale de 25 ans'
        ],
        correctIndex: 1,
        explanation:
          'Le titulaire doit obligatoirement obtenir l’agrément préalable de l’Autorité Contractante pour chaque sous-traitant et faire accepter ses conditions de paiement.'
      }
    ]
  },
  {
    id: 'MOD-008',
    code: 'MP-RDC-801',
    title: 'Montage d’une Offre Gagnante, Groupements PME (GME) et Garanties Bancaires',
    category: 'Passation',
    targetAudience: ['pme', 'particulier', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Intermédiaire',
    legalRef: 'Loi n° 10/010 (Art. 21 à 40) & Dossiers Types ARMP',
    description:
      'Guide pratique pas à pas pour les PME et soumissionnaires : décryptage des DPAO, constitution d’un Groupement Momentané d’Entreprises (GME conjoint ou solidaire), conformité fiscale/sociale et chiffrage compétitif.',
    coverImage: imgCoverSeminar,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 940,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-801-1',
        title: 'Dossier Administratif Zéro Défaut et Conformité RCCM, DGI, CNSS, ARSP',
        duration: '50 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 21 & 22 Loi 10/010 (Conditions de capacité et d’éligibilité)',
          'Art. 23 Loi 10/010 (Justificatifs de régularité fiscale et sociale)',
          'Instructions aux Candidats (IC) des DAO Types ARMP'
        ],
        content: `[Scène: legal_codex] Maîtriser la check-list administrative des Données Particulières (DPAO) : Trop d’offres techniquement brillantes de PME congolaises sont écartées pour une simple pièce administrative expirée ou non conforme aux exigences précises des Données Particulières de l’Appel d’Offres. | Application terrain : Établissez quinze jours avant le dépôt une grille de pointage pièce par pièce signée par deux responsables de votre PME.

[Scène: dgcmp_shield] Régularité fiscale (DGI), sociale (CNSS, INPP, ONEM) et commerciale (RCCM) : Être un partenaire fiable de l’État suppose d’être soi-même exemplaire dans le paiement de ses impôts et des cotisations sociales protégeant les travailleurs congolais. | Application terrain : Renouvelez votre attestation de situation fiscale valide et votre certificat CNSS chaque trimestre sans attendre la publication d’un avis d’appel d’offres.

[Scène: sealed_ballot_ano] Lettre de soumission et pouvoir du signataire habilité : La lettre de soumission engage juridiquement l’entreprise ; elle doit respecter mot pour mot le modèle officiel de l’ARMP et être signée par le gérant statutaire ou un mandataire muni d’une procuration spéciale. | Application terrain : Vérifiez que le nom du signataire de l’offre correspond exactement aux statuts ou au RCCM mis à jour de votre société.

[Scène: bank_guarantee_vault] Garantie de soumission conforme et durée de validité : La caution de soumission démontre le sérieux de l’offre de la PME ; sa durée de validité doit couvrir toute la période de validité des offres augmentée du délai supplémentaire prévu au DPAO. | Application terrain : Faites relire le projet de texte de votre garantie bancaire ou police d’assurance agréée avant son émission définitive pour éviter toute mention restrictive rejetée.

[Scène: transparency_traceability] Présentation matérielle des plis : original, copies et scellement : Le respect du formalisme d’enveloppe anonyme scellée protège le secret des affaires et facilite le travail de vérification lors de la séance publique d’ouverture. | Application terrain : Paraphez chaque page de l’exemplaire original, numérotez l’ensemble du dossier et inscrivez uniquement les mentions officielles sur l’enveloppe extérieure.`
      },
      {
        id: 'L-801-2',
        title: 'Groupements Momentanés d’Entreprises (GME) et Chiffrage Financier',
        duration: '55 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 21 Loi 10/010 (Groupements d’opérateurs économiques)',
          'Art. 39 Loi 10/010 (Correction des erreurs arithmétiques et offres anormalement basses)',
          'Acte d’engagement de groupement solidaire ou conjoint (DAO Type ARMP)'
        ],
        content: `[Scène: allotment_puzzle] S’unir en Groupement Momentané d’Entreprises (GME) pour additionner les forces : Lorsque deux ou trois PME congolaises unissent leurs ingénieurs, leurs engins et leurs chiffres d’affaires au sein d’un GME, elles deviennent capables de remporter de grands marchés face aux multinationales. | Application terrain : Désignez clairement dans l’accord de groupement le mandataire commun (chef de file) habilité à représenter les membres auprès de l’Autorité Contractante.

[Scène: scale_justice] Groupement solidaire ou groupement conjoint : choisir la bonne architecture : Dans un groupement solidaire, chaque PME répond de la totalité du marché, tandis que dans un groupement conjoint, l’ouvrage est divisé en parts techniques distinctes attribuées à chaque membre. | Application terrain : Formalisez la répartition exacte des tâches, des responsabilités et du compte bancaire de règlement dans une convention de GME signée avant le dépôt.

[Scène: threshold_gauge] Justesse du chiffrage : Bordereau des Prix Unitaires (BPU) et Devis Quantitatif (DQE) : Un chiffrage gagnant repose sur une étude sincère des coûts de revient (matériaux, transport en province, salaires, fiscalité) sans jamais omettre de chiffrer un poste du devis quantitatif. | Application terrain : Relisez la concordance parfaite entre vos prix unitaires en chiffres et en toutes lettres, car le montant écrit en lettres prévaut toujours en cas d’écart.

[Scène: construction_crane] Sous-détail des prix et prévention du rejet pour offre anormalement basse : Brader ses prix en dessous du coût réel des matériaux expose la PME au rejet de son offre pour caractère anormalement bas ou à la faillite en cours de chantier. | Application terrain : Préparez dès le montage de l’offre vos fiches de sous-détail des prix unitaires (main-d’œuvre, matériaux, matériel, frais généraux) pour justifier votre compétitivité.`
      }
    ],
    quiz: [
      {
        question: 'En cas de divergence entre le prix unitaire écrit en chiffres et le prix unitaire écrit en toutes lettres dans le Bordereau des Prix d’une PME, quelle mention fait foi ?',
        options: [
          'Le montant le plus élevé',
          'Le montant écrit en toutes lettres',
          'Le montant écrit en chiffres',
          'La moyenne arithmétique des deux montants'
        ],
        correctIndex: 1,
        explanation:
          'Selon les règles constantes des Dossiers Types de l’ARMP, en cas de divergence entre le montant en chiffres et le montant en toutes lettres, le montant en lettres fait foi.'
      },
      {
        question: 'Quel est l’intérêt principal d’un Groupement Momentané d’Entreprises (GME) pour les PME congolaises ?',
        options: [
          'Contourner l’obligation de payer les impôts à la DGI',
          'Mutualiser et additionner leurs capacités techniques, humaines et financières pour atteindre les critères de qualification d’un marché important',
          'Déposer cinq offres différentes pour le même lot',
          'Supprimer la garantie de soumission'
        ],
        correctIndex: 1,
        explanation:
          'Le GME permet aux PME de cumuler leurs chiffres d’affaires, leurs équipements et leurs références techniques afin de satisfaire ensemble aux critères de qualification du DAO.'
      }
    ]
  },
  {
    id: 'MOD-009',
    code: 'MP-RDC-901',
    title: 'Marchés de Prestations Intellectuelles et Sélection de Consultants (TDR, DP, SBQC)',
    category: 'Passation',
    targetAudience: ['cgpmp_member', 'dgcmp_agent', 'particulier', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Avancé',
    legalRef: 'Loi n° 10/010 (Art. 7 & 34 à 36) & Décret n° 10/22 (Chapitre Consultants)',
    description:
      'Maîtrisez les règles spécifiques aux marchés d’études, de maîtrise d’œuvre et d’audit : rédaction des Termes de Référence (TDR), Avis à Manifestation d’Intérêt (AMI), liste restreinte et sélection Qualité-Coût (SBQC).',
    coverImage: imgCoverAudit,
    chaptersCount: 2,
    rating: 4.9,
    studentsCount: 780,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-901-1',
        title: 'Rédaction des TDR, Manifestation d’Intérêt (AMI) et Liste Restreinte',
        duration: '50 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 7 Loi 10/010 (Définition des prestations intellectuelles)',
          'Art. 34 Loi 10/010 (Présélection par Avis à Manifestation d’Intérêt)',
          'Modèle de Demande de Propositions (DP) de l’ARMP'
        ],
        content: `[Scène: intellectual_compass] Rédiger des Termes de Référence (TDR) clairs et orientés résultats : Les Termes de Référence sont le cœur de tout marché d’études ou de contrôle de chantier ; ils définissent le contexte, les objectifs, les livrables attendus et les profils des experts clés. | Application terrain : Précisez toujours dans les TDR le calendrier des rapports d’étape et l’obligation de transfert de compétences aux cadres de l’administration.

[Scène: open_competition_access] L’Avis à Manifestation d’Intérêt (AMI) et la constitution de la Liste Restreinte : Contrairement aux travaux ou fournitures, les prestations intellectuelles débutent par un AMI public permettant de sélectionner une liste restreinte de cinq à huit cabinets hautement qualifiés. | Application terrain : Évaluez les manifestations d’intérêt sur la base des références similaires des cabinets et de leur capacité organisationnelle avant de solliciter l’ANO sur la liste restreinte.

[Scène: scale_justice] Système de la double enveloppe : séparer la qualité technique du prix : Dans une Demande de Propositions (DP), la proposition technique et la proposition financière sont remises dans deux enveloppes distinctes afin que les experts soient jugés d’abord sur leur valeur scientifique sans influence du prix. | Application terrain : Conservez les enveloppes financières scellées dans le coffre de la CGPMP jusqu’à l’obtention de l’ANO de la DGCMP sur le rapport d’évaluation technique.`
      },
      {
        id: 'L-901-2',
        title: 'Méthodes de Sélection : Qualité-Coût (SBQC), Qualité Seule (SBQ) et Budget Fixé',
        duration: '50 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 35 Loi 10/010 (Modes de sélection des consultants)',
          'Art. 36 Loi 10/010 (Négociation et attribution du contrat de consultant)',
          'Manuel des Procédures ARMP (Pondération technique et financière)'
        ],
        content: `[Scène: intellectual_compass] La Sélection Basée sur la Qualité et le Coût (SBQC), référence méthodologique : En attribuant généralement quatre-vingts points à la qualité technique (méthodologie, qualification des experts clés, transfert de savoir) et vingt points au prix, la SBQC garantit des études fiables au coût juste. | Application terrain : Vérifiez personnellement les diplômes et les CV signés des experts clés proposés par les bureaux d’études.

[Scène: sealed_ballot_ano] Ouverture publique des propositions financières des seuls cabinets qualifiés : Seuls les cabinets ayant atteint ou dépassé la note technique minimale requise voient leur enveloppe financière ouverte en séance publique, tandis que les autres enveloppes sont restituées fermées. | Application terrain : Lisez à haute voix les notes techniques obtenues par chaque cabinet qualifié avant de procéder à l’ouverture publique de leurs propositions financières.

[Scène: ministry_cgpmp] Négociation technique et contractuelle avec le cabinet classé premier : Le candidat ayant obtenu le score combiné le plus élevé est invité à négocier le plan de travail, le calendrier et les moyens logistiques, sans jamais remplacer un expert clé par un profil moins qualifié. | Application terrain : Enregistrez toutes les clarifications convenues dans un procès-verbal de négociation annexé au projet de contrat soumis à l’ANO de la DGCMP.`
      }
    ],
    quiz: [
      {
        question: 'Dans une procédure de sélection de consultants (Demande de Propositions), à quel moment ouvre-t-on les propositions financières ?',
        options: [
          'En même temps que les propositions techniques dès le premier jour',
          'Uniquement après l’achèvement de l’évaluation technique et l’obtention de l’ANO sur le rapport technique, pour les seuls candidats ayant atteint le score technique minimum',
          'Après la signature du contrat',
          'En secret sans inviter les cabinets'
        ],
        correctIndex: 1,
        explanation:
          'L’article 35 impose l’évaluation en deux étapes : les propositions financières restent scellées jusqu’à la validation du rapport d’évaluation technique et ne sont ouvertes en public que pour les cabinets qualifiés.'
      }
    ]
  },
  {
    id: 'MOD-010',
    code: 'MP-RDC-1001',
    title: 'Maîtrise d’Œuvre, Révision des Prix, Décomptes et Audit Technique des Chantiers',
    category: 'Gestion & Audit',
    targetAudience: ['cgpmp_member', 'dgcmp_agent', 'armp_agent', 'pme', 'dfat_admin', 'formateur'],
    duration: '9 Heures',
    level: 'Avancé',
    legalRef: 'Loi n° 10/010 (Art. 51 à 65) & CCAG Travaux RDC',
    description:
      'Pilotez l’exécution technique et financière des grands chantiers d’infrastructures : attachements contradictoires, formules paramétriques de révision des prix, gestion du journal de chantier et contrôle de matérialité.',
    coverImage: imgCoverSeminar,
    chaptersCount: 2,
    rating: 4.8,
    studentsCount: 690,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-1001-1',
        title: 'Journal de Chantier, Attachements Contradictoires et Décomptes Mensuels',
        duration: '50 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 55 & 56 Loi 10/010 (Constatation des prestations et acomptes)',
          'CCAG Travaux Publics RDC (Journal de chantier et attachements)'
        ],
        content: `[Scène: construction_crane] Le journal de chantier et les ordres de service, mémoire quotidienne de l’ouvrage : Sur chaque chantier routier, scolaire ou hospitalier, le journal de chantier consigne jour après jour les effectifs, les matériaux livrés, les essais de laboratoire et les instructions de la mission de contrôle. | Application terrain : Exigez la signature conjointe quotidienne du journal de chantier par le résident de la mission de contrôle et le conducteur des travaux de l’entreprise.

[Scène: audit_scanner] Prise d’attachements contradictoires et liquidation juste des décomptes : Aucun acompte ne peut être payé sur simple estimation approximative ; chaque poste facturé doit découler d’un métré contradictoire relevé sur le site par l’ingénieur de contrôle et l’entrepreneur. | Application terrain : Joignez les résultats des essais géotechniques (compacité, résistance du béton) à chaque décompte provisoire avant sa validation par la CGPMP.`
      },
      {
        id: 'L-1001-2',
        title: 'Formules de Révision des Prix, Imprévision et Clôture Financière (DGD)',
        duration: '50 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 53 Loi 10/010 (Marchés à prix fermes ou révisables)',
          'Art. 52 Loi 10/010 (Plafond légal des avenants à 15 %)'
        ],
        content: `[Scène: threshold_gauge] Application rigoureuse des formules paramétriques de révision des prix : Pour les chantiers dépassant douze mois, la formule de révision protège l’équilibre contractuel grâce à une partie fixe obligatoire et des coefficients indexés sur les coûts officiels du ciment, du bitume et des salaires. | Application terrain : Vérifiez que le marché prévoit expressément une clause de révision dans le CCAP avant d’accepter tout calcul d’actualisation ou de révision.

[Scène: bank_guarantee_vault] Le Décompte Général et Définitif (DGD), acte de clôture irrévocable : À l’achèvement du marché, le DGD récapitule l’ensemble des acomptes versés, le remboursement intégral de l’avance de démarrage, les pénalités éventuelles et le solde net dû à l’entreprise. | Application terrain : Ne procédez à l’archivage final du dossier qu’après la signature contradictoire du DGD et la mainlevée régulière des cautions.`
      }
    ],
    quiz: [
      {
        question: 'Quelle pièce technique contradictoire est indispensable pour justifier le paiement d’un décompte mensuel de travaux publics ?',
        options: [
          'Une simple facture proforma non signée',
          'La feuille d’attachements contradictoires signée sur site par l’entreprise et la mission de contrôle',
          'Le prospectus publicitaire de l’entreprise',
          'L’avis d’appel d’offres initial'
        ],
        correctIndex: 1,
        explanation:
          'Dans les marchés de travaux, tout décompte mensuel doit obligatoirement être appuyé par les attachements contradictoires constatant les quantités réellement exécutées et réceptionnées techniquement.'
      }
    ]
  },
  {
    id: 'MOD-011',
    code: 'MP-RDC-1101',
    title: 'Marchés sur Financements Extérieurs (Banque Mondiale, BAD, UE) et Loi n° 10/010',
    category: 'Contrôle',
    targetAudience: ['cgpmp_member', 'dgcmp_agent', 'armp_agent', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Spécialisé',
    legalRef: 'Art. 3 Loi n° 10/010 & Règlements de Passation des Bailleurs (STEP / IPF)',
    description:
      'Comprenez l’articulation juridique entre la Loi n° 10/010 et les directives des partenaires techniques et financiers (Banque Mondiale, BAD, AFD, UE) : conventions de financement, plateforme STEP et double non-objection.',
    coverImage: imgCoverAudit,
    chaptersCount: 2,
    rating: 4.9,
    studentsCount: 615,
    requiresDfatApproval: true,
    lessons: [
      {
        id: 'L-1101-1',
        title: 'Article 3 de la Loi 10/010 et Primauté des Conventions Internationales',
        duration: '50 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 3 Loi 10/010 (Marchés financés par des bailleurs internationaux)',
          'Règlement de Passation des Marchés pour les Emprunteurs IPF (Banque Mondiale)',
          'Cadre de passation de la Banque Africaine de Développement (BAD)'
        ],
        content: `[Scène: legal_codex] L’Article 3 de la Loi 10/010, pont juridique avec les partenaires internationaux : Les marchés financés par des prêts ou dons internationaux obéissent aux dispositions de la Loi n° 10/010 dans toutes les matières qui ne sont pas contraires aux accords de financement ratifiés. | Application terrain : Consultez toujours l’Accord de Financement et le Plan de Passation approuvé dans STEP pour identifier si la procédure relève des règles du bailleur ou des procédures nationales.

[Scène: sigmap_server] Maîtrise de la plateforme STEP et synchronisation avec le PPM national : Sur les projets cofinancés, la CGPMP ou l’Unité de Gestion de Projet (UGP) assure une double traçabilité exemplaire entre le système STEP du bailleur et l’enregistrement national auprès de la DGCMP et de l’ARMP. | Application terrain : Publiez systématiquement les avis d’appel d’offres financés par les bailleurs sur le portail national de l’ARMP afin d’informer toutes les entreprises congolaises.`
      },
      {
        id: 'L-1101-2',
        title: 'Normes Environnementales et Sociales (EES) et Intégrité Internationale',
        duration: '45 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Normes Environnementales et Sociales (NES) des Bailleurs',
          'Directives anti-corruption et sanctions croisées'
        ],
        content: `[Scène: citizen_impact_law] Intégration des clauses environnementales, sociales et d’hygiène-sécurité (ESHS) : Les grands chantiers modernes exigent que chaque soumissionnaire s’engage concrètement à protéger l’environnement, la sécurité des ouvriers et la prévention des violences basées sur le genre autour des sites. | Application terrain : Vérifiez que l’offre technique inclut un Plan de Gestion Environnementale et Sociale de Chantier (PGES-C) budgété et signé.`
      }
    ],
    quiz: [
      {
        question: 'Selon l’article 3 de la Loi n° 10/010, quelles règles s’appliquent aux marchés financés sur ressources extérieures (bailleurs de fonds) ?',
        options: [
          'Aucune règle juridique ne s’applique',
          'Les stipulations des conventions internationales de financement prévalent en cas de divergence, et la Loi n° 10/010 s’applique de plein droit pour tout le reste',
          'Le gré à gré est obligatoire pour tous les achats',
          'Seules les entreprises étrangères peuvent soumissionner'
        ],
        correctIndex: 1,
        explanation:
          'L’article 3 de la Loi n° 10/010 consacre l’application supplétive de la loi nationale sous réserve des dispositions spécifiques prévues par les accords internationaux de financement.'
      }
    ]
  },
  {
    id: 'MOD-012',
    code: 'MP-RDC-1201',
    title: 'Partenariats Public-Privé (Loi n° 18/016), Délégations de Service Public et Concessions',
    category: 'Réglementation',
    targetAudience: ['armp_agent', 'dgcmp_agent', 'pme', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Spécialisé',
    legalRef: 'Loi n° 18/016 du 9 juillet 2018 relative aux PPP & Loi n° 10/010',
    description:
      'Maîtrisez la frontière et les synergies entre les marchés publics classiques et les contrats de Partenariat Public-Privé (PPP) : concessions, affermages, BOT, partage des risques, études de soutenabilité budgétaire et contenu local.',
    coverImage: imgCoverFormation,
    chaptersCount: 2,
    rating: 4.9,
    studentsCount: 580,
    requiresDfatApproval: true,
    lessons: [
      {
        id: 'L-1201-1',
        title: 'Distinction entre Marché Public (Loi 10/010) et Contrat de PPP (Loi 18/016)',
        duration: '50 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Loi n° 18/016 du 9 juillet 2018 relative au Partenariat Public-Privé',
          'Art. 4 Loi 10/010 (Délégations de service public et marchés publics)'
        ],
        content: `[Scène: construction_crane] Comprendre le Partenariat Public-Privé au service des grandes infrastructures : Tandis que dans un marché public classique l’État paie directement un prix pour acquérir un ouvrage, dans un PPP le partenaire privé finance une part majeure de l’investissement sur le long terme et partage les risques d’exploitation. | Application terrain : Avant de lancer un projet en PPP, réalisez toujours une étude préalable d’évaluation comparative démontrant que le PPP apporte une meilleure valeur publique qu’un marché classique.

[Scène: scale_justice] Matrice de partage équitable des risques et soutenabilité budgétaire : Un contrat de partenariat réussi attribue chaque risque — risque de construction, risque de disponibilité ou risque de trafic — à la partie la plus apte à le maîtriser, sans jamais grever les finances publiques futures. | Application terrain : Exigez l’avis préalable de soutenabilité budgétaire du Ministère des Finances et du Budget avant toute signature d’un contrat de PPP.`
      },
      {
        id: 'L-1201-2',
        title: 'Appel d’Offres PPP, Dialogue Compétitif et Sous-Traitance aux PME Congolaises',
        duration: '45 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Principes de mise en concurrence des PPP (Loi 18/016)',
          'Obligations de contenu local et d’actionnariat national dans les PPP'
        ],
        content: `[Scène: allotment_puzzle] Place obligatoire des PME congolaises et du contenu local dans les grands PPP : La Loi n° 18/016 impose que les grands projets de partenariat réservent une part substantielle de l’actionnariat, des emplois et des contrats de sous-traitance aux PME congolaises. | Application terrain : Insérez dans chaque contrat de concession des objectifs chiffrés et vérifiables de sous-traitance locale au profit des PME agréées en RDC.`
      }
    ],
    quiz: [
      {
        question: 'Quel critère juridique fondamental distingue un contrat de Partenariat Public-Privé (PPP) d’un marché public classique de travaux ?',
        options: [
          'L’absence totale de contrat écrit',
          'Une mission globale de longue durée incluant le financement privé total ou partiel et un transfert substantiel des risques liés à la performance ou à la demande',
          'La dispense de toute étude technique préalable',
          'Le paiement intégral au comptant avant le début des travaux'
        ],
        correctIndex: 1,
        explanation:
          'Le PPP (Loi n° 18/016) se caractérise par une mission globale de longue durée, la participation du partenaire privé au financement et un partage équilibré des risques d’exploitation ou de disponibilité.'
      }
    ]
  },
  {
    id: 'MOD-013',
    code: 'MP-RDC-1301',
    title: 'Chiffrage Financier, BPU/DQE, Sous-Détail des Prix et Rentabilité des Offres PME',
    category: 'Passation',
    targetAudience: ['pme', 'particulier', 'cgpmp_member', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Intermédiaire',
    legalRef: 'Loi n° 10/010 (Art. 42 à 46) & Dossiers Types ARMP (BPU/DQE)',
    description:
      'Maîtrisez la structure financière d’une offre gagnante : élaboration sans erreur du Bordereau des Prix Unitaires (BPU) et du Détail Quantitatif et Estimatif (DQE), calcul du sous-détail des prix, gestion du risque d’offre anormalement basse et formules de révision.',
    coverImage: imgCoverSeminar,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 940,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-1301-1',
        title: 'Concordance BPU / DQE et Règles de Correction des Erreurs Arithmétiques',
        duration: '45 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 43 Loi 10/010 (Évaluation financière des offres)',
          'Instructions aux Candidats (IC) des DAO Types ARMP',
          'Primauté du prix unitaire en toutes lettres'
        ],
        content: `[Scène: scale_justice] Concordance rigoureuse entre le Bordereau des Prix Unitaires et le Devis Estimatif : Dans un marché public à prix unitaires, le Bordereau des Prix Unitaires (BPU) exprime la valeur contractuelle de chaque prestation en chiffres et en toutes lettres, tandis que le Détail Quantitatif et Estimatif (DQE) multiplie ces prix par les quantités prévisionnelles du dossier. | Application terrain : Vérifiez toujours deux fois la concordance exacte entre le prix écrit en lettres au BPU et le prix reporté dans les colonnes du DQE avant de sceller votre pli financier.

[Scène: legal_codex] Règle impérative de correction des erreurs arithmétiques par la Sous-Commission : En cas de divergence entre le prix unitaire exprimé en chiffres et celui exprimé en toutes lettres, le prix en toutes lettres fait foi de plein droit. Si le produit du prix unitaire par la quantité est inexact, la commission corrige le montant total en multipliant la quantité officielle par le prix unitaire en lettres. | Application terrain : Automatisez vos feuilles de calcul BPU/DQE et faites relire chaque montant en toutes lettres par un second ingénieur chiffreur avant signature.

[Scène: transparency_traceability] Consentement écrit du soumissionnaire sur le montant corrigé : Lorsqu’une correction arithmétique modifie le montant global de l’offre, la commission notifie par écrit le calcul rectifié au candidat, qui doit l’accepter formellement sous peine de voir son offre écartée. | Application terrain : Veillez à ce qu’aucune ligne du DQE ne reste vide ou non chiffrée, car un poste omis est réputé inclus dans les autres prix sans supplément possible en cours de chantier.

[Scène: threshold_gauge] Traitement des rabais inconditionnels ou conditionnels (multi-lots) : Tout rabais consenti par une PME doit être clairement annoncé dans la lettre de soumission lue publiquement lors de la séance d’ouverture des plis pour être pris en compte lors du classement financier. | Application terrain : Inscrivez explicitement le pourcentage ou le montant de votre rabais directement dans le formulaire officiel de soumission et jamais sur une feuille volante séparée.

[Scène: citizen_impact_law] Juste prix et pérennité économique des PME congolaises : Chiffrer au juste prix protège à la fois les deniers publics contre la surfacturation et la survie financière des entreprises locales qui créent des emplois durables dans nos provinces. | Application terrain : Construisez chaque offre financière sur des coûts réels de matériaux, de logistique provinciale et de main-d’œuvre qualifiée.`
      },
      {
        id: 'L-1301-2',
        title: 'Construction du Sous-Détail des Prix (Déboursés Secs, Frais de Chantier et Marges)',
        duration: '50 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Sous-détail des prix unitaires (Annexe DAO ARMP)',
          'Art. 46 Loi 10/010 (Marge de préférence nationale)',
          'Fiscalité applicable aux marchés publics (TVA, ICA, Retenues)'
        ],
        content: `[Scène: construction_crane] Décomposition transparente des déboursés secs (matériaux, main-d’œuvre, matériel) : Le sous-détail d’un prix unitaire démontre comment l’entreprise calcule son coût de revient direct en additionnant les matériaux rendus chantier, les heures d’ouvriers et l’amortissement des engins. | Application terrain : Intégrez systématiquement les coûts réels de transport fluvial, routier ou aérien jusqu’au site provincial d’exécution dans vos déboursés matériaux.

[Scène: ministry_cgpmp] Incorporation des frais généraux, frais de siège, aléas et bénéfice : Au-dessus des déboursés secs, le coefficient de vente intègre les frais d’installation de chantier, les assurances, le coût des cautions bancaires et la marge nette légitime de la PME. | Application terrain : N’oubliez jamais de budgéter le coût financier de la garantie de soumission, de la garantie de bonne exécution et des retenues de garantie dans vos frais financiers.

[Scène: allotment_puzzle] Activation de la marge de préférence nationale (Art. 46 Loi 10/010) : Lors d’une mise en concurrence internationale, les PME de droit congolais présentant une part majoritaire de valeur ajoutée locale bénéficient d’une préférence comparative lors du classement financier. | Application terrain : Joignez à votre offre financière toutes les preuves d’origine congolaise des intrants et d’emploi de personnel national pour activer le bénéfice de l’article 46.

[Scène: supply_truck] Fiscalité des marchés publics (HT, TTC, régimes d’exonération bailleurs) : Une erreur sur le régime fiscal applicable (marché sur budget national assujetti à la TVA ou marché sur financement extérieur exonéré avec prise en charge par l’État) fausse la compétitivité de l’offre. | Application terrain : Vérifiez dans les Données Particulières de l’Appel d’Offres (DPAO) si l’évaluation comparative se fait sur la base des montants Hors Taxes ou Toutes Taxes Comprises.

[Scène: dgcmp_shield] Justification d’une offre suspectée d’être anormalement basse : Si le montant d’une offre est inférieur de plus de quinze à vingt pour cent à l’estimation administrative, l’Autorité Contractante demande par écrit des justifications détaillées avant toute décision de rejet. | Application terrain : Conservez vos factures pro-forma fournisseurs et vos titres de propriété d’engins prêts à être produits sous 72 heures pour prouver le sérieux de vos prix.`
      },
      {
        id: 'L-1301-3',
        title: 'Simulation des Flux de Trésorerie (Cash-Flow), Avances et Révision des Prix',
        duration: '45 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 56 à 59 Loi 10/010 (Avances, acomptes et règlement)',
          'Formules paramétriques de révision des prix au CCAP',
          'Intérêts moratoires légaux en cas de retard de paiement'
        ],
        content: `[Scène: dao_calendar] Planification du besoin en fonds de roulement (BFR) du marché : Même lorsqu’un marché est rentable sur le papier, le décalage entre les dépenses initiales d’approvisionnement et l’encaissement du premier décompte peut asphyxier une PME non préparée. | Application terrain : Établissez un calendrier prévisionnel de trésorerie mois par mois corrélé au planning d’exécution avant même de déposer votre soumission.

[Scène: dgcmp_shield] Mobilisation sécurisée de l’avance de démarrage (jusqu’à 20% ou 30%) : L’avance forfaitaire de démarrage permet de financer les commandes urgentes dès la notification du marché, à condition de fournir une caution bancaire de remboursement d’égal montant. | Application terrain : Négociez au préalable votre ligne de cautionnement auprès de votre banque partenaire afin d’obtenir votre garantie d’avance en moins de cinq jours ouvrables.

[Scène: intellectual_compass] Application des formules de révision des prix face à l’inflation : Pour les marchés à exécution prolongée, la formule polynomiale de révision indexe le montant des décomptes sur l’évolution officielle des indices du ciment, du carburant, de l’acier et des salaires. | Application terrain : Vérifiez que les coefficients de pondération de la formule de révision inscrite au CCAP reflètent fidèlement la structure économique réelle de vos travaux.`
      }
    ],
    quiz: [
      {
        question: 'En cas de discordance entre le prix unitaire écrit en chiffres et le prix unitaire écrit en toutes lettres dans le BPU d’un soumissionnaire, quelle règle s’applique ?',
        options: [
          'L’offre est immédiatement éliminée sans analyse',
          'Le prix unitaire écrit en toutes lettres prévaut de plein droit et sert de base à la correction arithmétique du DQE',
          'Le soumissionnaire choisit librement après l’ouverture des plis le prix qui l’arrange',
          'La commission retient toujours le chiffre le plus élevé'
        ],
        correctIndex: 1,
        explanation:
          'Conformément aux Dossiers Types de l’ARMP et aux règles d’évaluation de la Loi n° 10/010, le montant exprimé en toutes lettres au BPU fait foi et permet de rectifier le sous-total correspondant.'
      }
    ]
  },
  {
    id: 'MOD-014',
    code: 'MP-RDC-1401',
    title: 'Conformité Fiscale, Sociale, ARSP et Dossier Administratif Zéro Rejet pour PME',
    category: 'Réglementation',
    targetAudience: ['pme', 'particulier', 'cgpmp_member', 'dgcmp_agent', 'dfat_admin', 'formateur'],
    duration: '6 Heures',
    level: 'Fondamental',
    legalRef: 'Loi n° 10/010 (Art. 21 à 25) • Loi n° 17/001 (ARSP) • Décret n° 10/22',
    description:
      'Éliminez 100% des motifs de rejet administratif : maîtrise des attestations fiscales (DGI), sociales (CNSS), RCCM, Identification Nationale, enregistrement ARSP et validité des pouvoirs de signature.',
    coverImage: imgCoverFormation,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 1180,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-1401-1',
        title: 'Les Conditions Légales d’Éligibilité et d’Exclusion (Art. 21 à 25 Loi 10/010)',
        duration: '40 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 21 à 25 Loi 10/010 (Capacité juridique, technique et régularité fiscale)',
          'Attestation de situation fiscale en cours de validité (DGI)',
          'Attestation de régularité cotisante CNSS'
        ],
        content: `[Scène: legal_codex] Vérification de la capacité juridique et de l’objet social au RCCM : Pour être recevable à un marché public en RDC, toute entreprise doit justifier d’une immatriculation régulière au Registre du Commerce et du Crédit Mobilier (RCCM) dont l’objet social couvre les prestations mises en concurrence. | Application terrain : Mettez à jour votre extrait RCCM dès que votre PME étend ses activités vers un nouveau secteur de travaux ou de fournitures.

[Scène: dgcmp_shield] Régularité fiscale (DGI) et sociale (CNSS) à la date limite de dépôt : La Loi n° 10/010 interdit d’attribuer un marché public à un opérateur économique qui n’est pas en règle de paiement de ses impôts, taxes et cotisations sociales obligatoires. | Application terrain : Tenez un tableau de suivi des dates d’expiration de votre attestation fiscale DGI et de votre certificat CNSS pour demander leur renouvellement quinze jours avant échéance.

[Scène: scale_justice] Absence de faillite, de liquidation et d’interdiction de soumissionner : Le candidat atteste sur l’honneur et par certificat de non-faillite qu’il ne fait l’objet d’aucune procédure collective ni d’aucune décision d’exclusion prononcée par l’ARMP. | Application terrain : Vérifiez systématiquement la présence et la signature originale de la déclaration d’intégrité et de non-exclusion dans votre pli administratif.`
      },
      {
        id: 'L-1401-2',
        title: 'Enregistrement ARSP, Agréments Sectoriels (ITPR/Santé) et Pouvoirs du Signataire',
        duration: '45 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Loi n° 17/001 du 8 février 2017 (Attestation d’enregistrement ARSP)',
          'Agréments techniques ministériels (ITPR, Urbanisme, Énergie, Santé)',
          'Mandat spécial et procuration notariée du signataire de l’offre'
        ],
        content: `[Scène: allotment_puzzle] Attestation d’enregistrement auprès de l’ARSP et éligibilité au contenu local : L’enregistrement auprès de l’Autorité de Régulation de la Sous-Traitance dans le Secteur Privé (ARSP) et la détention d’un capital majoritairement congolais ouvrent droit aux quotas réservés aux PME nationales. | Application terrain : Joignez votre attestation ARSP valide ainsi que les statuts actualisés démontrant la répartition nationale du capital social.

[Scène: ministry_cgpmp] Validité du pouvoir de signature et procuration du mandataire : L’une des causes les plus fréquentes d’élimination d’offres techniquement excellentes réside dans la signature de la soumission par un cadre non statutairement habilité et dépourvu de procuration écrite. | Application terrain : Si le signataire de l’offre n’est pas le gérant statutaire désigné au RCCM, insérez obligatoirement une procuration spéciale signée par le dirigeant légal.`
      },
      {
        id: 'L-1401-3',
        title: 'Distinction entre Pièces Administratives Régularisables et Éliminatoires',
        duration: '40 min',
        format: 'animation',
        templateId: 'casestudy',
        keyArticles: [
          'Jurisprudence du CRD de l’ARMP sur les pièces administratives',
          'Caractère substantiel de la garantie de soumission et de la lettre d’offre'
        ],
        content: `[Scène: transparency_traceability] Principe jurisprudentiel de distinction entre vices substantiels et formels : La jurisprudence constante du Comité de Règlement des Différends (CRD) rappelle que l’absence de garantie de soumission ou de signature de l’offre est éliminatoire, tandis qu’une pièce administrative historique peut faire l’objet d’une demande de précision. | Application terrain : Ne prenez aucun risque et constituez un classeur administratif numérique et physique complet quarante-huit heures avant la date limite de remise des plis.`
      }
    ],
    quiz: [
      {
        question: 'Que se passe-t-il si la lettre de soumission d’une PME est signée par un directeur technique qui n’est pas le gérant statutaire et qu’aucune procuration écrite n’est jointe au pli ?',
        options: [
          'L’offre est pleinement valide sans formalité',
          'L’offre encourt le rejet pour défaut de pouvoir juridique d’engager valablement la société soumissionnaire',
          'La DGCMP signe l’offre à la place du gérant',
          'Le montant de l’offre est augmenté de 10%'
        ],
        correctIndex: 1,
        explanation:
          'Seul le représentant légal désigné dans les statuts/RCCM ou un mandataire muni d’une procuration écrite régulière a le pouvoir d’engager juridiquement l’entreprise soumissionnaire.'
      }
    ]
  },
  {
    id: 'MOD-015',
    code: 'MP-RDC-1501',
    title: 'Fonctionnement Interne des CGPMP, Secrétariat Permanent et Gouvernance de la PRM',
    category: 'Réglementation',
    targetAudience: ['cgpmp_member', 'armp_agent', 'dgcmp_agent', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Intermédiaire',
    legalRef: 'Décret n° 10/32 du 28 décembre 2010 portant création, organisation et fonctionnement des CGPMP',
    description:
      'Maîtrisez l’organisation interne d’une Cellule de Gestion des Projets et des Marchés Publics (CGPMP) : rôle de la Personne Responsable des Marchés (PRM), Secrétariat Permanent, Commission de Passation et Sous-Commission d’Analyse.',
    coverImage: imgCoverAudit,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 860,
    requiresDfatApproval: true,
    lessons: [
      {
        id: 'L-1501-1',
        title: 'Architecture du Décret n° 10/32 : PRM, Secrétariat Permanent et Commissions',
        duration: '45 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 13 Loi 10/010 (Institution des CGPMP auprès des Autorités Contractantes)',
          'Décret n° 10/32 du 28 décembre 2010 (Organisation et fonctionnement des CGPMP)'
        ],
        content: `[Scène: ministry_cgpmp] Articulation entre la Personne Responsable des Marchés (PRM) et la CGPMP : Au sein de chaque ministère, entreprise publique ou province, la PRM détient le pouvoir de signature et de décision, tandis que la CGPMP assure la préparation technique, la conduite des procédures et le suivi d’exécution. | Application terrain : Formalisez par note de service interne le circuit de visa entre le Secrétariat Permanent de la CGPMP et le cabinet de la PRM pour éviter tout goulot d’étranglement.

[Scène: transparency_traceability] Rôle moteur du Secrétariat Permanent de la CGPMP : Le Secrétariat Permanent centralise le recensement des besoins des directions techniques, prépare les projets de PPM et de DAO, assure la garde des archives et prépare les saisines de la DGCMP. | Application terrain : Tenez à jour un tableau de bord hebdomadaire de suivi des délais de chaque dossier en cours d’instruction au Secrétariat Permanent.`
      },
      {
        id: 'L-1501-2',
        title: 'Règles de Quorum, Déontologie et Indépendance de la Sous-Commission d’Analyse (SCA)',
        duration: '50 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Dispositions du Décret n° 10/32 relatives à la Commission de Passation et à la SCA',
          'Déclaration d’impartialité et prévention des conflits d’intérêts'
        ],
        content: `[Scène: scale_justice] Désignation et compétence pluridisciplinaire de la Sous-Commission d’Analyse : Pour chaque marché, une Sous-Commission d’Analyse (SCA) réunissant des compétences techniques, juridiques et financières évalue les offres de manière collégiale et indépendante. | Application terrain : Exigez que chaque membre de la SCA et chaque expert associé signe une déclaration individuelle d’absence de conflit d’intérêts dès l’ouverture des travaux d’évaluation.

[Scène: dgcmp_shield] Confidentialité absolue des délibérations et motivation du rapport : Depuis la fin de la séance publique d’ouverture jusqu’à la publication officielle des résultats provisoires, aucune information relative à l’examen, aux éclaircissements ou au classement des plis ne peut être divulguée. | Application terrain : Organisez les travaux de la SCA dans une salle sécurisée et consignez les grilles de notation individuelles de chaque évaluateur au dossier d’archive.`
      },
      {
        id: 'L-1501-3',
        title: 'Archivage Légal, Rapports Trimestriels d’Exécution et Préparation des Audits ARMP',
        duration: '40 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Obligation de conservation décennale des archives de marchés publics',
          'Transmission des rapports périodiques à l’ARMP et à la DGCMP'
        ],
        content: `[Scène: sigmap_server] Constitution du dossier unique de marché de la planification à la clôture : Chaque marché public doit disposer d’un dossier maître numéroté regroupant l’extrait du PPM, le DAO, les preuves de publication, les plis reçus, les PV, les ANO, le contrat signé, les ordres de service et les PV de réception. | Application terrain : Numérisez chaque pièce au fur et à mesure de sa signature afin que votre CGPMP soit prête à répondre en 24 heures à toute mission d’audit de l’ARMP.`
      }
    ],
    quiz: [
      {
        question: 'Selon le Décret n° 10/32, quel organe au sein de la CGPMP est chargé de l’évaluation technique et financière approfondie des offres après la séance publique d’ouverture ?',
        options: [
          'Le service du protocole du Ministère',
          'La Sous-Commission d’Analyse (SCA) spécialement désignée à cet effet, qui soumet son rapport motivé à la Commission de Passation des Marchés',
          'Les soumissionnaires eux-mêmes par vote à main levée',
          'Le guichet de la banque commerciale'
        ],
        correctIndex: 1,
        explanation:
          'Le Décret n° 10/32 confie l’évaluation technique et financière détaillée à une Sous-Commission d’Analyse (SCA) qui dépose un rapport circonstancié devant la Commission de Passation de la CGPMP.'
      }
    ]
  },
  {
    id: 'MOD-016',
    code: 'MP-RDC-1601',
    title: 'Rédaction des Spécifications Techniques Neutres, Allotissement Stratégique et Dossiers Types',
    category: 'Passation',
    targetAudience: ['cgpmp_member', 'particulier', 'dgcmp_agent', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Avancé',
    legalRef: 'Loi n° 10/010 (Art. 17 à 20, 38) • Décret n° 10/22 • DAO Types ARMP',
    description:
      'Apprenez à rédiger des Cahiers des Clauses Techniques Particulières (CCTP) objectifs et non discriminatoires, à structurer l’allotissement pour stimuler la concurrence PME et à paramétrer les DPAO/CCAP sans contradiction.',
    coverImage: imgCoverMentor,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 790,
    requiresDfatApproval: true,
    lessons: [
      {
        id: 'L-1601-1',
        title: 'Neutralité Technique, Normes Fonctionnelles et Interdiction des Marques Commerciales',
        duration: '45 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 1er et 38 Loi 10/010 (Neutralité des spécifications techniques)',
          'Mention obligatoire « ou équivalent » en cas de référence exceptionnelle'
        ],
        content: `[Scène: open_competition_access] Prohibition des spécifications verrouillées ou orientées vers un fournisseur unique : Rédiger un cahier des charges en copiant la fiche commerciale d’une marque précise fausse la concurrence, renchérit artificiellement les coûts pour l’État et expose le DAO au refus d’ANO de la DGCMP. | Application terrain : Définissez toujours vos besoins par des performances fonctionnelles mesurables (puissance, résistance, capacité, normes ISO) accessibles à l’ensemble des fabricants qualifiés.

[Scène: legal_codex] Usage exceptionnel de la mention « ou équivalent » : Lorsque la description d’un composant complexe est impossible sans citer une référence connue, celle-ci doit impérativement être suivie des mots « ou équivalent » en précisant les critères objectifs permettant de prouver l’équivalence. | Application terrain : Relisez l’intégralité du CCTP et du BPU avec la fonction de recherche pour éliminer tout nom de marque ou de modèle non accompagné de la mention « ou équivalent ».`
      },
      {
        id: 'L-1601-2',
        title: 'Ingénierie de l’Allotissement Géographique et Technique au Profit du Tissu Économique',
        duration: '45 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 19 et 20 Loi 10/010 (Allotissement et interdiction du fractionnement)',
          'Règles de limitation du nombre de lots attribuables à un même candidat'
        ],
        content: `[Scène: allotment_puzzle] Découpage en lots homogènes sans fractionnement illicite : Contrairement au fractionnement interdit qui vise à contourner les seuils d’appel d’offres, l’allotissement légal regroupe l’ensemble des lots au sein d’un même appel d’offres ouvert tout en permettant aux PME de soumissionner sur un ou plusieurs lots adaptés à leur capacité. | Application terrain : Prévoyez dans les DPAO la capacité technique et financière minimale requise pour un lot isolé ainsi que la capacité cumulée exigée pour être attributaire de plusieurs lots.`
      },
      {
        id: 'L-1601-3',
        title: 'Cohérence Interne entre DPAO, Critères de Qualification et Clauses du CCAP',
        duration: '50 min',
        format: 'animation',
        templateId: 'casestudy',
        keyArticles: [
          'Dossiers Types d’Appel d’Offres de l’ARMP (Travaux, Fournitures, Services)',
          'Intangibilité du CCAG et personnalisation du CCAP'
        ],
        content: `[Scène: dgcmp_shield] Élimination des contradictions internes entre les pièces du DAO : Une discordance sur le délai d’exécution ou le pourcentage de cautionnement entre les Données Particulières (DPAO) et le Cahier des Clauses Administratives Particulières (CCAP) crée un nid à contentieux devant le CRD. | Application terrain : Utilisez une matrice de cohérence croisée vérifiant que les délais, seuils de chiffre d’affaires, garanties et pénalités sont strictement identiques dans l’Avis, les DPAO et le CCAP.`
      }
    ],
    quiz: [
      {
        question: 'Dans quel cas exceptionnel un Dossier d’Appel d’Offres (DAO) peut-il mentionner une référence ou une marque particulière ?',
        options: [
          'Chaque fois que la CGPMP préfère un fournisseur habituel',
          'Uniquement lorsqu’il est impossible de décrire autrement l’objet du marché de façon suffisamment précise, et à la condition impérative d’y ajouter la mention « ou équivalent »',
          'Dans tous les marchés de travaux routiers',
          'Lorsque le montant dépasse un milliard de francs congolais'
        ],
        correctIndex: 1,
        explanation:
          'Conformément au principe d’égalité de traitement de la Loi n° 10/010, les spécifications techniques doivent être neutres ; toute référence exceptionnelle doit être suivie de la mention « ou équivalent ».'
      }
    ]
  },
  {
    id: 'MOD-017',
    code: 'MP-RDC-1701',
    title: 'Examen de Régularité a Priori DGCMP : Revue des PPM, DAO, Rapports d’Évaluation et Contrats',
    category: 'Contrôle',
    targetAudience: ['dgcmp_agent', 'cgpmp_member', 'armp_agent', 'dfat_admin', 'formateur'],
    duration: '10 Heures',
    level: 'Avancé',
    legalRef: 'Loi n° 10/010 (Art. 14) & Décret n° 10/27 du 28 juin 2010 portant création de la DGCMP',
    description:
      'Maîtrisez la grille d’instruction des contrôleurs de la DGCMP : points de contrôle bloquants lors de la revue préalable des PPM, des DAO, des rapports d’évaluation et des projets de contrats avant délivrance de l’ANO.',
    coverImage: imgCoverAudit,
    chaptersCount: 3,
    rating: 5.0,
    studentsCount: 730,
    requiresDfatApproval: true,
    lessons: [
      {
        id: 'L-1701-1',
        title: 'Grille de Contrôle a Priori des Plans de Passation (PPM) et des Projets de DAO',
        duration: '50 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 14 et 16 Loi 10/010 (Contrôle a priori DGCMP et validation du PPM)',
          'Décret n° 10/27 du 28 juin 2010 (Attributions de la DGCMP)'
        ],
        content: `[Scène: dgcmp_shield] Concordance budgétaire et respect des seuils lors de la revue du PPM : L’inspecteur de la DGCMP vérifie en premier lieu que chaque ligne du Plan de Passation des Marchés correspond à un crédit effectivement inscrit dans la Loi de Finances et que le mode de passation choisi respecte les seuils réglementaires. | Application terrain : Refusez toute validation de PPM comportant des achats similaires scindés artificiellement en dessous du seuil d’appel d’offres ouvert.

[Scène: legal_codex] Audit de conformité du projet de DAO avant autorisation de publication : Avant d’accorder l’Avis de Non-Objection sur un DAO, la DGCMP contrôle l’utilisation effective du Dossier Type de l’ARMP, la proportionnalité des critères de qualification et le respect du délai légal de publicité. | Application terrain : Vérifiez systématiquement que les critères d’évaluation énoncés dans les DPAO sont exclusivement objectifs, quantifiables et non discriminatoires.`
      },
      {
        id: 'L-1701-2',
        title: 'Examen Critique du Rapport d’Évaluation des Offres et Motivation des Rejets d’ANO',
        duration: '50 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 42 et 43 Loi 10/010 (Conformité substantielle et offre économiquement la plus avantageuse)',
          'Jurisprudence DGCMP/ARMP sur l’intangibilité des critères'
        ],
        content: `[Scène: scale_justice] Contrôle de la fidélité absolue du rapport d’analyse aux critères du DAO : Lorsqu’elle reçoit le rapport de la Sous-Commission d’Analyse, la DGCMP vérifie que chaque élimination et chaque note attribuée reposent strictement sur les critères publiés dans le DAO, sans ajout ni retrait en cours de dépouillement. | Application terrain : Si une CGPMP a écarté l’offre la moins-disante pour un motif non prévu au DAO, émettez un refus motivé d’ANO exigeant la reprise de l’évaluation conformément aux règles annoncées.`
      },
      {
        id: 'L-1701-3',
        title: 'Revue Juridique et Financière du Projet de Contrat avant Signature et Engagement',
        duration: '45 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 47 à 51 Loi 10/010 (Forme, approbation et entrée en vigueur des marchés)',
          'Concordance entre l’offre retenue et le projet de contrat final'
        ],
        content: `[Scène: ministry_cgpmp] Interdiction de modifier l’équilibre économique ou technique lors de la mise au point du contrat : Le contrôle final du projet de contrat avant signature garantit que le montant, les délais, le BPU et les spécifications correspondent exactement à l’offre de l’attributaire telle qu’approuvée par l’ANO d’attribution. | Application terrain : Vérifiez la présence du certificat de disponibilité des crédits budgétaires et l’absence de toute clause financière nouvelle avant d’apposer le visa final de contrôle a priori.`
      }
    ],
    quiz: [
      {
        question: 'Quelle doit être la décision de la DGCMP lorsqu’elle constate, à l’examen d’un rapport d’évaluation, que la CGPMP a éliminé un soumissionnaire sur la base d’un sous-critère qui ne figurait pas dans le DAO publié ?',
        options: [
          'Accorder l’ANO par courtoisie administrative',
          'Refuser l’Avis de Non-Objection (ANO) par décision motivée et demander la reprise de l’évaluation sur la base exclusive des critères annoncés dans le DAO',
          'Attribuer le marché par tirage au sort',
          'Annuler le budget du ministère'
        ],
        correctIndex: 1,
        explanation:
          'Le principe d’intangibilité des critères du DAO est d’ordre public : la DGCMP doit refuser l’ANO si l’évaluation s’écarte des règles publiées.'
      }
    ]
  },
  {
    id: 'MOD-018',
    code: 'MP-RDC-1801',
    title: 'Contrôle de l’Engagement Financier, Seuils de Passation et Encadrement du Gré à Gré',
    category: 'Contrôle',
    targetAudience: ['dgcmp_agent', 'cgpmp_member', 'armp_agent', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Spécialisé',
    legalRef: 'Loi n° 10/010 (Art. 26 à 31, 61) • Décret n° 10/22 • Chaîne de la Dépense Publique',
    description:
      'Approfondissez l’instruction des demandes d’autorisation spéciale de gré à gré (urgence impérieuse, exclusivité, marchés complémentaires), le contrôle des avenants et l’articulation avec la chaîne de la dépense publique.',
    coverImage: imgCoverSeminar,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 690,
    requiresDfatApproval: true,
    lessons: [
      {
        id: 'L-1801-1',
        title: 'Instruction Rigoureuse des Demandes d’Autorisation Spéciale de Gré à Gré (Art. 26 à 29)',
        duration: '50 min',
        format: 'animation',
        templateId: 'casestudy',
        keyArticles: [
          'Art. 26 à 29 Loi 10/010 (Hypothèses limitatives du marché de gré à gré)',
          'Charge de la preuve de l’urgence impérieuse non imputable à l’Autorité Contractante'
        ],
        content: `[Scène: dgcmp_shield] Caractère strictement exceptionnel et limitatif du gré à gré : La Loi n° 10/010 érige l’appel d’offres ouvert en règle générale et soumet tout recours au marché de gré à gré à l’autorisation spéciale préalable de la DGCMP, uniquement dans les cas limitativement énumérés aux articles 27 et 28. | Application terrain : Rejetez systématiquement toute demande de gré à gré fondée sur une urgence qui résulte en réalité du retard de planification ou de lancement imputable à l’Autorité Contractante elle-même.`
      },
      {
        id: 'L-1801-2',
        title: 'Négociation des Prix en Gré à Gré et Contrôle du Plafond de 15% des Marchés Complémentaires',
        duration: '45 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 29 et 61 Loi 10/010 (Contrôle des prix et plafond légal de 15%)',
          'Obligation de soumettre un sous-détail complet des prix en gré à gré'
        ],
        content: `[Scène: threshold_gauge] Contrôle des coûts et négociation encadrée par un référentiel de prix : Même lorsqu’une autorisation de gré à gré est légalement justifiée, l’Autorité Contractante doit organiser une négociation contradictoire documentée par procès-verbal afin de s’assurer que les prix proposés sont économiques et conformes à la mercuriale. | Application terrain : Exigez toujours la production du sous-détail complet des prix unitaires et des factures de référence avant de délivrer l’ANO sur un projet de contrat de gré à gré.`
      },
      {
        id: 'L-1801-3',
        title: 'Articulation entre le Visa DGCMP et la Chaîne de la Dépense Publique (Engagement / Liquidation)',
        duration: '40 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Loi relative aux Finances Publiques (LOFIP) et Loi n° 10/010',
          'Nullité absolue de tout engagement budgétaire sans ANO préalable au-dessus des seuils'
        ],
        content: `[Scène: sigmap_server] Verrouillage de l’engagement budgétaire par le numéro de visa DGCMP : Dans la chaîne informatisée de la dépense publique, aucun contrat de marché public dépassant le seuil réglementaire ne peut être engagé, liquidé ni ordonnancé par le Contrôleur Budgétaire ou le Comptable Public sans les références de l’ANO de la DGCMP. | Application terrain : Vérifiez la concordance exacte entre le montant TTC approuvé sur l’ANO, le contrat numéroté et le bon d’engagement budgétaire.`
      }
    ],
    quiz: [
      {
        question: 'Une Autorité Contractante qui a tardé pendant huit mois à lancer son appel d’offres malgré l’adoption de son budget peut-elle invoquer « l’urgence impérieuse » (Art. 27 Loi 10/010) pour passer un marché de gré à gré en fin d’exercice ?',
        options: [
          'Oui, la fin d’année budgétaire autorise automatiquement le gré à gré',
          'Non, l’urgence impérieuse ne peut légalement être invoquée que si elle résulte de circonstances imprévisibles et extérieures non imputables à la carence de l’Autorité Contractante',
          'Oui, si le montant est inférieur à dix milliards',
          'Oui, sur simple décision verbale de la PRM'
        ],
        correctIndex: 1,
        explanation:
          'L’article 27 de la Loi n° 10/010 exige que l’urgence impérieuse soit motivée par des circonstances imprévisibles et qu’elle ne résulte pas du fait ou de la négligence de l’Autorité Contractante.'
      }
    ]
  },
  {
    id: 'MOD-019',
    code: 'MP-RDC-1901',
    title: 'Instruction des Recours devant le CRD de l’ARMP, Effet Suspensif et Jurisprudence',
    category: 'Contentieux',
    targetAudience: ['armp_agent', 'pme', 'particulier', 'cgpmp_member', 'dgcmp_agent', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Spécialisé',
    legalRef: 'Loi n° 10/010 (Art. 73 à 76) • Décret n° 10/21 portant création de l’ARMP',
    description:
      'Maîtrisez de bout en bout le contentieux de la passation devant le Comité de Règlement des Différends (CRD) : calcul des délais francs et ouvrables, recevabilité du recours gracieux préalable, instruction contradictoire et exécution des décisions.',
    coverImage: imgCoverMentor,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 890,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-1901-1',
        title: 'Computation des Délais de Recours Gracieux et de Saisine du CRD (Art. 73 à 75)',
        duration: '45 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 73 Loi 10/010 (Recours gracieux préalable obligatoire sous 5 jours ouvrables)',
          'Art. 74 Loi 10/010 (Saisine du CRD dans les 3 jours ouvrables suivant la réponse ou le silence)'
        ],
        content: `[Scène: dao_calendar] Règle d’or du recours gracieux préalable obligatoire auprès de la PRM : Tout candidat qui s’estime lésé au titre des règles de lancement ou d’attribution provisoire doit impérativement saisir d’abord la Personne Responsable des Marchés d’un recours gracieux écrit dans les cinq jours ouvrables suivant la publication. | Application terrain : Déposez toujours votre recours gracieux contre accusé de réception daté et horodaté au secrétariat de la PRM avec copie immédiate à l’ARMP.

[Scène: scale_justice] Saisine du Comité de Règlement des Différends (CRD) en cas de rejet ou de silence : L’Autorité Contractante dispose de cinq jours ouvrables pour répondre de manière motivée ; à défaut de réponse ou en cas de rejet, le requérant dispose de trois jours ouvrables stricts pour enregistrer sa requête devant le CRD de l’ARMP. | Application terrain : Ne laissez jamais expirer le délai de trois jours ouvrables après le silence de l’administration, sous peine d’irrecevabilité pour forclusion.`
      },
      {
        id: 'L-1901-2',
        title: 'Effet Suspensif Automatique, Instruction Contradictoire et Pouvoirs d’Injonction du CRD',
        duration: '50 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 75 et 76 Loi 10/010 (Effet suspensif de plein droit et décision sous 15 jours ouvrables)',
          'Caractère obligatoire et exécutoire des décisions du CRD'
        ],
        content: `[Scène: dgcmp_shield] Suspension immédiate de la procédure de passation dès le recours : Dès l’introduction régulière du recours dans les délais légaux, la poursuite de la procédure et la signature du contrat sont suspendues de plein droit jusqu’au prononcé de la décision définitive du Comité de Règlement des Différends. | Application terrain : Toute signature de contrat intervenue en violation de l’effet suspensif pendant le délai d’attente (standstill) ou l’instruction CRD est frappée de nullité.`
      },
      {
        id: 'L-1901-3',
        title: 'Panorama des Grands Arrêts et Décisions de Principe du CRD de l’ARMP en RDC',
        duration: '45 min',
        format: 'animation',
        templateId: 'casestudy',
        keyArticles: [
          'Recueil annuel des décisions du CRD de l’ARMP',
          'Sanction du défaut de motivation des rejets et de la modification des critères'
        ],
        content: `[Scène: legal_codex] Les grands motifs d’annulation ou de réformation consacrés par le CRD : L’analyse de la jurisprudence de l’ARMP démontre que les décisions d’annulation sanctionnent principalement l’application de critères non prévus au DAO, le défaut de motivation du rejet d’une offre moins-disante et les erreurs manifestes dans le calcul arithmétique. | Application terrain : Appuyez chaque mémoire en défense (côté CGPMP) ou requête en contestation (côté PME) sur les décisions antérieures publiées par le CRD de l’ARMP.`
      }
    ],
    quiz: [
      {
        question: 'Quel est l’effet juridique immédiat d’un recours introduit régulièrement dans les délais légaux devant le Comité de Règlement des Différends (CRD) de l’ARMP avant la signature du marché ?',
        options: [
          'Il n’a aucun effet sur la signature du contrat',
          'Il entraîne la suspension automatique de plein droit de la procédure de passation jusqu’à la notification de la décision du CRD',
          'Il annule automatiquement le registre de commerce de l’entreprise',
          'Il transfère le dossier à une banque privée'
        ],
        correctIndex: 1,
        explanation:
          'Conformément aux articles 73 à 75 de la Loi n° 10/010, le recours exercé dans les délais légaux suspend de plein droit la procédure de passation et interdit toute signature du contrat jusqu’à la décision du CRD.'
      }
    ]
  },
  {
    id: 'MOD-020',
    code: 'MP-RDC-2001',
    title: 'Méthodologie d’Audit Indépendant a Posteriori ARMP, Détection des Collusions et Sanctions',
    category: 'Gestion & Audit',
    targetAudience: ['armp_agent', 'particulier', 'dgcmp_agent', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Spécialisé',
    legalRef: 'Loi n° 10/010 (Art. 15, 77 à 82) • Décret n° 10/21 • Charte d’Éthique',
    description:
      'Maîtrisez la conduite des audits indépendants annuels pilotés par l’ARMP : échantillonnage des marchés, revue de conformité procédurale et physique, détection des ententes anticoncurrentielles et procédure d’inscription sur la liste noire.',
    coverImage: imgCoverAudit,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 640,
    requiresDfatApproval: true,
    lessons: [
      {
        id: 'L-2001-1',
        title: 'Conduite des Audits Indépendants a Posteriori et Indicateurs de Conformité Nationale',
        duration: '45 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 15 Loi 10/010 (Missions d’audit indépendant de l’ARMP)',
          'Décret n° 10/21 du 02 juin 2010 (Contrôle a posteriori et évaluation du système)'
        ],
        content: `[Scène: armp_tower] Complémentarité entre le contrôle a priori DGCMP et l’audit a posteriori ARMP : Tandis que la DGCMP vérifie la régularité avant la signature, l’ARMP diligente à la fin de chaque exercice budgétaire des audits indépendants complets couvrant la passation, l’exécution financière et la réalité physique des ouvrages livrés. | Application terrain : Lors d’une mission d’audit, croisez systématiquement les pièces du dossier CGPMP avec les paiements effectués au Trésor et l’inspection visuelle sur le site des travaux.`
      },
      {
        id: 'L-2001-2',
        title: 'Détection des Pratiques Collusoires, Offres de Couverture et Fraudes Documentaires',
        duration: '50 min',
        format: 'animation',
        templateId: 'casestudy',
        keyArticles: [
          'Art. 77 à 80 Loi 10/010 (Sanctions des fraudes, corruptions et ententes)',
          'Faisceau d’indices des soumissions concertées'
        ],
        content: `[Scène: transparency_traceability] Identification des signaux d’alerte (Red Flags) de collusion entre soumissionnaires : Des erreurs d’orthographe identiques dans deux offres distinctes, des numéros de série consécutifs de cautions bancaires ou une rotation suspecte des attributaires par lot constituent des indices graves d’entente anticoncurrentielle. | Application terrain : Vérifiez systématiquement l’authenticité des garanties bancaires et des attestations fiscales directement auprès des banques et administrations émettrices.`
      },
      {
        id: 'L-2001-3',
        title: 'Procédure Contradictoire de Sanction et Gestion de la Liste Noire Nationale ARMP',
        duration: '45 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 78 et 79 Loi 10/010 (Exclusion temporaire ou définitive de la commande publique)',
          'Respect des droits de la défense avant inscription sur la liste des entreprises exclues'
        ],
        content: `[Scène: scale_justice] Garantie du contradictoire et publication de la décision d’exclusion : Lorsqu’un opérateur économique est convaincu d’usage de faux ou de manœuvres frauduleuses, l’ARMP lui notifie les griefs, recueille ses moyens de défense écrits, puis prononce une exclusion temporaire ou définitive publiée sur le portail national. | Application terrain : Consultez obligatoirement la liste noire actualisée de l’ARMP lors de chaque séance d’ouverture et d’analyse des plis avant toute proposition d’attribution.`
      }
    ],
    quiz: [
      {
        question: 'Quelle institution est légalement compétente en RDC pour prononcer l’exclusion temporaire ou définitive (inscription sur liste noire) d’une entreprise ayant produit une fausse garantie bancaire dans un appel d’offres ?',
        options: [
          'L’entreprise concurrente arrivée deuxième',
          'L’Autorité de Régulation des Marchés Publics (ARMP) à l’issue d’une procédure contradictoire conformément aux articles 77 à 80 de la Loi n° 10/010',
          'Le fournisseur de matériel informatique',
          'Le chef de chantier'
        ],
        correctIndex: 1,
        explanation:
          'L’ARMP détient le pouvoir de sanction administrative (exclusion temporaire ou définitive et inscription sur la liste noire nationale) à l’encontre des candidats fautifs, sans préjudice des poursuites pénales.'
      }
    ]
  },
  {
    id: 'MOD-021',
    code: 'MP-RDC-2101',
    title: 'Montage d’AMI, Propositions Techniques & Financières (SBQC/SCI) et Missions de Conseil',
    category: 'Passation',
    targetAudience: ['particulier', 'pme', 'cgpmp_member', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Avancé',
    legalRef: 'Loi n° 10/010 (Art. 32 à 36) • Décret n° 10/22 • DP Type ARMP Consultants',
    description:
      'Spécialement conçu pour les consultants individuels, bureaux d’études et experts : réussir sa pré-qualification sur Appel à Manifestation d’Intérêt (AMI), structurer une méthodologie gagnante sur TDR et négocier son contrat.',
    coverImage: imgCoverFormation,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 810,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-2101-1',
        title: 'Réussir son Dossier d’Appel à Manifestation d’Intérêt (AMI) pour figurer sur la Liste Restreinte',
        duration: '45 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 32 et 33 Loi 10/010 (Pré-sélection et liste restreinte de consultants)',
          'Justification des missions similaires par attestations de bonne fin'
        ],
        content: `[Scène: intellectual_compass] Constitution d’un dossier d’AMI percutant et vérifiable : Pour être retenu parmi les cinq à huit candidats de la liste restreinte (shortlist), le bureau d’études ou consultant doit démontrer une expérience spécifique directement alignée sur l’objet des Termes de Référence. | Application terrain : Pour chaque mission similaire citée dans votre AMI, joignez systématiquement la copie de la page de garde du contrat et l’attestation officielle de bonne exécution signée par le client.`
      },
      {
        id: 'L-2101-2',
        title: 'Rédaction de la Proposition Technique (Compréhension des TDR, Méthodologie, Chronogramme & CV)',
        duration: '50 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 34 Loi 10/010 (Critères d’évaluation technique des consultants)',
          'Grille de notation : expérience, méthodologie, plan de travail et personnel clé'
        ],
        content: `[Scène: dao_calendar] Maximiser son score technique sur la méthodologie et les experts clés : Dans une Sélection Basée sur la Qualité et le Coût (SBQC), la note technique représente généralement 80% de la note finale et repose majoritairement sur la pertinence de l’approche méthodologique et la qualification des experts clés. | Application terrain : Ne recopiez jamais passivement les Termes de Référence ; formulez des observations constructives sur les TDR, proposez un chronogramme réaliste et faites signer chaque CV par l’expert concerné.`
      },
      {
        id: 'L-2101-3',
        title: 'Calcul du Score Combiné (SBQC), Sélection de Consultants Individuels (SCI) et Négociation',
        duration: '45 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 35 et 36 Loi 10/010 (Méthodes SBQC, SBQ, SMC, SBD et SCI)',
          'Règles d’incompatibilité et prévention des conflits d’intérêts'
        ],
        content: `[Scène: scale_justice] Maîtrise du double pli étanche et de la formule de pondération technico-financière : Seules les propositions techniques atteignant le score minimum requis (souvent 70 ou 75 sur 100) voient leur pli financier ouvert en séance publique en présence des consultants qualifiés. | Application terrain : Ventilez avec précision vos honoraires (hommes-mois) et vos frais remboursables (transport, per diem, ateliers) afin de faciliter la négociation finale du contrat.`
      }
    ],
    quiz: [
      {
        question: 'Dans une procédure de Sélection Basée sur la Qualité et le Coût (SBQC) pour des prestations intellectuelles, quand ouvre-t-on les propositions financières ?',
        options: [
          'Dès le premier jour avant de lire les propositions techniques',
          'Uniquement après l’achèvement de l’évaluation technique, la délivrance de l’ANO sur le rapport technique et uniquement pour les candidats ayant atteint le score technique minimum requis',
          'Jamais, les prestations intellectuelles sont gratuites',
          'Par téléphone sans procès-verbal'
        ],
        correctIndex: 1,
        explanation:
          'En matière de prestations intellectuelles (Art. 33 à 35 Loi 10/010), l’évaluation s’effectue en deux étapes strictement séparées : les plis financiers ne sont ouverts publiquement que pour les candidats techniquement qualifiés.'
      }
    ]
  },
  {
    id: 'MOD-022',
    code: 'MP-RDC-2201',
    title: 'Audit Technique & Financier des Marchés Publics et Assistance aux Autorités Contractantes',
    category: 'Gestion & Audit',
    targetAudience: ['particulier', 'armp_agent', 'cgpmp_member', 'dgcmp_agent', 'dfat_admin', 'formateur'],
    duration: '8 Heures',
    level: 'Avancé',
    legalRef: 'Loi n° 10/010 (Art. 13, 15, 47 à 65) • Normes Internationales d’Audit',
    description:
      'Formez-vous aux missions d’expert indépendant et d’auditeur externe : conduite de revues techniques et financières de chantiers, vérification des métrés et décomptes, audit de conformité SIGMAP et rédaction de rapports contradictoires.',
    coverImage: imgCoverAudit,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 620,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-2201-1',
        title: 'Posture Déontologique de l’Expert Indépendant en Appui aux CGPMP et Commissions',
        duration: '40 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Décret n° 10/32 (Recours à des experts indépendants par la CGPMP/SCA)',
          'Charte d’éthique et obligation de réserve professionnelle'
        ],
        content: `[Scène: ministry_cgpmp] Rôle consultatif éclairé et indépendance de l’expert externe : Lorsqu’une CGPMP recrute un consultant ou ingénieur-conseil pour l’assister dans la rédaction d’un DAO complexe ou l’analyse technique des offres, l’expert apporte un avis technique motivé sans se substituer à la responsabilité collégiale de la commission. | Application terrain : Rédigez toujours vos notes d’expertise technique en référençant chaque conclusion par l’article précis du DAO et les pièces du pli examiné.`
      },
      {
        id: 'L-2201-2',
        title: 'Audit Physique et Financier des Chantiers : Contrôle des Attachements, Décomptes et Avenants',
        duration: '50 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 56 à 65 Loi 10/010 (Contrôle de l’exécution, réceptions et pénalités)',
          'Vérification contradictoire de la matérialité des travaux'
        ],
        content: `[Scène: construction_crane] Réconciliation entre l’avancement financier payé et l’avancement physique réel : L’auditeur technique et financier vérifie sur le terrain que chaque quantité facturée dans les décomptes provisoires correspond à des ouvrages réellement exécutés dans le respect des règles de l’art et des plans approuvés. | Application terrain : Mesurez contradictoirement sur site les linéaires, surfaces et épaisseurs réalisés et comparez-les aux attachements signés par la mission de contrôle.`
      },
      {
        id: 'L-2201-3',
        title: 'Structuration du Rapport d’Audit Contradictoire et Matrice des Recommandations Correctives',
        duration: '45 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Standards de rapportage d’audit de l’ARMP et des Bailleurs (BM/BAD)',
          'Procédure de contradictoire avec l’entité auditée'
        ],
        content: `[Scène: transparency_traceability] Formulation de constats objectifs et de recommandations opérationnelles : Un rapport d’audit de qualité classe les constats par niveau de gravité (conformité légale, gestion financière, archivage), recueille les observations écrites de l’Autorité Contractante et propose un plan d’action correctif daté. | Application terrain : Associez à chaque anomalie relevée la référence légale exacte de la Loi n° 10/010, l’impact financier chiffré et la mesure corrective immédiate.`
      }
    ],
    quiz: [
      {
        question: 'Lors d’un audit technique et financier d’un marché de travaux, quel écart constitue une irrégularité grave engageant la responsabilité de la mission de contrôle et du titulaire ?',
        options: [
          'La tenue régulière du journal de chantier',
          'Le paiement d’un décompte provisoire à hauteur de 80% du montant du marché alors que l’avancement physique réel constaté sur le terrain n’est que de 35% (surfacturation / paiement pour travaux non faits)',
          'La présence d’un panneau de chantier',
          'La délivrance d’une garantie de bonne exécution valide'
        ],
        correctIndex: 1,
        explanation:
          'Tout paiement d’acompte doit correspondre à des prestations effectivement réalisées et constatées par attachements contradictoires (règle du service fait).'
      }
    ]
  },
  {
    id: 'MOD-023',
    code: 'MP-RDC-2301',
    title: 'Ingénierie Pédagogique DFAT-ARMP, Animation de Sessions d’Habilitation et Cas Certifiants',
    category: 'Réglementation',
    targetAudience: ['formateur', 'dfat_admin', 'armp_agent'],
    duration: '10 Heures',
    level: 'Spécialisé',
    legalRef: 'Décret n° 10/21 (Missions DFAT-ARMP) & Référentiel National des Compétences MP-RDC',
    description:
      'Formation des formateurs homologués et superviseurs DFAT : conception de séquences andragogiques sur la Loi 10/010, animation d’ateliers de simulation (ouverture des plis, arbitrage CRD) et évaluation certificative.',
    coverImage: imgCoverMentor,
    chaptersCount: 3,
    rating: 5.0,
    studentsCount: 410,
    requiresDfatApproval: true,
    lessons: [
      {
        id: 'L-2301-1',
        title: 'Andragogie de la Commande Publique et Adaptation par Profil d’Apprenant (CGPMP, DGCMP, PME)',
        duration: '50 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Schéma Directeur National de Renforcement des Capacités (DFAT-ARMP)',
          'Approche Par Compétences (APC) appliquée aux métiers des marchés publics'
        ],
        content: `[Scène: armp_tower] Adapter l’enseignement de la Loi n° 10/010 aux réalités opérationnelles de chaque public : Un formateur certifié DFAT enseigne un même article de loi sous un angle différencié selon qu’il s’adresse à un acheteur CGPMP qui rédige le DAO, à un inspecteur DGCMP qui délivre l’ANO ou à un dirigeant de PME qui chiffre son offre. | Application terrain : Ouvrez chaque session de formation par un diagnostic rapide des profils présents afin d’orienter vos exemples pratiques vers leurs dossiers quotidiens.`
      },
      {
        id: 'L-2301-2',
        title: 'Conception de Simulations Pratiques : Jeu de Rôle d’Ouverture des Plis et Audience CRD',
        duration: '50 min',
        format: 'animation',
        templateId: 'casestudy',
        keyArticles: [
          'Guide méthodologique des travaux dirigés DFAT-ARMP',
          'Utilisation pédagogique des dossiers-types et décisions anonymisées du CRD'
        ],
        content: `[Scène: scale_justice] Ancrer les réflexes réglementaires par la simulation de cas réels : La mise en situation d’une séance publique d’ouverture des plis avec de vraies enveloppes scellées et la rédaction en direct du procès-verbal permettent aux apprenants de maîtriser instantanément les gestes professionnels exigés par le Décret n° 10/22. | Application terrain : Intégrez dans vos exercices pratiques des pièges réalistes (garantie expirant trop tôt, écart arithmétique BPU/DQE, procuration manquante) que les participants doivent détecter en sous-commission.`
      },
      {
        id: 'L-2301-3',
        title: 'Évaluation Certificative, Docimologie des QCM Officiels et Suivi Post-Formation DFAT',
        duration: '45 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Règlement d’homologation et de certification professionnelle ARMP',
          'Indicateurs d’impact post-formation sur le taux de conformité des marchés'
        ],
        content: `[Scène: citizen_impact_law] Garantir la valeur nationale du Certificat d’Aptitude ARMP : La rigueur des examens de fin de module (seuil de réussite, cas pratiques notés et traçabilité numérique) assure que chaque praticien certifié par la DFAT contribue directement à l’excellence et à l’intégrité de la dépense publique en RDC. | Application terrain : Rédigez pour chaque question d’évaluation un corrigé commenté citant l’article exact de la Loi n° 10/010 afin que l’examen soit lui-même un moment d’apprentissage.`
      }
    ],
    quiz: [
      {
        question: 'Quel est le principe directeur de l’Approche Par Compétences (APC) préconisée par la DFAT-ARMP dans la formation des acteurs de la commande publique ?',
        options: [
          'La récitation par cœur sans aucun exercice pratique',
          'La capacité démontrée par l’apprenant à accomplir sans erreur les actes professionnels réels de sa fonction (élaborer un PPM, rédiger un DAO, contrôler un rapport ou monter une offre PME conforme)',
          'L’absence totale d’évaluation finale',
          'L’utilisation de textes étrangers non applicables en RDC'
        ],
        correctIndex: 1,
        explanation:
          'Le référentiel pédagogique de la DFAT-ARMP vise la maîtrise opérationnelle des actes métiers propres à chaque acteur de la chaîne des marchés publics.'
      }
    ]
  },
  {
    id: 'MOD-024',
    code: 'MP-RDC-2401',
    title: 'Marchés Publics Provinciaux, Entités Territoriales Décentralisées (ETD) et Suivi Citoyen',
    category: 'Gestion & Audit',
    targetAudience: ['cgpmp_member', 'armp_agent', 'dgcmp_agent', 'pme', 'particulier', 'dfat_admin', 'formateur'],
    duration: '6 Heures',
    level: 'Intermédiaire',
    legalRef: 'Loi n° 10/010 (Art. 2, 13 à 15) • Loi sur la libre administration des Provinces & ETD',
    description:
      'Maîtrisez les spécificités de la passation, du contrôle et de l’exécution des marchés publics dans les 26 provinces et les Entités Territoriales Décentralisées (Villes, Communes, Secteurs, Chefferies) en RDC.',
    coverImage: imgCoverSeminar,
    chaptersCount: 3,
    rating: 4.9,
    studentsCount: 970,
    requiresDfatApproval: false,
    lessons: [
      {
        id: 'L-2401-1',
        title: 'Organisation des CGPMP Provinciales, des ETD et des Directions Provinciales DGCMP/ARMP',
        duration: '45 min',
        format: 'animation',
        templateId: 'character',
        keyArticles: [
          'Art. 2 Loi 10/010 (Application aux Provinces et aux Entités Territoriales Décentralisées)',
          'Déploiement provincial des organes de passation, de contrôle et de régulation'
        ],
        content: `[Scène: citizen_impact_law] Unité de la loi nationale sur l’ensemble des 26 provinces de la République : Que le marché soit financé sur le budget d’un Gouvernorat de province, d’une Mairie, d’une Commune, d’un Secteur ou d’une Chefferie, les règles de transparence et de mise en concurrence de la Loi n° 10/010 s’appliquent intégralement. | Application terrain : Adaptez vos calendriers de passation provinciaux aux réalités saisonnières et logistiques locales tout en respectant scrupuleusement les délais légaux de publicité.`
      },
      {
        id: 'L-2401-2',
        title: 'Promotion des PME Locales Provinciales et Exécution des Infrastructures de Base',
        duration: '45 min',
        format: 'animation',
        templateId: 'infographic',
        keyArticles: [
          'Art. 20 et 46 Loi 10/010 (Allotissement géographique et PME locales)',
          'Marchés de développement communautaire et travaux à Haute Intensité de Main-d’Œuvre (HIMO)'
        ],
        content: `[Scène: construction_crane] Dynamisation du tissu entrepreneurial provincial par les chantiers d’écoles, de centres de santé et de pistes rurales : L’allotissement territorial permet aux PME établies dans chaque province de participer directement à la construction des infrastructures de proximité tout en recrutant la main-d’œuvre locale. | Application terrain : Privilégiez l’utilisation des matériaux locaux homologués et le paiement ponctuel des décomptes pour consolider les entreprises des provinces.`
      },
      {
        id: 'L-2401-3',
        title: 'Redevabilité Publique, Publication des Attributions et Contrôle Citoyen des Ouvrages',
        duration: '40 min',
        format: 'animation',
        templateId: 'whiteboard',
        keyArticles: [
          'Art. 37 et 72 Loi 10/010 (Publicité des avis et des résultats d’attribution)',
          'Transparence budgétaire et redevabilité envers les usagers'
        ],
        content: `[Scène: transparency_traceability] Affichage public et transparence envers les communautés bénéficiaires : Au-delà de la publication sur le portail national de l’ARMP, l’affichage des avis d’appel d’offres, des montants d’attribution et des panneaux de chantier détaillés permet aux citoyens et à la société civile de veiller à la bonne exécution des ouvrages publics. | Application terrain : Imposez sur chaque chantier provincial un panneau réglementaire indiquant l’objet du marché, le maître d’ouvrage, l’entreprise titulaire, le délai, le montant et la source de financement.`
      }
    ],
    quiz: [
      {
        question: 'Les marchés publics passés par les Gouvernorats de province et les Entités Territoriales Décentralisées (Villes, Communes, Secteurs, Chefferies) en RDC sont-ils soumis à la Loi n° 10/010 ?',
        options: [
          'Non, la Loi n° 10/010 ne s’applique qu’à Kinshasa',
          'Oui, l’article 2 de la Loi n° 10/010 soumet expressément l’État, les Provinces, les Entités Territoriales Décentralisées, les entreprises publiques et les établissements publics aux mêmes règles du Code des marchés publics',
          'Non, les provinces passent tous leurs marchés sans contrat écrit',
          'Uniquement pour les achats de véhicules'
        ],
        correctIndex: 1,
        explanation:
          'L’article 2 de la Loi n° 10/010 du 27 avril 2010 inclut expressément les Provinces et les Entités Territoriales Décentralisées (ETD) dans le champ d’application obligatoire du Code des marchés publics.'
      }
    ]
  }
];

export const INITIAL_COURSES: CourseModule[] = COURSES_DATA;
