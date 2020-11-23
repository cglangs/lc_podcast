const { gql } = require('apollo-server-express')

module.exports =  gql`
  directive @hasToken on FIELD_DEFINITION
  
  type Query {
  	me: User @hasToken
  	getNextSentence: Phrase @hasToken
  	getCurrentProgress: Progress @hasToken
  }
 
  type Mutation {
  	CreateUser(user_name: String! email: String! password: String! role: String! = "STUDENT"): User
    EditWord(word_id: Int!, english: String!, pinyin: String!): Int
  	UpgradeUser(user_name: String! email: String! password: String!): User
  	Login(email: String! password: String!): User
  	makeClozeAttempt(word_id: Int!, interval_id: Int!): Int @hasToken
  }
 
  type User {
  	user_id: Int!
  	user_name: String!
  	user_email: String!
  	user_password: String!
  	user_role: String!
  }

  type Phrase {
  	phrase_id: Int!
  	raw_text: String!
  	clean_text: String! 
  	display_text: String!
  	word_taught: Word!
  	time_fetched: String
  	pinyin: String
  	english: String
  }

  type Word {
  	word_id: Int!
    word_text: String!
	  english: String!
    pinyin: String
    interval_id: Int
  }

  type Progress {
    new_words_seen: Int!
  	words_learned: Int!
  	intervals_completed: Int!
  	total_word_count: Int!
}

`
