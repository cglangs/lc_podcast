from neo4j import GraphDatabase
import csv
import jieba
import regex



jieba.set_dictionary("hsk1_dict.txt")
driver = GraphDatabase.driver("bolt://localhost:11003", auth=("neo4j", "password"))
punc = "！？｡。＂＃＄％＆＇（）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､、〃》「」『』【】〔〕〖〗〘〙〚〛〜〝〞〟〰〾〿–—‘’‛“”„‟…‧﹏.0123456789a-zA-Z"
word_frequencies = {}
word_intervals = {}
sentence_data={}
used_words = set()


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

				sentence_data[counter]={"raw_sentence": sentence[0], "formatted_sentence": formatted_sentence, "words": seg_list}
				for word in seg_list:
						if word not in word_frequencies:
							word_frequencies[word] = 0
						word_frequencies[word] += 1
				counter += 1
			for key in sentence_data:
				sentence_data[key]["freq_score"] = sum([word_frequencies[w] for w in sentence_data[key]["words"]]) / len(sentence_data[key]["words"])
			sorted_sentence_data = {k: v for k, v in sorted(sentence_data.items(), key=lambda item: item[1]["freq_score"], reverse=True)}

			for s_key in sorted_sentence_data:
				words = sorted_sentence_data[s_key]["words"]
				old_words = [w for w in words if w in used_words]
				new_words = [w for w in words if w not in used_words]
				if(len(new_words) > 0):
					lowest_frequency = min([word_frequencies[w] for w in new_words])
					word_to_teach  = [ w for w in new_words if word_frequencies[w] == lowest_frequency][0]
					for nw in new_words:
						if nw not in word_intervals:
							word_intervals[nw] = 0
						word_intervals[nw] += 1
					interval = 1
				else:
					fewest_intervals = min([word_intervals[w] for w in old_words])
					words_at_fewest_intervals = [ w for w in old_words if word_intervals[w] == fewest_intervals]
					highest_frequency= max([word_frequencies[w] for w in words_at_fewest_intervals])
					word_to_teach  = [ w for w in words_at_fewest_intervals if word_frequencies[w] == highest_frequency][0]
					word_intervals[word_to_teach] += 1
					interval = fewest_intervals + 1
				sorted_sentence_data[s_key]["word_to_teach"] = word_to_teach
				sorted_sentence_data[s_key]["interval"] = interval

				used_words.update(new_words)
				#print(words, new_words, sorted_sentence_data[s_key]["word_to_teach"],sorted_sentence_data[s_key]["interval"])
			#print(word_intervals)
			#print({k: v for k, v in sorted(word_frequencies.items(), key=lambda item: item[1], reverse=True)})
			#print(sorted_sentence_data)
			#	exampleSentence = session.write_transaction(_insert_sentence, words=row[0])
			#	print(exampleSentence)



def _insert_sentence(tx, words):
		result = tx.run("CREATE (s:Sentence) "
						"SET s.raw_text = $words "
						"RETURN s.raw_text", words=words)
		return result.single()[0]




print_sentence()




