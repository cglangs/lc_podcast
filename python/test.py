import psycopg2
import csv
import jieba
import regex



jieba.set_dictionary("hsk1_dict.txt")
#driver = GraphDatabase.driver("bolt://localhost:11003", auth=("neo4j", "password"))
con = psycopg2.connect(database="postgres", user="postgres", password="pass", host="127.0.0.1", port="5432")
print("Database opened successfully")
cur = con.cursor()
punc = "！？｡。＂＃＄％＆＇（）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､、〃》「」『』【】〔〕〖〗〘〙〚〛〜〝〞〟〰〾〿–—‘’‛“”„‟…‧﹏.0123456789a-zA-Z"
word_frequencies = {}
word_iterations = {}
sentence_data={}
used_words = set()


def print_sentence():
	#with driver.session() as session:
	with open('interval3.csv') as csvfile:
		readCSV = csv.reader(csvfile, delimiter=',')
		rows = list(readCSV)
		rows.pop(0)
		counter = 1
		for sentence in rows:
			formatted_sentence = regex.sub(r"[%s]+" %punc, "", sentence[0])
			seg_list = list(jieba.cut(formatted_sentence, cut_all=False, HMM=False))

			sentence_data[counter]={"raw_text": sentence[0], "pinyin": sentence[1],"english": sentence[2], "clean_text": formatted_sentence, "words": seg_list}
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
					if nw not in word_iterations:
						word_iterations[nw] = 0
					word_iterations[nw] += 1
				iteration = 1
			else:
				fewest_iterations = min([word_iterations[w] for w in old_words])
				words_at_fewest_iterations = [ w for w in old_words if word_iterations[w] == fewest_iterations]
				highest_frequency= max([word_frequencies[w] for w in words_at_fewest_iterations])
				word_to_teach  = [ w for w in words_at_fewest_iterations if word_frequencies[w] == highest_frequency][0]
				word_iterations[word_to_teach] += 1
				iteration = fewest_iterations + 1
			sorted_sentence_data[s_key]["word_to_teach"] = word_to_teach
			sorted_sentence_data[s_key]["display_text"] = sorted_sentence_data[s_key]["raw_text"].replace(word_to_teach, '#')
			sorted_sentence_data[s_key]["iteration"] = iteration
			sorted_sentence_data[s_key]["new_words"] = new_words
			#sorted_sentence_data[s_key]["alone_words"] = new_words.remove(word_to_teach) if word_to_teach in new_words else new_words
			used_words.update(new_words)
		insert_phrases = []
		insert_words = []
		#records_list_template = ','.join(['%s'] * 5)
		for k,v in word_frequencies.items():
			insert_words.append((k,v))

		insert_words_query = 'INSERT INTO cloze_chinese.words (word_text,word_occurrences) VALUES (%s, %s)'

		cur.executemany(insert_words_query,insert_words)

		for k,v in sorted_sentence_data.items():
			current_row = []
			current_row = (v["raw_text"], v["clean_text"], v["display_text"], v["pinyin"], v["english"])
			insert_phrases.append(current_row)
		insert_phrases_query = """
		INSERT INTO cloze_chinese.phrases (raw_text, clean_text, display_text, pinyin, english) VALUES (%s, %s, %s, %s, %s);
		"""
		#print(insert_words)
		#cur.executemany(insert_phrases_query,insert_phrases)


		con.commit()
		print("Record inserted successfully")
		con.close()

			#for insert_sentence_key in sorted_sentence_data:
			#	exampleSentence = session.write_transaction(
			#	 _insert_sentence,
			#	 sorted_sentence_data[insert_sentence_key]["raw_text"],
			#	 sorted_sentence_data[insert_sentence_key]["formatted_sentence"],
			#	 sorted_sentence_data[insert_sentence_key]["word_to_teach"],
			#	 sorted_sentence_data[insert_sentence_key]["words"],
			#	 sorted_sentence_data[insert_sentence_key]["new_words"],
			#	 sorted_sentence_data[insert_sentence_key]["alone_words"],
			#	 sorted_sentence_data[insert_sentence_key]["iteration"]
			#	 )
				#print(words, new_words, sorted_sentence_data[s_key]["word_to_teach"],sorted_sentence_data[s_key]["iteration"])
			#print(word_iterations)
			#print({k: v for k, v in sorted(word_frequencies.items(), key=lambda item: item[1], reverse=True)})
			#print(sorted_sentence_data)
			#	exampleSentence = session.write_transaction(_insert_sentence, words=row[0])
			#	print(exampleSentence)



#def _insert_sentence(tx, raw_text, formatted_sentence, word_to_teach, words, new_words, alone_words, iteration):
#		result = tx.run(
#						raw_text=raw_text, 
#						formatted_sentence=formatted_sentence,
#						word_to_teach=word_to_teach,
#						words=words,
#						new_words=new_words,
#						alone_words=alone_words,
#						)
#		return result.single()




print_sentence()




