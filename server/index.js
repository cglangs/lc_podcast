const { neo4jgraphql, makeAugmentedSchema } = require("neo4j-graphql-js");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('./utils')
const { ApolloServer }  = require("apollo-server");
const neo4j = require('neo4j-driver')
                  // CASE STATEMENT HERE TO ORDER BY IF IT IS LINKED TO LATEST INTERVALS AND (c OR EXISTS((s)->[:TEACHES]-)
                  //ORDER BY i.interval_order, then exists(Sentence - teaches - word - contains - sentence - at interval{interval_order: })

async function signup(object, params, ctx, resolveInfo) {
  params.password = await bcrypt.hash(params.password, 10)
  const user = await neo4jgraphql(object, params, ctx, resolveInfo)
  const tokenString = jwt.sign({ userId: user._id }, APP_SECRET)
  user.token = tokenString
  return user
}

async function login(object, params, ctx, resolveInfo) {
  const password = params.password
  delete params.password
  const user = await neo4jgraphql(object, params, ctx, resolveInfo)
  if (!user) {
    throw new Error('No such user found')
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw new Error('Invalid password')
  }
  user.password = null

  user.token = jwt.sign({ userId: user._id }, APP_SECRET)

  return user
}

async function get_next_sentence(object, params, ctx, resolveInfo) {
  const sentence = await neo4jgraphql(object, params, ctx, resolveInfo)
  sentence.already_seen = sentence.current_users.map(user => user.user_name).includes(params.userName)
  sentence.current_users = null
  return sentence
}


const resolvers = {
  // entry point to GraphQL service
  Mutation: {
    CreateUser(object, params, ctx, resolveInfo) {
      return signup(object, params, ctx, resolveInfo)   
    },
    Login(object, params, ctx, resolveInfo) {
     return login(object, params, ctx, resolveInfo)   
    },
    IncrementInterval(object, params, ctx, resolveInfo){
      var return_val = 0
      if(params.should_call){
        return_val = neo4jgraphql(object, params, ctx, resolveInfo)
      }
      return return_val
    }
  },
  Query: {
     getNextSentence(object, params, ctx, resolveInfo){
      return get_next_sentence(object, params, ctx, resolveInfo)
    }
  }
}


const driver = neo4j.driver(
  'bolt://localhost:11003',
  neo4j.auth.basic('neo4j','password')
);

const typeDefs = `
type Mutation {

    AddSentenceDependencies(src_sentence: String! dest_words:[String] word_to_teach: String!): Sentence
    @cypher(
    statement:"""      MATCH (s:Sentence {raw_text: $src_sentence})-[:AT_INTERVAL]->(i:Interval), (w:Word)
                       WHERE w.text IN $dest_words
                       OPTIONAL MATCH (i)<-[:NEXT_TIME]-(iPrev)
                       WITH s,w,iPrev
                       OPTIONAL MATCH(:Interval{interval_order: COALESCE(iPrev.interval_order, 1)})<-[:AT_INTERVAL]-(ds:Sentence)-[:TEACHES]->(w)
                       MERGE (ds)<-[:DEPENDS_ON]-(s)-[:CONTAINS {contains_order: apoc.coll.indexOf($dest_words, w.text) + 1}]->(w)
                       RETURN s """
    )

    CreateUser(user_name: String! email: String! password: String! role: Role! = STUDENT): User

    IncrementInterval(should_call: Boolean!): Int
    @cypher(
    statement:""" MATCH (i2:Interval)<-[:NEXT_TIME]-(:Interval)<-[r:AUTHORING_INTERVAL]-(:Author)
                  CALL apoc.refactor.to(r, i2) YIELD input
                  RETURN 1"""
    )

    Login(email: String! password: String!): User
    @cypher(
    statement:""" MATCH(u:User)
                  WHERE u.email = $email
                  RETURN u"""
    )
    makeClozeAttempt(userName: String!, sentenceId: Int!, isCorrect: Boolean!, alreadySeen: Boolean!, nextIntervalSentenceId: Int): Int
    @cypher(
    statement:""" MATCH(u:User {user_name: userName}),(s:Sentence)-[:TEACHES]->(w:Word)
                  WHERE ID(s) = sentenceId
                  OPTIONAL MATCH (s2:Sentence)
                  WHERE ID(s2) = nextIntervalSentenceId
                  MERGE (u)-[r:LEARNING]->(s)
                  SET r.last_seen = time()
                  WITH u,s,s2,w,r,isCorrect,alreadySeen,nextIntervalSentenceId
                  CALL apoc.do.case(
                  [
                  NOT alreadySeen AND NOT isCorrect, 'DELETE r',
                  isCorrect AND nextIntervalSentenceId IS NOT NULL,'CALL apoc.refactor.to(r, s2) YIELD input RETURN 1 ',
                  isCorrect AND nextIntervalSentenceId IS NULL,'CREATE (u)-[:LEARNED]->(w) DELETE r'
                  ],'',{r:r,s2:s2, u:u, w:w}) YIELD value
                  RETURN 1
                    """
    )
}

type Query {
    getNextSentence(userName: String): Sentence
    @cypher(
    statement:""" 
                  MATCH (u:User{user_name: userName})
                  WITH u
                  MATCH (i:Interval)<-[:AT_INTERVAL]-(s:Sentence)-[:TEACHES]->(w:Word)
                  OPTIONAL MATCH (s)-[:CONTAINS]->(wd:Word)
                  OPTIONAL MATCH (u)-[is_learned:LEARNED]->(wd)
                  OPTIONAL MATCH (wd)<-[:TEACHES]-(ds:Sentence)-[:AT_INTERVAL]->(di:Interval),(u)-[:LEARNING]->(ds)
                  WITH u,w,i,s,
                  collect({word_text: wd.text, current_interval:COALESCE(di.interval_order, CASE WHEN EXISTS((u)-[:LEARNED]->(wd)) THEN 6 ELSE 0 END)}) AS word_dependencies
                  WHERE 
                  NOT EXISTS((u)-[:LEARNED]->(w)) AND 
                  ((EXISTS((u)-[:LEARNING]->(s)) OR (NOT EXISTS((u)-[:LEARNING]->(:Sentence)-[:TEACHES]->(w:Word)) AND i.interval_order = 1)))
                  AND ALL(wd IN word_dependencies WHERE wd.word_text IS NULL OR wd.current_interval >= i.interval_order)
                  CALL {
                  WITH u,s
                  MATCH path = shortestPath((u)-[:LEARNING|DEPENDS_ON*]->(s))
                  WITH last(nodes(path)) AS destSentence, nodes(path)[1] AS sourceSentence, length(path) AS hops
                  MATCH (u)-[rSource:LEARNING]->(sourceSentence)
                  OPTIONAL MATCH (u)-[rDest:LEARNING]->(destSentence)
                  RETURN destSentence AS selection, 
                  CASE WHEN EXISTS((u)-[:LEARNING]->(destSentence)) THEN rDest.last_seen ELSE rSource.last_seen END AS last_seen,
                  hops AS ordering
                  UNION
                  WITH u,s
                  MATCH(s)
                  WHERE NOT EXISTS((u)-[:LEARNING]->(s))
                  RETURN s AS selection, 100 AS ordering, NULL AS last_seen
                  }
                  RETURN selection ORDER BY last_seen ASC, ordering ASC LIMIT 1
                  """
    )

    getSentenceList(levelNumber: Int! intervalOrder: Int!): [Sentence]
    @cypher(
    statement:""" 
              MATCH (l:Level {level_number: levelNumber})<-[:SHOWN_IN]-(s:Sentence)-[:AT_INTERVAL]->(i:Interval {interval_order: intervalOrder})
              RETURN s
              """
              )

    getIntervalsAndLevels(userName: String): levelIntervalLists
    @cypher(
    statement:""" 
              MATCH(l:Level),(i:Interval)
              WITH l, i
              ORDER BY l.level_number,i.interval_order
              RETURN {levels: COLLECT(DISTINCT l.level_number),intervals: COLLECT( DISTINCT i.interval_order)}
              """
              )
}


enum Role {
  ADMIN
  STUDENT
}

type clozeQuestion { 
  next_sentence: Sentence
}

type levelIntervalLists{
  levels: [Int]
  intervals: [Int]
}

type Author {
  level: Level @relation(name: "AUTHORING_LEVEL", direction: OUT)
  interval: Interval @relation(name: "AUTHORING_INTERVAL", direction: OUT)
}

type Level {
  level_number: Int
  points: Int
  sentences: [Sentence] @relation(name: "SHOWN_IN", direction: IN)
  teachable_words: [Word] @cypher(
        statement: """MATCH (this)<-[:INTRODUCED_IN]-(w:Word),(a:Author)-[:AUTHORING_INTERVAL]->(i:Interval)
                      OPTIONAL MATCH (w)<-[:TEACHES]-(s:Sentence)-[:AT_INTERVAL]->(i)
                      WITH w,s
                      WHERE s is NULL
                      RETURN w AS word
                      """)
  addable_words: [Word] @cypher(
        statement: """MATCH (this)<-[:SHOWN_IN]-(s:Sentence)-[:TEACHES | CONTAINS]->(w:Word)
                      RETURN DISTINCT w AS word
                      """)

}
type Word {
  word_id: Int
  text: String
  alt_text: String
  english: String
  level: Level @relation(name: "INTRODUCED_IN", direction: OUT)
  characters: [Word] @cypher(
        statement: """MATCH (this)-[r:COMPOSED_OF]->(w:Word)
                      RETURN w ORDER BY r.word_order
                      """)
}
type User {
  _id: Int!
	user_name: String
  email: String!
  password: String
  token: String
  role: Role!
}
type Interval {
  interval_order: Int
  seconds: Int
  min_length: Int
  max_length: Int
  sentences: [Sentence] @relation(name: "AT_INTERVAL", direction: IN)
}
type Sentence {
  _id: Int!
	raw_text: String!
  display_text: String!
  alt_raw_text: String!
  alt_display_text: String!
  pinyin: String!
  english: String!
  already_seen: Boolean
  current_users: [User] @relation(name: "LEARNING", direction: IN)
  level: Level @relation(name: "SHOWN_IN" direction: OUT)
  interval: Interval @relation(name: "AT_INTERVAL" direction: OUT)
	words_contained: [ContainedWord!]!
	word_taught: Word! @relation(name: "TEACHES", direction: OUT)
  next_interval_sentence_id: Int @cypher(
        statement: """MATCH(this)-[:TEACHES]->(w:Word)
                      WITH this, w
                      MATCH (w)<-[:TEACHES]-(s2:Sentence)-[:AT_INTERVAL]->(i2:Interval)<-[:NEXT_TIME]-(i:Interval)<-[:AT_INTERVAL]-(this)
                      RETURN ID(s2)
                      """)
}

type ContainedWord @relation(name:"CONTAINS") {
  from: Sentence
  to: Word
  contains_order: Int!
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