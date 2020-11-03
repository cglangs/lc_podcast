CREATE TABLE cloze_chinese.users (
	user_id int4 NOT NULL DEFAULT nextval('cloze_chinese.users_userid_seq'::regclass),
	username varchar(255) NULL,
	email varchar(255) NULL,
	userpassword varchar(255) NULL,
	userrole cloze_chinese.roletype NULL,
	CONSTRAINT users_pkey PRIMARY KEY (user_id)
);

CREATE TABLE cloze_chinese.words (
	word_id serial NOT NULL DEFAULT nextval('cloze_chinese.words_word_id_seq'::regclass),
	word_text varchar(255) NULL,
	word_frequency_order int4 NULL,
	word_insert_order int4 NULL,
	CONSTRAINT words_pkey PRIMARY KEY (word_id),
	CONSTRAINT words_word_frequency_order_key UNIQUE (word_frequency_order),
	CONSTRAINT words_word_insert_order_key UNIQUE (word_insert_order)
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
	iteration int4 NOT NULL,
	CONSTRAINT phrases_pkey PRIMARY KEY (phrase_id)
);

CREATE TABLE cloze_chinese.phrase_contains_words (
	phrase_id int4 NOT NULL,
	word_id int4 NOT NULL,
	contains_order int4 NOT NULL,
	CONSTRAINT phrase_contains_words_pkey PRIMARY KEY (phrase_id, word_id),
	CONSTRAINT phrase_contains_fk FOREIGN KEY (phrase_id) REFERENCES cloze_chinese.phrases(phrase_id),
	CONSTRAINT word_contained_fk FOREIGN KEY (word_id) REFERENCES cloze_chinese.words(word_id)
);

CREATE TABLE cloze_chinese.phrase_teaches_words (
	phrase_id int4 NOT NULL,
	word_id int4 NOT NULL,
	CONSTRAINT phrase_teaches_words_pkey PRIMARY KEY (phrase_id, word_id),
	CONSTRAINT phrase_teaches_fk FOREIGN KEY (phrase_id) REFERENCES cloze_chinese.phrases(phrase_id),
	CONSTRAINT word_taught_fk FOREIGN KEY (word_id) REFERENCES cloze_chinese.words(word_id)
);

CREATE TABLE cloze_chinese.user_progress (
	user_id int4 NOT NULL,
	word_id int4 NOT NULL,
	interval_id int4 NOT NULL,
	CONSTRAINT up_pkey PRIMARY KEY (user_id, word_id),
	CONSTRAINT up_interval_fk FOREIGN KEY (interval_id) REFERENCES cloze_chinese.intervals(interval_id),
	CONSTRAINT up_user_fk FOREIGN KEY (user_id) REFERENCES cloze_chinese.users(user_id),
	CONSTRAINT up_word_fk FOREIGN KEY (word_id) REFERENCES cloze_chinese.words(word_id)
);