import psycopg2
import csv
import jieba
import regex
import pinyin
import os
import constants
from dotenv import load_dotenv
strings = constants.get_constants()

load_dotenv()
con = psycopg2.connect(
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASS"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("PORT"),
)
print("Database opened successfully")
cur = con.cursor()

jieba.set_dictionary("user_dict.txt")
punc = strings["chars_to_ignore"]

word_frequencies = {}
word_iterations = {}
rank_dict = {}
sentence_data = {}
one_word_sentences = {}
result_sentence_data = {}

used_words = set()
hsk_words_taught = set()
found_target_words = set()

def generate_next_sentence(target_words, vocab, words_left):
    for key in sentence_data:
        sentence_data[key]["unknown_words"] = [
            w
            for w in sentence_data[key]["words"]
            if w not in used_words and w not in vocab
        ]
        sentence_data[key]["contains_remaining_target_words"] = any(
            item in words_left for item in sentence_data[key]["unknown_words"]
        )
        sentence_data[key]["freq_score"] = max(
            [
                1
                if w in vocab or w in target_words
                else 1
                if w in used_words
                else rank_dict[word_frequencies[w]]
                for w in sentence_data[key]["words"]
            ]
        )

    relevant_sentences = {
        key: value
        for (key, value) in sentence_data.items()
        if value["contains_remaining_target_words"] == True
    }

    min_sentence = min(
        relevant_sentences.items(),
        key=lambda item: (len(item[1]["unknown_words"]), -item[1]["freq_score"]),
    )

    unknown_not_target_words = [
        w for w in min_sentence[1]["unknown_words"] if w not in words_left
    ]
    if len(unknown_not_target_words):
        return generate_next_sentence(
            target_words, vocab, words_left + unknown_not_target_words
        )
    else:
        del sentence_data[min_sentence[0]]
        return min_sentence[1]


def generate_sentence_data(rows, target_words, hsk_words_left, vocab):
    counter = 1
    row_index = 0

    for sentence in rows:
        formatted_sentence = regex.sub(
            r"[{}]+".format(punc),
            "",
            sentence[0]
            .replace(" ", "")
            .replace("-", "")
            .replace("[", "")
            .replace("]", "")
            .replace("─", "")
            .replace("\u3000", ""),
        )
        seg_list = list(jieba.cut(formatted_sentence, cut_all=False, HMM=False))
        sentence_too_easy = all(item in vocab or item in used_words for item in seg_list)
        if len(formatted_sentence) <= 12 and not sentence_too_easy:
            sentence_data[counter] = {
                "row_index": row_index,
                "raw_text": sentence[0],
                "pinyin": sentence[1],
                "english": sentence[2],
                "clean_text": formatted_sentence,
                "words": seg_list,
                "is_sentence": True,
            }
            for word in seg_list:
                if word not in word_frequencies:
                    word_frequencies[word] = 0
                    if word in target_words and word not in vocab:
                        found_target_words.add(word)
                word_frequencies[word] += 1
            counter += 1
        else:
            del rows[row_index]
        row_index += 1
    unique_occurrence_nums = set(word_frequencies.values())
    rank = 1
    for k in sorted(unique_occurrence_nums, key=lambda item: item, reverse=True):
        rank_dict[k] = rank
        rank += 1
    return counter


def create_sentences():
    with open(strings["base_words_file"]) as known_words_file:
        read_known_words = csv.reader(known_words_file, delimiter=",")
        vocab_rows = list(read_known_words)
        vocab = [elt for lst in vocab_rows for elt in lst]

        with open(strings["target_words_file"]) as tagetwordsfile:
            readhsk_4words = csv.reader(tagetwordsfile, delimiter=",")
            target_rows = list(readhsk_4words)
            target_rows.pop(0)
            target_words = [row[0] for row in target_rows if row[0] not in vocab]
            hsk_words_left = target_words.copy()

            with open(strings["source_text_file"]) as csvfile:
                read_csv = csv.reader(csvfile, delimiter="\t")
                rows = list(read_csv)
                new_word_key = generate_sentence_data(
                    rows, target_words, hsk_words_left, vocab
                )
                sentence_order_counter = 1

                while len(hsk_words_taught) < len(found_target_words):
                    sentence_data.clear()
                    word_frequencies.clear()
                    rank_dict.clear()
                    generate_sentence_data(rows, target_words, hsk_words_left, vocab)
                    next_sentence = generate_next_sentence(
                        target_words, vocab, hsk_words_left
                    )
                    del rows[next_sentence["row_index"]]
                    result_sentence_data[sentence_order_counter] = next_sentence
                    words = next_sentence["words"]
                    old_words = [w for w in words if w in used_words]
                    new_words = [
                        w for w in words if w not in used_words and w not in vocab
                    ]
                    if len(new_words) > 0:
                        hsk_new_words = [w for w in new_words if w in target_words]
                        if len(hsk_new_words) > 0:
                            lowest_frequency = min(
                                [word_frequencies[w] for w in hsk_new_words]
                            )
                            word_to_teach = [
                                w
                                for w in hsk_new_words
                                if word_frequencies[w] == lowest_frequency
                            ][0]
                        else:
                            lowest_frequency = min(
                                [word_frequencies[w] for w in new_words]
                            )
                            word_to_teach = [
                                w
                                for w in new_words
                                if word_frequencies[w] == lowest_frequency
                            ][0]
                        for nw in new_words:
                            if nw not in word_iterations:
                                word_iterations[nw] = 0
                            word_iterations[nw] += 1
                            if nw != word_to_teach:
                                one_word_sentences[new_word_key] = {
                                    "raw_text": nw,
                                    "pinyin": None,
                                    "english": None,
                                    "clean_text": nw,
                                    "freq_score": None,
                                    "is_sentence": False,
                                    "sentence_order": None,
                                    "word_to_teach": nw,
                                    "words": [nw],
                                    "display_text": "#",
                                    "iteration": 1,
                                }
                                new_word_key += 1
                        iteration = 1
                        hsk_words_left = [
                            word for word in hsk_words_left if word not in hsk_new_words
                        ]
                    else:
                        fewest_iterations = min([word_iterations[w] for w in old_words])
                        words_at_fewest_iterations = [
                            w
                            for w in old_words
                            if word_iterations[w] == fewest_iterations
                        ]
                        highest_frequency = max(
                            [word_frequencies[w] for w in words_at_fewest_iterations]
                        )
                        word_to_teach = [
                            w
                            for w in words_at_fewest_iterations
                            if word_frequencies[w] == highest_frequency
                        ][0]
                        word_iterations[word_to_teach] += 1
                        iteration = fewest_iterations + 1
                    result_sentence_data[sentence_order_counter][
                        "word_to_teach"
                    ] = word_to_teach
                    result_sentence_data[sentence_order_counter][
                        "display_text"
                    ] = next_sentence["raw_text"].replace(word_to_teach, "#")
                    result_sentence_data[sentence_order_counter][
                        "iteration"
                    ] = iteration
                    result_sentence_data[sentence_order_counter][
                        "sentence_order"
                    ] = sentence_order_counter

                    used_words.update(new_words)
                    hsk_words_taught.update(hsk_new_words)
                    sentence_order_counter += 1

                insert_phrases = []
                insert_words = []
                for w in used_words:
                    insert_words.append((w, pinyin.get(w), w in vocab))

                insert_words_query = """
				INSERT INTO cloze_chinese.words (word_text, pinyin, is_base_word) VALUES (%s,%s,%s);
				"""

                cur.executemany(insert_words_query, insert_words)

                all_phrases = one_word_sentences | result_sentence_data

                for k, v in all_phrases.items():
                    current_row = []
                    current_row = (
                        v["word_to_teach"],
                        v["raw_text"],
                        v["clean_text"],
                        v["display_text"],
                        v["pinyin"],
                        v["english"],
                        v["freq_score"],
                        v["is_sentence"],
                        v["sentence_order"],
                        v["iteration"],
                        v["words"],
                    )
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
                cur.executemany(insert_phrases_query, insert_phrases)

                con.commit()
                con.close()


create_sentences()
