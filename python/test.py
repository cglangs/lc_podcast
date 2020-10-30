from neo4j import GraphDatabase
import csv
import jieba
import regex



jieba.set_dictionary("user_dict.txt")
driver = GraphDatabase.driver("bolt://localhost:11003", auth=("neo4j", "password"))
punc = "！？｡。＂＃＄％＆＇（）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､、〃》「」『』【】〔〕〖〗〘〙〚〛〜〝〞〟〰〾〿–—‘’‛“”„‟…‧﹏."
word_frequencies = {}
sentence_data={}


def print_sentence():
	with driver.session() as session:
		with open('interval3.csv') as csvfile:
			readCSV = csv.reader(csvfile, delimiter=',')
			rows = list(readCSV)
			rows.pop(0)
			counter = 1
			for sentence in rows:
				formatted_sentence = regex.sub(r"[%s]+" %punc, "", sentence[0])
				seg_list = list(jieba.cut(formatted_sentence, cut_all=False, HMM=False))
				sentence_data[counter]={"raw_sentence": sentence[0], "formatted_sentence": formatted_sentence, "characters": seg_list}
				for word in seg_list:
						if word not in word_frequencies:
							word_frequencies[word] = 0
						word_frequencies[word] += 1
				counter += 1
				#exampleSentence = session.write_transaction(_create_and_return_greeting, characters=row[0])

			for key in sentence_data:
				sentence_data[key]["freq_score"] =sum([word_frequencies[w] for w in sentence_data[key]["characters"]]) / len(sentence_data[key]["characters"])
			sorted_sentence_data = {k: v for k, v in sorted(sentence_data.items(), key=lambda item: item[1]["freq_score"], reverse=True)}
			print(sorted_sentence_data)



					#print(", ".join(seg_list))

#def _create_and_return_greeting(tx, characters):
#		result = tx.run("CREATE (s:Sentence) "
#						"SET s.raw_text = $characters "
#						"RETURN s.raw_text", characters=characters)
#		return result.single()[0]




print_sentence()




