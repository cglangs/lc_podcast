const { neo4jgraphql, makeAugmentedSchema } = require("neo4j-graphql-js");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('./utils')
const { ApolloServer }  = require("apollo-server");
const neo4j = require('neo4j-driver')


async function stuff(object, params, ctx, resolveInfo) {
  params.password = await bcrypt.hash(params.password, 10)
  const user = await neo4jgraphql(object, params, ctx, resolveInfo)
  //const tokenString = jwt.sign({ userId: user.id }, APP_SECRET)
  return user


}

const resolvers = {
  // entry point to GraphQL service
  Mutation: {
    CreateUser(object, params, ctx, resolveInfo) {
      authpayload = stuff(object, params, ctx, resolveInfo)
      return authpayload
    }
  }
}



const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j','password')
);

const typeDefs = `
type Mutation {
    AddSentenceDependencies(src_sentence: String! dest_words:[String]): Sentence
    @cypher(
    statement:"""MATCH (s:Sentence {text: $src_sentence}), (w:Word)
                       WHERE w.text IN $dest_words
                       MERGE (s)-[:CONTAINS]->(w) 
                       RETURN s """)
    CreateUser(user_name: String!, password: String!): User
}

type AuthPayload {
  user: User
}

type Episode {
  episode_number: Int
  teachable_words: [Word] @relation(name: "INTRODUCED_IN", direction: IN)
  addable_words: [Word] @cypher(
        statement: """MATCH (this)<-[:SHOWN_IN]-(:Setence)-[:TEACHES]->(w:Word)
                      MATCH(w)<-[:CONTAINS]-(s:Sentence)
                      WITH w, COUNT(s) AS usage
                      RETURN w ORDER BY usage ASC """)
}
type Word {
  text: String
}
type User {
  _id: Int
	user_name: String!
  password: String!
}
type TimeInterval {
  interval_order: Int
  seconds: Int
  sentences: [Sentence] @relation(name: "LEVEL", direction: IN)
}
type Sentence {
	raw_text: String!
  display_text: String!
  episode: Episode @relation(name: "SHOWN_IN" direction: OUT)
  time_interval: TimeInterval @relation(name: "LEVEL" direction: OUT)
	words_contained: [Word!]! @relation(name: "CONTAINS", direction: OUT)
	word_taught: Word! @relation(name: "TEACHES", direction: OUT)
}
`

const schema = makeAugmentedSchema({
  typeDefs,
  resolvers
});

const server = new ApolloServer({
  schema: schema,
  context: { driver },
  resolvers
});

server.listen(3003, '0.0.0.0').then(({ url }) => {
  console.log(`GraphQL API ready at ${url}`);
});