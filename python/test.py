import psycopg2
import csv
import jieba
import regex



jieba.set_dictionary("user_dict.txt")
#driver = GraphDatabase.driver("bolt://localhost:11003", auth=("neo4j", "password"))
con = psycopg2.connect(database="postgres", user="postgres", password="pass", host="127.0.0.1", port="5432")
print("Database opened successfully")
cur = con.cursor()
punc = "\"\\!?,！？｡。＂＃＄％＆＇%&/:;°·℃（）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､、〃》「」『』【】〔〕〖〗〘〙〚〛《》〜〝〞〟〰〾〿–—‘’‛“”„‟…‧﹏.0123456789a-zA-Z"
word_frequencies = {}
word_iterations = {}
word_ranks = {}
sentence_data={}
used_words = set()
one_word_sentences = {}
rank_dict ={}


def print_sentence():
	with open('known_words.csv') as knownwordsfile:
		readKnownWords = csv.reader(knownwordsfile, delimiter=',')
		vocabRows = list(readKnownWords)
		vocab = [elt for lst in vocabRows for elt in lst]


	with open('sentencemine.tsv') as csvfile:
		readCSV = csv.reader(csvfile, delimiter='\t')
		rows = list(readCSV)
		#rows.pop(0)
		counter = 1
		for sentence in rows:
			formatted_sentence = regex.sub(r"[{}]+".format(punc), "", sentence[0].replace(" ", "").replace("-","").replace("[","").replace("]","").replace("─","").replace("\u3000",""))
			seg_list = list(jieba.cut(formatted_sentence, cut_all=False, HMM=False))
			sentenceToEasy =  all(item in vocab for item in seg_list)
			if not sentenceToEasy:
				sentence_data[counter]={"raw_text": sentence[0], "pinyin": sentence[1],"english": sentence[2], "clean_text": formatted_sentence, "words": seg_list, "is_sentence": True}
			for word in seg_list:
					if word not in word_frequencies:
						word_frequencies[word] = 0
					word_frequencies[word] += 1
			counter += 1


		unique_occurrence_nums = set(word_frequencies.values())
		rank = 1
		for k in sorted(unique_occurrence_nums, key=lambda item: item, reverse=True):
			rank_dict[k] = rank
			rank += 1
		for key in sentence_data:
			sentence_data[key]["freq_score"] = sum([rank_dict[word_frequencies[w]] for w in sentence_data[key]["words"]]) / len(sentence_data[key]["words"])
		sorted_sentence_data = {k: v for k, v in sorted(sentence_data.items(), key=lambda item: item[1]["freq_score"])}
		

		new_word_key = counter
		sentence_order_counter = 1

		for s_key in sorted_sentence_data:
			words = sorted_sentence_data[s_key]["words"]
			old_words = [w for w in words if w in used_words]
			new_words = [w for w in words if w not in used_words and w not in vocab]
			if(len(new_words) > 0):
				lowest_frequency = min([word_frequencies[w] for w in new_words])
				word_to_teach  = [ w for w in new_words if word_frequencies[w] == lowest_frequency][0]
				for nw in new_words:
					if nw not in word_iterations:
						word_iterations[nw] = 0
					word_iterations[nw] += 1
					if nw != word_to_teach:
						one_word_sentences[new_word_key]={"raw_text": nw, "pinyin": None, "english": None, "clean_text": nw, "freq_score": None,  "is_sentence": False, "sentence_order": None, "word_to_teach": nw, "words": [nw], "display_text": "#", "iteration": 1}
						new_word_key += 1
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
			sorted_sentence_data[s_key]["sentence_order"] = sentence_order_counter

			used_words.update(new_words)
			sentence_order_counter += 1

		insert_phrases = []
		insert_words = []
		for k,v in word_frequencies.items():
			insert_words.append((k,v, k in vocab))

		insert_words_query = 'INSERT INTO cloze_chinese.words (word_text,word_occurrences, is_base_word) VALUES (%s, %s, %s)'

		cur.executemany(insert_words_query,insert_words)

		all_phrases = one_word_sentences | sorted_sentence_data

		for k,v in all_phrases.items():
			current_row = []
			current_row = (v["word_to_teach"],v["raw_text"], v["clean_text"], v["display_text"], v["pinyin"], v["english"],v["freq_score"],v["is_sentence"],v["sentence_order"],v["iteration"],v["words"])
			insert_phrases.append(current_row)

		insert_phrases_query = """
		WITH RECURSIVE 

		word_to_teach_row AS (

		SELECT word_id
		FROM cloze_chinese.words w
		WHERE w.word_text = %s

		),
		new_phrase_row AS (
		INSERT INTO cloze_chinese.phrases (raw_text, clean_text, display_text, pinyin, english,frequency_score,is_sentence, sentence_order, iteration) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING phrase_id
		),

		word_contained_rows AS (
		SELECT (SELECT phrase_id FROM new_phrase_row) as phrase_id, word_id, ordinality AS contains_order, word_id = (SELECT word_id FROM word_to_teach_row) AS teaches
		FROM cloze_chinese.words w INNER JOIN UNNEST(%s) WITH ORDINALITY as wl_text
		on w.word_text = wl_text
		)

		INSERT INTO cloze_chinese.phrase_contains_words(phrase_id, word_id, contains_order, teaches)
		SELECT phrase_id, word_id, contains_order, teaches
		FROM word_contained_rows

		"""
		#print(sorted_sentence_data)
		#print(insert_phrases)
		cur.executemany(insert_phrases_query,insert_phrases)


		con.commit()
		#rint("Record inserted successfully")
		con.close()




print_sentence()




