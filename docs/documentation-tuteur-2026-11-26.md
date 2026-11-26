# Documentation du tuteur — contrôle du 26 novembre 2026

Périmètre : les 39 publications des quatre pages du catalogue Documentation ARMP, avec leurs pièces jointes. Le contenu intégral extrait est conservé côté serveur ; la bibliothèque cliente ne reçoit que les notices et liens sources. Les PDF scannés restent des transcriptions OCR non certifiées. Ce travail ne constitue pas une certification juridique de tous les supports avancés.

## Corrections et performance

- Classification : quatre types de marchés, dont les prestations intellectuelles (loi 10/010, articles 7, 11 et 40). Chapitre d’initiation, politique du tuteur et définitions directes corrigés.
- Manuel 23/12 du 3 mars 2023 : article 195 contrôlé visuellement sur la page PDF 41 ; le manuel 10/22 de 2010 est abrogé et classé en archive. Références du parcours d’initiation actualisées.
- DGCMP : décret 10/27, et non 10/23, dans la bibliothèque et le pied de page.
- Les fausses citations et listes chiffrées présupposées des suggestions du chat sont retirées.
- Le tuteur ne récupère plus les affirmations juridiques de l’ancienne base avancée codée en dur. Les sources officielles passent avant le cours actif et l’historique. Les anciens supports avancés nécessitent encore une relecture éditoriale juridique, notamment leurs références historiques ; ils ne font plus autorité dans les réponses du tuteur.
- Définitions courantes contrôlées sans appel au LLM ; cas et procédures restent soumis à la recherche documentaire. Recherche locale indexée au démarrage, trois passages complets maximum, sans téléchargement ni moteur d’embeddings par question.
- Le corpus ne coupe pas les articles aux sauts de page. Les articles trop longs ne sont pas tronqués pour remplir le contexte. Les textes provinciaux et archives ne sont pas sélectionnés par défaut.
- Politique système raccourcie sans supprimer les conditions et exceptions ; vérifiée avec toutes les langues et le second essai, sous la limite de 8000 caractères.
- Les vidéos de réponse restent des portraits de la tutrice. Le réveil GPU et la génération vidéo ne sont pas supprimés par cette optimisation textuelle.

## Vérifications

44 tests ciblés réussis (définitions, recherche et provenance, isolation archives/provinces, protocole Qwen, langues, sigles, vidéo et cache), TypeScript, build et démarrage de l’API. Recherche locale mesurée environ 1–3 ms dans ces tests ; ce chiffre exclut réseau, authentification, inférence et médias.

## Inventaire des sources

Source du catalogue : https://armp-rdc.cd/category/documentation/

| Document | Lecture | Unités de lecture | Empreinte SHA-256 |
|---|---|---:|---|
| [NOUVELLE LOI SUR LE CONTENU LOCAL ( Journal Officiel de la République Démocratique du Congo )](https://armp-rdc.cd/wp-content/uploads/2026/08/Loi-sur-le-contenu-local.pdf) | ocr-unreviewed | 14 | 08e7c1531a501d89c4ca21aebd50685cc19bdae379f9fcaaee4496e1341dde38 |
| [CIRCULAIRE N°003/MINETAT/MIN.BUDGET/2025 DU 13 MARS 2025](https://armp-rdc.cd/wp-content/uploads/2025/03/CIRCULAIRE-003-DU-13-MARS-2025-PORTANT-MANUEL-UTILISATEURS-SIGMAP.pdf) | ocr-unreviewed | 3 |  |
| [ARRETE MINISTERIEL N°001/ME/MIN.BUDGET/25 DU 13 MARS 2025](https://armp-rdc.cd/wp-content/uploads/2025/03/ARRETE-MINISTERIEL-001-DU-13-MARS-2025-PLATEFORME-NUMERIQUE-DE-GESTION-DES-MP.pdf) | ocr-unreviewed | 6 | 2c43d228df99341c8278e85fe70fd041d5aed772c697deee7ba1adf012ddfe35 |
| [DECRET N°24/13 DU 14 OCTOBRE 2024](https://armp-rdc.cd/wp-content/uploads/2025/02/Decret-n%C2%B024-13-Gestion-Electroniq-MP-en-RDC.pdf) | ocr-unreviewed | 20 |  |
| [DECRET N° 23/12 DU 03 MARS 2023](https://armp-rdc.cd/wp-content/uploads/2023/08/DECRET-N%C2%B023-12-DU-03-MARS-2023-PORTANT-MANUEL-DE-PROCEDURES-DES-MARCHES-PUBLICS-1.pdf) | ocr-unreviewed | 40 | 33adbabc45d4bcf5867f36e14a073680f2f2f21c90d165450b9aa1f03486c1c1 |
| [AUTORITÉ DE RÉGULATION DES MARCHÉS PUBLICS (ARMP)](https://armp-rdc.cd/wp-content/uploads/2022/12/CIRCULAIRE-ARMP-N%C2%B02481-12-2022.pdf) | text-extraction | 2 | af13a60b8a47015514b8c525ecf58df49836537c330a4c5968a5cd2eaa3cf3c3 |
| [PROVINCE DU KASAI-ORIENTAL](https://armp-rdc.cd/wp-content/uploads/2022/03/EDIT_KASAI_ORIENTAL.pdf) | ocr-unreviewed | 30 |  |
| [PROVINCE DE KINSHASA](https://armp-rdc.cd/wp-content/uploads/2022/03/Edit_de_Kinshasa.pdf) | ocr-unreviewed | 12 | 3c9a730303f3d6ca1d88c87087bcf6b8a1806646570d6953e2b1b98cd9023b60 |
| [PROVINCE DU MANIEMA](https://armp-rdc.cd/wp-content/uploads/2022/03/Edit_de_Maniema.pdf) | ocr-unreviewed | 11 |  |
| [PROVINCE DU SUD-KIVU](https://armp-rdc.cd/wp-content/uploads/2022/03/Edit_Provincial_Sud_Kivu.pdf) | text-extraction | 15 | 4ae201c1da9a47d3957fb816f769c1ad0317d5ce8c062f5f5d57285e6628bfa3 |
| [PROVINCE DU KASAI](https://armp-rdc.cd/wp-content/uploads/2022/03/EDIT_DE_LA_PROVINCE_DU_KASAI.pdf) | ocr-unreviewed | 13 |  |
| [EDIT DU KONGO CENTRAL](https://armp-rdc.cd/wp-content/uploads/2022/03/EDIT_DE_BAS-CONGO.pdf) | ocr-unreviewed | 8 |  |
| [PROVINCE DU BANDUNDU](https://armp-rdc.cd/wp-content/uploads/2022/03/EDIT-DE-BANDUNDU.pdf) | ocr-unreviewed | 12 |  |
| [PROVINCE DE L’EQUATEUR](https://armp-rdc.cd/wp-content/uploads/2022/03/EDIT_EQUATEUR.pdf) | ocr-unreviewed | 13 | 5b6f8660e17ef8211e2c95dc41855e55818775ebe847abd2fc3c2b05f25237c2 |
| [MODÈLE DE PLAN DE PASSATION DES MARCHÉS](https://armp-rdc.cd/wp-content/uploads/2022/03/Modele_de_Plan_de_passation_des_marches-1.xls) | text-extraction | 1 | 4c6e9331dcc1fec2de28bd777050e3645db2363352cac5393b26fc906160550b |
| [EDIT-TYPE](https://armp-rdc.cd/wp-content/uploads/2022/03/edit-type.doc) | text-extraction | 1 | 6cd23e06e9a6b1dad5a91c455bb629994652de4e6b29e67bebfb29a8fb01a539 |
| [GUIDE D’EVALUATION DES OFFRES POUR LES MARCHES DE FOURNITURES OU DE TRAVAUX](https://armp-rdc.cd/wp-content/uploads/2022/03/DRC_Guide_devaluation_des_offres_Trx_et_Frt_vf-1.doc) | text-extraction | 1 | 89e4326aa620b96c9dc51e7d8923238cd8843661d5eba3c5000c5a24b99f911d |
| [DOCUMENT STANDARD DE PRE QUALIFICATION](https://armp-rdc.cd/wp-content/uploads/2022/03/DTAO_Dossier_de_prqualification_vf.doc) | text-extraction | 1 | db8d21030921d746b8fd8c610506c078b206177ef64d2a07d5500e3ee6868172 |
| [DOSSIER-TYPE DE DEMANDE DE PROPOSITIONS SIMPLIFIE –  PRESTATIONS INTELLECTUELLES](https://armp-rdc.cd/wp-content/uploads/2022/03/DRC_DTP_simplifie__prestations_intellectuelles.doc) | text-extraction | 1 | aa3208b7926f7923962c3cc2f7c9af89a076b202d2fcb661bc70a88ec59707eb |
| [DOSSIER TYPE D’APPEL D’OFFRES DES TRAVAUX /SIMPLIFIE](https://armp-rdc.cd/wp-content/uploads/2022/03/DRC_DTAO_simplifi_Travaux_vf.doc) | text-extraction | 1 | 7d8f32e7b00c198adf814aa7beda61da55221f6d166182779c47dac0c2a4ebe5 |
| [DOSSIER TYPE D’APPEL D’OFFRES FOURNITURE /SIMPLIFIE](https://armp-rdc.cd/wp-content/uploads/2022/03/DRC_DTAO_simplifie_Fournitures_vf.doc) | text-extraction | 1 | 601c43d02af80385f5a5c36b33b72a462dee31d756e45f41b4f498a4bdbb9033 |
| [DECISION-TYPE DE CREATION CGPMP](https://armp-rdc.cd/wp-content/uploads/2022/03/Decision_type_creation_CGPMP_ETS_PUB.docx) | text-extraction | 1 | b07131b12cf0d5b6637a5a3e1e28201fa0872bb14706c3a8123e3b2cace93ebf |
| [DECRET N°10/22 DU 02 JUIN 2010](https://armp-rdc.cd/wp-content/uploads/2022/03/DECRET_10-22_Manuel_de_procedures.pdf) | text-extraction | 61 | 82d3f7358b7e94a57a6117c2fdc6059f282c11cbef345ee776237b871d51133e |
| [PROVINCE DE LOMAMI](https://armp-rdc.cd/wp-content/uploads/2022/02/EDIT_N002_DU_22-12-2016-2.pdf) | ocr-unreviewed | 27 |  |
| [PROVINCE DE LA TSHOPO](https://armp-rdc.cd/wp-content/uploads/2022/02/EDIT_DE_LA_PROVINCE_DE_L_TSHOPO-1.pdf) | ocr-unreviewed | 20 |  |
| [DOSSIER – TYPE D’APPEL D’OFFRES – FOURNITURE](https://armp-rdc.cd/wp-content/uploads/2022/03/DTAO_Fournitures_vf-2.doc) | text-extraction | 1 | f797a0f47b6369dd4cb3817af71704c7e28b725d08b1a17e3dc8375a11183294 |
| [DOSSIER-TYPE DE DEMANDE DE PROPOSITIONS](https://armp-rdc.cd/wp-content/uploads/2022/02/DRC_DTP_simplifie__prestations_intellectuelles.doc) | text-extraction | 1 | aa3208b7926f7923962c3cc2f7c9af89a076b202d2fcb661bc70a88ec59707eb |
| [DECISION TYPE PORTANT DESIGNATION DES MEMBRES DE LA CGPMP.](https://armp-rdc.cd/wp-content/uploads/2022/02/DECISION_PORTANT_DESIGNATION_DES_MEMBRES_DE_CGPMP.docx) | text-extraction | 1 | e14b2bce1d487c79fa0e0ce50f1634a40c4920454c5d444f7e7866948417a734 |
| [MODELE FICHE D’APPROBATION](https://armp-rdc.cd/wp-content/uploads/2022/02/FICHE_DAPPROBATION.docx) | text-extraction | 1 | a1f53eaf9f478a01cf94616a85c858223a9cdcd02f4c570368d39b4ae47dd508 |
| [DECRET N°10/32 DU 28 DECEMBRE 2010](https://armp-rdc.cd/wp-content/uploads/2022/02/Decret_10-32_CGPMP.pdf) | text-extraction | 13 | 8499e2f4bade6803817e7b6e7e56319513c360467ae2471ef38302ad059dc0e7 |
| [DECRET N°10/21 DU 02 JUIN 2010](https://armp-rdc.cd/wp-content/uploads/2022/02/DECRET_10-21_ARMP.pdf) | text-extraction | 32 | e95b5319720ccb3e0d55af86ab45da6f3f64910592cb5f17892127dfddc8cb40 |
| [LOI N°10/010 DU 27 AVRIL 2010 RELATIVE AUX MARCHÉS PUBLICS](https://armp-rdc.cd/wp-content/uploads/2021/12/Lois-relative-aux-marchs-publicsx.pdf) | text-extraction | 31 | 9bc3b6a435c78c23c3b5fbc3dc95e20548e63986f5b37b93f80da562d9983307 |
| [DECRET N° 18/001 DU 12 JAN 2018](https://armp-rdc.cd/wp-content/uploads/2022/02/DECRET_N_18-001_DU_12_JAN_2018PORTANT_FIXATION_DU_TAUX_DE_LA_R.pdf) | ocr-unreviewed | 3 |  |
| [LOI N°18/016 DU 09 JUILLET 2018 RELATIVE AU PARTENARIAT PUBLIC-PRIVE](https://armp-rdc.cd/wp-content/uploads/2022/02/LOI-No-18-016-DU-09-JUILLET-2018-2.pdf) | ocr-unreviewed | 18 | 3c148e20975eb379fd86f75f8ab55a698429ccb55422e1e779ba7ede635ac8f5 |
| [LOI N°11/011 DU 13 JUILLET 2011 RELATIVE AUX FINANCES PUBLIQUES](https://armp-rdc.cd/wp-content/uploads/2022/02/Loi-relative-aux-finances-publiques-4.pdf) | text-extraction | 87 | 04e17c1a3cfd54185992be933465c0167079badd0be260231b0a99381df51b80 |
| [DECRET N°10/27 DU 28/06/2010](https://armp-rdc.cd/wp-content/uploads/2022/02/DECRET_N__10_27_DGCMP1.pdf) | text-extraction | 15 | 49cdf70773744865ddda369d6d41a4ea86ac56bf1a58e3727a422ed23ba59350 |
| [CIRCULAIRE N°CAB/PM/CTS/EKT/07/2020/1453](https://armp-rdc.cd/wp-content/uploads/2022/02/Circulaire_FormalitesEnregistrementDesMP.pdf) | ocr-unreviewed | 3 |  |
| [DECRET N° 010/34 du 28 DECEMBRE 2010](https://armp-rdc.cd/wp-content/uploads/2021/09/DECRET_10-34_fixant_le_seuil.pdf) | text-extraction | 7 | 5e3e678f7fd04e065c6edce1c2ac28ac07c04401cb74ebf1c17e2f5e903f9354 |
| [DECRET N° 10/33 du 28 DECEMBRE 2010](https://armp-rdc.cd/wp-content/uploads/2022/03/DECRET_10-33_modalites_dapprobation.pdf) | text-extraction | 5 | 98ab15ce40bc7dc831aecd8762c5841de5cfe887e7ca5c0901b7289feaba91d9 |

Les unités correspondent aux pages PDF et, pour les fichiers bureautiques, aux sections extraites. Les annexes d’autres décrets présentes dans le numéro du Journal officiel du manuel 2023 sont exclues de ses passages de recherche. Les transcriptions OCR conservent leur indication de provenance ; aucun montant ou délai ne doit être certifié à partir d’un scan non relu. Les dates et versions restent celles des publications, sans présumer une consolidation juridique générale.
