const { gql } = require('apollo-server-express')

module.exports =  gql`
  type Query {
  	me(userId: Int): User
  	getNextSentence(user_id: Int!): Phrase
  }
 
  type Mutation {
  	CreateUser(user_name: String! email: String! password: String! role: String! = "STUDENT"): User
  	UpgradeUser(user_name: String! email: String! password: String!): User
  	Login(email: String! password: String!): User
  	makeClozeAttempt(word_id: Int!, interval_id: Int!): Int
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
  }

  type Word {
  	word_id: Int!
    word_text: String!
	english: String!
    pinyin: String!
    interval_id: Int
  }

  type Progress {
  	words_learned: Int!
  	intervals_completed: Int!
  	total_word_count: Int!
}

`
