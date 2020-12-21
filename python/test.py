import psycopg2
import csv
import jieba
import regex
import pinyin
import sys
import hanzidentifier



jieba.set_dictionary("user_dict.txt")
con = psycopg2.connect(database="postgres", user="postgres", password="pass", host="127.0.0.1", port="5432")
print("Database opened successfully")
cur = con.cursor()
punc = "\"\\!?,,,,．！？｡。＂αβθ•ǎáāó()氵灬扌＃@+×＄％＆＇%&/:;°·℃（）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､、〃》「」『』【】〔〕〖〗〘〙〚〛《》〜〝〞〟〰〾〿–—‘’‛“”„‟…‧﹏.0123456789９０３２６a-zA-Z"
word_frequencies = {}
word_iterations = {}
word_ranks = {}
sentence_data={}
used_words = set()
one_word_sentences = {}
rank_dict ={}
#hsk_words_left = []
hsk_words_taught = set()
result_sentence_data = {}
#vocab = []
foundTargetWords = set()

def generateNextSentence(targetWords,vocab):
	for key in sentence_data:
		sentence_data[key]["unknown_words"] = [w for w in sentence_data[key]["words"] if w not in used_words and w not in vocab]
		sentence_data[key]["freq_score"] = max([1 if w in vocab or w in targetWords else 1 if w in used_words else rank_dict[word_frequencies[w]] for w in sentence_data[key]["words"]])

	relevantSentences = {key:value for (key,value) in sentence_data.items() if value["containsRemainingTargetWords"] == True}
	minSentence = min(relevantSentences.items(), key=lambda item: (len(item[1]["unknown_words"]), -item[1]["freq_score"]))
	#need recursive loop that  searches dependency tree for phrase that has only one unknown word


	del sentence_data[minSentence[0]]
	return minSentence[1]
	#sorted_sentence_data = {k: v for k, v in sorted(sentence_data.items(), key=lambda item: (item[1]["freq_score"], len(item[1]["wordsForLength"])))}
	#return sorted_sentence_data[0]

def generateSentenceData(rows, targetWords,hsk_words_left,vocab):
	counter = 1
	rowIndex = 0
	'''
	print("Rows before generate: ", len(rows))
	print("Vocab before generate: ", len(vocab))
	print("Used Words before generate: ", len(used_words))	
	print("HSK words left before generate: ", len(hsk_words_left))	
	print("Sentence data left before generate: ", len(sentence_data.values()))	
	'''

	for sentence in rows:
		formatted_sentence = regex.sub(r"[{}]+".format(punc), "", sentence[0].replace(" ", "").replace("-","").replace("[","").replace("]","").replace("─","").replace("\u3000",""))
		seg_list = list(jieba.cut(formatted_sentence, cut_all=False, HMM=False))
		sentenceTooEasy =  all(item in vocab or item in used_words for item in seg_list)
		sentenceRelevant = any(item in hsk_words_left for item in seg_list)
		if len(formatted_sentence) <= 10 and not sentenceTooEasy:
			sentence_data[counter]={"rowIndex": rowIndex, "containsRemainingTargetWords": sentenceRelevant, "raw_text": sentence[0], "pinyin": sentence[1],"english": sentence[2], "clean_text": formatted_sentence, "words": seg_list, "is_sentence": True}
			for word in seg_list:
				if word not in word_frequencies:
					word_frequencies[word] = 0
					if word in targetWords and word not in vocab:
						foundTargetWords.add(word)
				word_frequencies[word] += 1
			counter += 1
		else:
			del rows[rowIndex]
		rowIndex +=1
	unique_occurrence_nums = set(word_frequencies.values())
	rank = 1
	for k in sorted(unique_occurrence_nums, key=lambda item: item, reverse=True):
		rank_dict[k] = rank
		rank += 1
	return counter


def create_sentences():
	with open('known_words.csv') as knownwordsfile:
		readKnownWords = csv.reader(knownwordsfile, delimiter=',')
		vocabRows = list(readKnownWords)
		vocab = [elt for lst in vocabRows for elt in lst]
	

	#TODO: target words file
		with open('hsk4.csv') as tagetwordsfile:
			readhsk_4words = csv.reader(tagetwordsfile, delimiter=',')
			targetRows = list(readhsk_4words)
			targetRows.pop(0)
			targetWords = [row[0] for row in targetRows  if row[0]  not in vocab]
			hsk_words_left = targetWords.copy()

		#targetWords = [elt for lst in targetRows for elt in lst]

			with open('sentencemine.tsv') as csvfile:
				readCSV = csv.reader(csvfile, delimiter='\t')
				rows = list(readCSV)
				counter = generateSentenceData(rows, targetWords, hsk_words_left,vocab)
			#print(counter)
		#rows.pop(0)




		#traditional_words = []
		#for word in word_frequencies.keys():
		#	if not hanzidentifier.is_simplified(word):
		#		traditional_words.append(word)
	
		#sys.exit(traditional_words)






		

				new_word_key = counter
				sentence_order_counter = 1


				#print(len(foundTargetWords))
				while(len(hsk_words_taught) < len(foundTargetWords)):

					sentence_data.clear()
					word_frequencies.clear()
					rank_dict.clear()
					generateSentenceData(rows, targetWords,hsk_words_left,vocab)

					nextSentence = generateNextSentence(targetWords,vocab)
					del rows[nextSentence['rowIndex']]
					print(len(hsk_words_taught))
					print(len(foundTargetWords))
					print(nextSentence)

					result_sentence_data[sentence_order_counter] = nextSentence
					words = nextSentence["words"]
					old_words = [w for w in words if w in used_words]
					new_words = [w for w in words if w not in used_words and w not in vocab]
					#print(old_words)
					#print(new_words)
					if(len(new_words) > 0):
						hsk_new_words = [w for w in new_words if w in targetWords]
						if(len(hsk_new_words) > 0):
							lowest_frequency = min([word_frequencies[w] for w in hsk_new_words])
							word_to_teach  = [ w for w in hsk_new_words if word_frequencies[w] == lowest_frequency][0]
						else:
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
						hsk_words_left = [word for word in hsk_words_left if word not in hsk_new_words]
					else:
						fewest_iterations = min([word_iterations[w] for w in old_words])
						words_at_fewest_iterations = [ w for w in old_words if word_iterations[w] == fewest_iterations]
						highest_frequency= max([word_frequencies[w] for w in words_at_fewest_iterations])
						word_to_teach  = [ w for w in words_at_fewest_iterations if word_frequencies[w] == highest_frequency][0]
						word_iterations[word_to_teach] += 1
						iteration = fewest_iterations + 1
					result_sentence_data[sentence_order_counter]["word_to_teach"] = word_to_teach
					result_sentence_data[sentence_order_counter]["display_text"] = nextSentence["raw_text"].replace(word_to_teach, '#')
					result_sentence_data[sentence_order_counter]["iteration"] = iteration
					result_sentence_data[sentence_order_counter]["sentence_order"] = sentence_order_counter

					used_words.update(new_words)
					hsk_words_taught.update(hsk_new_words)
					#TODO update hsk_words_taught

					sentence_order_counter += 1

				#print(len(result_sentence_data))
				insert_phrases = []
				insert_words = []
				for w in used_words:
					insert_words.append((w, pinyin.get(w), w in vocab))

				insert_words_query = """
				INSERT INTO cloze_chinese.words (word_text, pinyin, is_base_word) VALUES (%s,%s,%s);
				"""

				cur.executemany(insert_words_query,insert_words)

				all_phrases = one_word_sentences | result_sentence_data

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

				phrase_teaches_row AS (
				INSERT INTO cloze_chinese.phrase_teaches_words(phrase_id, word_id) VALUES((SELECT phrase_id FROM new_phrase_row),(SELECT word_id FROM word_to_teach_row))
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


create_sentences()




