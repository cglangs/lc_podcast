WITH all_seen_phrases AS (
--Get all phrases that have been seen that are ready 
    SELECT p.*, 
    w.word_id AS "${types.word_taught}${fields.word_id}",
    w.word_text AS "${types.word_taught}${fields.word_text}",
    w.english AS "${types.word_taught}${fields.english}",
    w.pinyin AS "${types.word_taught}${fields.pinyin}",
    COALESCE(up.interval_id,1) AS "${types.word_taught}${fields.interval_id}",
    TO_CHAR(NOW(), 'yyyy-mm-dd hh-mm-ss.ms') AS time_fetched,
    1 AS rank
    FROM cloze_chinese.phrases p
    INNER JOIN cloze_chinese.phrase_teaches_words ptw
    ON p.phrase_id = ptw.phrase_id
    INNER JOIN cloze_chinese.words w
    ON ptw.word_id = w.word_id
    INNER JOIN cloze_chinese.user_progress up
    ON w.word_id = up.word_id
    INNER JOIN cloze_chinese.intervals i
    ON up.interval_id = i.interval_id
    where EXTRACT(EPOCH FROM (NOW() - up.last_seen)) > i.seconds
    ORDER BY EXTRACT(EPOCH FROM (NOW() - up.last_seen)) DESC
    LIMIT 1
)

WITH unseen_full_phrases AS (
    SELECT p.*, 
    w.word_id AS "${types.word_taught}${fields.word_id}",
    w.word_text AS "${types.word_taught}${fields.word_text}",
    w.english AS "${types.word_taught}${fields.english}",
    w.pinyin AS "${types.word_taught}${fields.pinyin}",
    COALESCE(up.interval_id,1) AS "${types.word_taught}${fields.interval_id}",
    2 AS rank
    FROM cloze_chinese.phrases p
    INNER JOIN cloze_chinese.phrase_teaches_words ptw
    ON p.phrase_id = ptw.phrase_id
    INNER JOIN cloze_chinese.words w
    ON ptw.word_id = w.word_id
    LEFT JOIN cloze_chinese.user_progress up_teaches
    ON ptw.word_id = up.word_id
    WHERE up_teaches.word_id IS NULL
    AND p.is_sentence = TRUE
    AND NOT EXISTS
    (
        SELECT  1
        FROM 
        cloze_chinese.phrase_contains_words pcw
        LEFT JOIN cloze_chinese.user_progress up
        WHERE pcw.phrase_id = p.phrase_id
        AND up.word_id IS NULL
    )
    ORDER BY p.sentence_order ASC
    LIMIT 1
)


WITH unseen_word_phrases AS (
    SELECT p.*, 
    w.word_id AS "${types.word_taught}${fields.word_id}",
    w.word_text AS "${types.word_taught}${fields.word_text}",
    w.english AS "${types.word_taught}${fields.english}",
    w.pinyin AS "${types.word_taught}${fields.pinyin}",
    COALESCE(up.interval_id,1) AS "${types.word_taught}${fields.interval_id}",
    3 AS rank
    FROM cloze_chinese.phrases p
    INNER JOIN cloze_chinese.phrase_teaches_words ptw
    ON p.phrase_id = ptw.phrase_id
    INNER JOIN cloze_chinese.words w
    ON ptw.word_id = w.word_id

    LEFT JOIN cloze_chinese.user_progress up_teaches
    ON ptw.word_id = up.word_id
    WHERE up_teaches.word_id IS NULL
    AND p.is_sentence = FALSE
    ORDER BY p.sentence_order ASC, w.word_occurences DESC
    LIMIT 1
)