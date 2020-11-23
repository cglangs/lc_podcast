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

UPDATE cloze_chinese.words SET english = t.english FROM cloze_chinese.translations t
WHERE word_text = t.hanzi;


  SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'cloze_chinese'
ORDER BY
    tablename,
    indexname


    DROP INDEX pcw_word_idx;
    DROP INDEX pcw_phrase_idx;
    DROP INDEX sentence_order_idx;
    DROP INDEX w_word_idx;
    DROP INDEX p_phrase_idx;
    DROP INDEX ptw_word_idx;
    DROP INDEX ptw_phrase_idx;
    DROP INDEX p_is_sentence_idx;

    DROP INDEX word_occ_idx;
    DROP INDEX p_iteration_idx;


    CREATE INDEX pcw_word_idx ON phrase_contains_words (word_id);
    CREATE INDEX pcw_phrase_idx ON phrase_contains_words (phrase_id);
    CREATE INDEX p_is_sentence_idx ON phrases(is_sentence);
    CREATE INDEX w_word_idx ON words (word_id);
    CREATE INDEX p_phrase_idx ON phrases (phrase_id);
    CREATE INDEX ptw_word_idx ON phrase_teaches_words (word_id);
    CREATE INDEX ptw_phrase_idx ON phrase_teaches_words (phrase_id);
    CREATE INDEX sentence_order_idx ON phrases (sentence_order);


    CREATE INDEX word_occ_idx on words (word_occurrences);
    CREATE INDEX p_iteration_idx ON phrases (iteration);

    





delete from user_progress;
delete from phrase_contains_words;
delete from phrase_teaches_words;
delete from phrases;
delete from words;






