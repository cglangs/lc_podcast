CREATE TABLE cloze_chinese.users (
	user_id int4 NOT NULL DEFAULT nextval('cloze_chinese.users_userid_seq'::regclass),
	user_name varchar(255) NULL,
	user_email varchar(255) NULL,
	user_password varchar(255) NULL,
	user_role cloze_chinese.roletype NULL,
	CONSTRAINT users_pkey PRIMARY KEY (user_id)
);
CREATE UNIQUE INDEX user_email_unique ON cloze_chinese.users USING btree (user_email) WHERE (user_role <> 'TESTER'::cloze_chinese.roletype);

CREATE TABLE cloze_chinese.words (
	word_id serial NOT NULL DEFAULT nextval('cloze_chinese.words_word_id_seq'::regclass),
	word_text varchar(255) NULL,
	word_occurrences int4 NULL,
	pinyin varchar(255) NULL,
	english varchar(255) NULL,
	is_base_word bool NULL,
	CONSTRAINT unique_word_text UNIQUE (word_text),
	CONSTRAINT words_pkey PRIMARY KEY (word_id)
);

CREATE TABLE cloze_chinese.intervals (
	interval_id int4 NOT NULL,
	seconds int4 NULL,
	CONSTRAINT intervals_pkey PRIMARY KEY (interval_id)
);

CREATE TABLE cloze_chinese.phrases (
	phrase_id serial NOT NULL DEFAULT nextval('cloze_chinese.phrases_phrase_id_seq'::regclass),
	raw_text varchar(255) NULL,
	clean_text varchar(255) NULL,
	display_text varchar(255) NULL,
	pinyin varchar(255) NULL,
	english varchar(255) NULL,
	frequency_score float4 NULL,
	is_sentence bool NULL,
	sentence_order int4 NULL,
	CONSTRAINT phrases_pkey PRIMARY KEY (phrase_id)
);


CREATE TABLE cloze_chinese.phrase_contains_words (
	phrase_id int4 NOT NULL,
	word_id int4 NOT NULL,
	contains_order int4 NOT NULL,
	teaches bool NULL,
	iteration int2 NULL,
	CONSTRAINT phrase_contains_words_pkey PRIMARY KEY (phrase_id, word_id, contains_order),
	CONSTRAINT phrase_contains_fk FOREIGN KEY (phrase_id) REFERENCES cloze_chinese.phrases(phrase_id),
	CONSTRAINT word_contained_fk FOREIGN KEY (word_id) REFERENCES cloze_chinese.words(word_id)
);


CREATE TABLE cloze_chinese.user_progress (
	user_id int4 NOT NULL,
	word_id int4 NOT NULL,
	interval_id int4 NOT NULL,
	last_seen timestamp NULL DEFAULT CURRENT_TIMESTAMP,
	is_learned bool NOT NULL DEFAULT false,
	CONSTRAINT up_pkey PRIMARY KEY (user_id, word_id),
	CONSTRAINT up_interval_fk FOREIGN KEY (interval_id) REFERENCES cloze_chinese.intervals(interval_id),
	CONSTRAINT up_user_fk FOREIGN KEY (user_id) REFERENCES cloze_chinese.users(user_id),
	CONSTRAINT up_word_fk FOREIGN KEY (word_id) REFERENCES cloze_chinese.words(word_id)
);

CREATE OR REPLACE FUNCTION cloze_chinese.update_lastseen_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   NEW.last_seen = now(); 
   RETURN NEW;
END;
$function$
;

create trigger update_up_lastseentimestamp before
update
    on
    cloze_chinese.user_progress for each row execute function cloze_chinese.update_lastseen_column();



CREATE OR REPLACE FUNCTION cloze_chinese.set_is_learned_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   IF NEW.interval_id = 11 then
   NEW.is_learned = TRUE;
   END IF;
   RETURN NEW;
END;
$function$
;

create trigger update_up_islearned before
update
    on
    cloze_chinese.user_progress for each row execute function cloze_chinese.set_is_learned_column();


