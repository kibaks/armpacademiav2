import json
import unittest
from qwen_engine import fit_chat

class ContextTests(unittest.TestCase):
    def test_small_context_is_unchanged(self):
        body={'system':'ARMP policy','prompt':'Question simple'}
        self.assertEqual(fit_chat(body,lambda m:len(str(m))),[{'role':'system','content':body['system']},{'role':'user','content':body['prompt']}])
    def test_large_profile_and_history_preserve_question_policy_and_complete_sources(self):
        data={'question':'Que prévoit cette exception ?','profil':'x'*20000,'lecon':'Leçon complète, condition et exception.','extraitsDuCours':'Source complète, avec son exception.','historique':[{'text':'y'*2000}]*6}
        body={'system':'Règles ARMP intangibles','prompt':'Données :\n'+json.dumps(data)}
        messages=fit_chat(body,lambda m:len(str(m)),limit=700)
        result=json.loads(messages[1]['content'].split('\n',1)[1])
        self.assertEqual(messages[0]['content'],body['system'])
        self.assertEqual(result['question'],data['question'])
        self.assertEqual(result['lecon'],data['lecon'])
        self.assertEqual(result['extraitsDuCours'],data['extraitsDuCours'])
        self.assertTrue(result['contexteReduit'])
    def test_whole_retrieved_sources_removed_without_cutting_the_active_lesson(self):
        data={'question':'Ma question exacte','lecon':'Règle active avec son exception.','extraitsDuCours':'En-tête\n• Cours A\nRègle complète.\n• Cours B\n'+'x'*2000}
        messages=fit_chat({'system':'Policy','prompt':'Données :\n'+json.dumps(data)},lambda m:len(str(m)),limit=500)
        result=json.loads(messages[1]['content'].split('\n',1)[1])
        self.assertEqual(result['lecon'],data['lecon'])
        self.assertIn('Règle complète.',result['extraitsDuCours'])
        self.assertNotIn('Cours B',result['extraitsDuCours'])
    def test_unstructured_or_oversized_question_fails_instead_of_silently_truncating(self):
        with self.assertRaises(ValueError):fit_chat({'system':'Policy','prompt':'x'*500},lambda m:len(str(m)),limit=100)
        with self.assertRaises(ValueError):fit_chat({'system':'Policy','prompt':json.dumps({'question':'x'*500})},lambda m:len(str(m)),limit=100)

if __name__=='__main__':unittest.main()
