const { neo4jgraphql, makeAugmentedSchema } = require("neo4j-graphql-js");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('./utils')
const { ApolloServer }  = require("apollo-server");
const neo4j = require('neo4j-driver')


async function signup(object, params, ctx, resolveInfo) {
  params.password = await bcrypt.hash(params.password, 10)
  const user = await neo4jgraphql(object, params, ctx, resolveInfo)
  const tokenString = jwt.sign({ userId: user.id }, APP_SECRET)
  user.token = tokenString
  return user
}

async function login(object, params, ctx, resolveInfo) {
  const password = params.password
  delete params.password
  const user = await neo4jgraphql(object, params, ctx, resolveInfo)
  console.log(user)
  if (!user) {
    throw new Error('No such user found')
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw new Error('Invalid password')
  }
  user.password = null

  user.token = jwt.sign({ userId: user.id }, APP_SECRET)

  return user
}


const resolvers = {
  // entry point to GraphQL service
  Mutation: {
    CreateUser(object, params, ctx, resolveInfo) {
      return signup(object, params, ctx, resolveInfo)   
    },
    Login(object, params, ctx, resolveInfo) {
      return login(object, params, ctx, resolveInfo)   

    }
  }
}



const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j','password')
);

const typeDefs = `
type Mutation {

    AddSentenceDependencies(src_sentence: String! dest_words:[String] word_to_teach: String!): Sentence
    @cypher(
    statement:"""MATCH (s:Sentence {raw_text: $src_sentence}), (w:Word:StudyWord),(a:Author)-[:AUTHORING_INTERVAL]->(i:TimeInterval)
                       WHERE w.text IN $dest_words AND NOT w.text = $word_to_teach
                       MERGE (i)<-[:AT_INTERVAL]-(s)-[:CONTAINS]->(w) 
                       RETURN s """)

    CreateUser(user_name: String! email: String! password: String! role: Role! = STUDENT): User

    IncrementInterval(should_call: Boolean!): Int
    @cypher(
    statement:""" CALL apoc.do.when(true,
                  "MATCH (i2:TimeInterval)<-[:NEXT_TIME]-(:TimeInterval)<-[r:AUTHORING_INTERVAL]-(:Author)
                  CALL apoc.refactor.to(r, i2) YIELD input, output RETURN *") YIELD value
                  RETURN *""")

    Login(email: String! password: String!): User
    @cypher(
    statement:""" MATCH(u:User)
                  WHERE u.email = $email
                  RETURN u"""
    )
}


enum Role {
  ADMIN
  STUDENT
}

type Author {
  level: Level @relation(name: "AUTHORING_LEVEL", direction: OUT)
  interval: TimeInterval @relation(name: "AUTHORING_INTERVAL", direction: OUT)
}

type Level {
  level_number: Int
  points: Int
  teachable_words: [Word] @cypher(
        statement: """MATCH (this)<-[:INTRODUCED_IN]-(w:Word:StudyWord),(a:Author)-[:AUTHORING_INTERVAL]->(i:TimeInterval)
                      OPTIONAL MATCH (w)<-[:TEACHES]-(s:Sentence)-[:AT_INTERVAL]->(i)
                      WITH w,s
                      WHERE s is NULL
                      RETURN w """)
  addable_words: [Word] @cypher(
        statement: """MATCH (this)<-[:SHOWN_IN]-(s:Sentence)-[:TEACHES | CONTAINS]->(w:Word)
                      WITH w, COUNT(s) AS usage
                      RETURN w AS word ORDER BY usage ASC 
                      """)

}
type Word {
  word_id: Int
  text: String
  level: Level @relation(name: "INTRODUCED_IN", direction: OUT)
}
type User {
  _id: Int!
	user_name: String
  email: String!
  password: String
  token: String
  role: Role!
}
type TimeInterval {
  interval_order: Int
  seconds: Int
  min_length: Int
  max_length: Int
  sentences: [Sentence] @relation(name: "AT_INTERVAL", direction: IN)
}
type Sentence {
	raw_text: String!
  display_text: String!
  level: Level @relation(name: "SHOWN_IN" direction: OUT)
  time_interval: TimeInterval @relation(name: "AT_INTERVAL" direction: OUT)
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