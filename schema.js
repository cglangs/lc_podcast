const { gql } = require('apollo-server-express')

module.exports =  gql`
  type Query {
  	me(userId: Int): User
  }
 
  type Mutation {
  	CreateUser(user_name: String! email: String! password: String! role: String! = "STUDENT"): User
  	UpgradeUser(userId: Int!, user_name: String! email: String! password: String!): User
  	Login(email: String! password: String!): User
  }
 
  type User {
  	user_id: Int!
  	user_name: String!
  	user_email: String!
  	user_password: String!
  	user_role: String!
  }

`
