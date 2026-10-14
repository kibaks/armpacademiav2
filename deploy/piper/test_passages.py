import unittest
from passages import split_passages
class PassagesTest(unittest.TestCase):
 def test_complete_long_narration(self):
  text = ("Avant de lancer l’achat, vérifiez les crédits budgétaires. Chaque entreprise conserve les mêmes chances et aucune marque ne doit être imposée. " * 12).strip()
  parts = split_passages(text)
  self.assertGreater(len(parts), 2)
  self.assertEqual(' '.join(parts), text)
  self.assertTrue(all(len(part) <= 240 for part in parts))
 def test_negations_and_oversize_word(self):
  text = "Ne retirez jamais les pièces. " + 'x'*300 + " Le dossier reste complet."
  self.assertEqual(' '.join(split_passages(text)), text)
  self.assertEqual(split_passages(''), [])
if __name__ == '__main__': unittest.main()
