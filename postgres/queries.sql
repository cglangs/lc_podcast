select word_id, word_text,word_occurrences from words 
where is_base_word = false
order by word_occurrences desc


select p.raw_text from phrases p
inner join phrase_contains_words pcw 
on p.phrase_id = pcw.phrase_id 
where pcw.word_id = 21439


SELECT raw_text FROM phrases p
WHERE p.is_sentence = TRUE
ORDER BY p.sentence_order ASC