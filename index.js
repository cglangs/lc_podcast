const { neo4jgraphql, makeAugmentedSchema } = require("neo4j-graphql-js");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { ACCESS_SECRET, REFRESH_SECRET, getUserId } = require('./utils')
const { ApolloServer, gql, SchemaDirectiveVisitor } = require('apollo-server-express');
const neo4j = require('neo4j-driver')
const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser')


var dbURL = process.env.BOLT_URL || 'bolt://54.162.39.62:7687'
var dbUser = process.env.BOLT_USER || 'neo4j'
var dbPass = process.env.BOLT_PASSWORD || 'test'
var driver


driver = neo4j.driver(
  dbURL,
  neo4j.auth.basic(dbUser, dbPass)
)

async function signup(object, params, ctx, resolveInfo) {
  params.password = await bcrypt.hash(params.password, 10)
  try {
      const user = await neo4jgraphql(object, params, ctx, resolveInfo)
      if(user.role === 'TESTER'){
        // do nothing
      } else{
        ctx.req.res.cookie("refresh-token", jwt.sign({ userId: user._id, role: user.role }, REFRESH_SECRET), { maxAge: 24 * 60 * 60 * 1000})
      }
      ctx.req.res.cookie("access-token", jwt.sign({ userId: user._id, role: user.role }, ACCESS_SECRET), { maxAge: 15 * 60 * 1000 })
      return user
  }
  catch(error){
    throw new Error("Email address already in use")
  }

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

  ctx.req.res.cookie("refresh-token", jwt.sign({ userId: user._id, role: user.role }, REFRESH_SECRET), { maxAge: 7 * 60 * 60 * 1000 })
  ctx.req.res.cookie("access-token", jwt.sign({ userId: user._id, role: user.role }, ACCESS_SECRET), { maxAge: 15 * 60 * 1000 })
  return user
}

async function processSentence (object, params, ctx, resolveInfo){
  var sentence = await neo4jgraphql(object, params, ctx, resolveInfo)
  if(sentence){
      sentence.current_learners = sentence.current_learners.filter((learner)=> learner.User._id === params.userId)
  }

  return sentence
}

const resolvers = {
  // entry point to GraphQL service
  Mutation: {
    CreateUser(object, params, ctx, resolveInfo) {
      return signup(object, params, ctx, resolveInfo)   
    },
    CreatePermanentUser(object, params, ctx, resolveInfo) {
      return signup(object, params, ctx, resolveInfo)   
    },
    UpgradeUser(object, params, ctx, resolveInfo) {
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
        params.userId = ctx.req.userId
        const sentence =processSentence(object, params, ctx, resolveInfo)
        return sentence
    },
     getCurrentProgress(object, params, ctx, resolveInfo){
        params.userId = ctx.req.userId
        const progress = neo4jgraphql(object, params, ctx, resolveInfo)
        return progress
    },
    me(object, params, ctx, resolveInfo){
        params.userId = ctx.req.userId
        const user = neo4jgraphql(object, params, ctx, resolveInfo)
        return user
    },

  }
}
const directiveResolvers = {
  hasToken(next,src,args,ctx) {
      if (typeof ctx.req.userId === 'undefined' || ctx.req.userId === null) {
        return null
      } else{
        return next()
      }
  }
}

const typeDefs = `

directive @hasToken on FIELD_DEFINITION

type Mutation {
    AddSentenceDependencies(src_sentence: String! dest_words:[String]): Sentence
    @cypher(
    statement:"""      MATCH (s:Sentence {raw_text: $src_sentence})-[:AT_INTERVAL]->(i:Interval), (w:Word)
                       WHERE w.text IN $dest_words
                       OPTIONAL MATCH (i)<-[:NEXT_TIME]-(iPrev)
                       OPTIONAL MATCH (iNext:Interval)
                       WITH s,w,i,iPrev,iNext 
                       WHERE i.interval_order = 1 AND iNext.interval_order = 1 OR iNext.interval_order = i.interval_order + 1
                       OPTIONAL MATCH(:Interval{interval_order: COALESCE(iPrev.interval_order, 1)})<-[:AT_INTERVAL]-(ds:Sentence)-[:TEACHES]->(w)
                       OPTIONAL MATCH (iNext)<-[:AT_INTERVAL]-(ids)-[:CONTAINS]->(:Word)<-[:TEACHES]-(s)
                       WITH s, collect(w) AS w_list, collect(ds) AS ds_list, collect(ids) AS ids_list
                       FOREACH(w in w_list |
                          MERGE (s)-[:CONTAINS {contains_order: apoc.coll.indexOf($dest_words, w.text) + 1}]->(w)
                       )
                       FOREACH(ds in ds_list |
                          MERGE (ds)<-[:DEPENDS_ON]-(s)
                       )
                       FOREACH(ids in ids_list |
                          MERGE (ids)-[:DEPENDS_ON]->(s)  
                       )
                       RETURN s """
    )

    TransferUserProgress(src_sentence: String! dest_sentence: String!): Sentence
    @cypher(
    statement:"""       MATCH (src:Sentence {raw_text: src_sentence})<-[r:LEARNING]-(:User)
                        MATCH (dest:Sentence {raw_text: dest_sentence})
                        WITH dest,r
                        CALL apoc.refactor.to(r, dest) YIELD input
                        RETURN dest
                         """
    )    

    CreateUser(user_name: String! email: String! password: String! role: String! = "STUDENT"): User

    CreatePermanentUser(user_name: String! email: String! password: String! role: String! = "STUDENT"): User
        @cypher(
        statement: """
                CREATE(u:User:PermanentUser) 
                SET
                u.user_name = user_name, 
                u.role = role, 
                u.email = email, 
                u.password = password
                RETURN u
               """
      )

    UpgradeUser(userId: Int!, user_name: String! email: String! password: String!): User
    @cypher(
    statement:""" MATCH (u:User)
                  WHERE ID(u) = userId
                  SET u.user_name = user_name, u.email = email, u.password = password, u.role = 'STUDENT', u:PermanentUser
                  RETURN u"""
    )

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

    makeClozeAttempt(userId: Int!, sentenceId: Int!, isCorrect: Boolean!): Int
    @cypher(
    statement:""" MATCH(u:User),(s:Sentence)-[:TEACHES]->(w:Word)
                  WHERE ID(u) = userId AND ID(s) = sentenceId
                  OPTIONAL MATCH (w)<-[:TEACHES]-(s2:Sentence)-[:AT_INTERVAL]->(nextInterval:Interval)<-[:NEXT_TIME]-(:Interval)<-[:AT_INTERVAL]-(s)
                  MERGE (u)-[r:LEARNING]->(s)
                  SET r.last_seen = datetime()
                  WITH u,s,s2,w,r,isCorrect,COALESCE(nextInterval.interval_order,0) AS nextIntervalOrder
                  CALL apoc.do.case(
                  [
                  NOT EXISTS (r.CURRENT_TIME_INTERVAL) AND NOT isCorrect, 'DELETE r',
                  NOT EXISTS (r.CURRENT_TIME_INTERVAL) AND isCorrect, 'SET r.STEP_AT_INTERVAL = 2, r.CURRENT_TIME_INTERVAL = 1',
                  EXISTS (r.CURRENT_TIME_INTERVAL) AND isCorrect AND r.STEP_AT_INTERVAL < 3,'SET r.STEP_AT_INTERVAL = r.STEP_AT_INTERVAL + 1, r.CURRENT_TIME_INTERVAL = r.CURRENT_TIME_INTERVAL + 1',
                  EXISTS (r.CURRENT_TIME_INTERVAL) AND isCorrect AND nextIntervalOrder > 0 AND r.STEP_AT_INTERVAL = 3,'SET r.STEP_AT_INTERVAL = 1, r.CURRENT_TIME_INTERVAL = r.CURRENT_TIME_INTERVAL + 1 WITH r,s2 CALL apoc.refactor.to(r, s2) YIELD input RETURN 1',
                  EXISTS (r.CURRENT_TIME_INTERVAL) AND isCorrect AND nextIntervalOrder = 0 AND r.STEP_AT_INTERVAL = 3,'CREATE (u)-[:LEARNED]->(w) DELETE r'
                  ],'',{r:r, s2:s2, u:u, w:w, nextIntervalOrder:nextIntervalOrder}) YIELD value
                  RETURN 1
                    """
    )
}

type Query {
    getNextSentence(userId: Int!): Sentence @hasToken
    @cypher(
    statement:""" 
                  MATCH (u:User)
                  WHERE ID(u) = userId
                  WITH u
                  MATCH (i:Interval)<-[:AT_INTERVAL]-(s:Sentence)-[:TEACHES]->(w:Word)
                  OPTIONAL MATCH (u)-[r:LEARNING]->(s)
                  WITH w,s,i,u,r,
                  CASE WHEN  EXISTS((u)-[:LEARNING]->(s)) THEN r.CURRENT_TIME_INTERVAL ELSE 0 END AS cti
                  OPTIONAL MATCH (t:TimeInterval {time_interval_id: cti})
                  WITH w,s,i,u,
                  CASE WHEN  EXISTS((u)-[:LEARNING]->(s)) THEN duration.inSeconds(r.last_seen,datetime()).seconds >= COALESCE(t.seconds, 0) ELSE TRUE END AS is_ready
                  OPTIONAL MATCH (s)-[:CONTAINS]->(wd:Word)
                  OPTIONAL MATCH (wd)<-[:TEACHES]-(ds:Sentence)-[:AT_INTERVAL]->(di:Interval),(u)-[:LEARNING]->(ds)
                  WITH u,w,i,s,is_ready,
                  collect({word_text: wd.text, current_interval:COALESCE(di.interval_order, CASE WHEN EXISTS((u)-[:LEARNED]->(wd)) THEN 11 ELSE 0 END)}) AS word_dependencies
                  WHERE 
                  NOT EXISTS((u)-[:LEARNED]->(w)) AND
                  ALL(wd IN word_dependencies WHERE wd.word_text IS NULL OR wd.current_interval >= i.interval_order) AND
                  (
                    (NOT EXISTS((u)-[:LEARNING]->()-[:TEACHES]->(w)) AND i.interval_order = 1) OR 
                    EXISTS((u)-[:LEARNING]->(s))
                  )
                  CALL {
                  WITH u,s
                  MATCH path = shortestPath((u)-[:LEARNING|DEPENDS_ON*]->(s))
                  WITH last(nodes(path)) AS destSentence, nodes(path)[1] AS sourceSentence, length(path) AS hops
                  MATCH (u)-[rSource:LEARNING]->(sourceSentence)
                  OPTIONAL MATCH (u)-[rDest:LEARNING]->(destSentence)
                  RETURN destSentence AS selection, 
                  CASE WHEN EXISTS((u)-[:LEARNING]->(destSentence)) THEN rDest.last_seen ELSE NULL END AS last_seen_dest,
                  rSource.last_seen AS last_seen_source,
                  hops,
                  0 AS relevant_dependencies,
                  0 AS outgoing_dependencies,
                  0 AS incoming_dependencies
                  UNION
                  WITH u,s
                  MATCH (s)-[:AT_INTERVAL]->(:Interval {interval_order: 1})
                  OPTIONAL MATCH (s)-[:DEPENDS_ON]->(ods:Sentence)
                  OPTIONAL MATCH (s)<-[:DEPENDS_ON]-(ids:Sentence)
                  OPTIONAL MATCH (s)-[:DEPENDS_ON]->(rds:Sentence)<-[:LEARNING]-(u)
                  WITH u,s,rds,ods,ids
                  WHERE NOT EXISTS((u)-[:LEARNING]->(s))
                  RETURN s AS selection, NULL AS last_seen_dest, NULL AS last_seen_source, 0 AS hops, COUNT(DISTINCT rds) AS relevant_dependencies, COUNT(DISTINCT ods) AS outgoing_dependencies, COUNT(DISTINCT ids) AS incoming_dependencies
                  }
                  RETURN selection ORDER BY is_ready DESC, last_seen_dest ASC, last_seen_source ASC, hops DESC, relevant_dependencies DESC, outgoing_dependencies ASC, incoming_dependencies DESC, RAND() LIMIT 1
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

    getCurrentProgress(userId: Int!): Progress @hasToken
    @cypher(
    statement:""" 
              MATCH(u:User), (w:Word)-[:INTRODUCED_IN]->()
              WHERE ID(u) = userId
              WITH u, COUNT(w) AS total_words
              OPTIONAL MATCH(u)-[r:LEARNING]->(s:Sentence)
              WITH u,total_words, SUM(r.CURRENT_TIME_INTERVAL) AS current_intervals
              OPTIONAL MATCH(u)-[:LEARNED]->(wl:Word)
              WITH u,total_words,current_intervals, COUNT(DISTINCT wl) AS words_learned
              RETURN {words_learned: words_learned,  intervals_completed: (words_learned * 9) + current_intervals , total_word_count: total_words}
              """
              )

    me(userId: Int): User @hasToken
    @cypher(
    statement:""" MATCH(u:User)
                  WHERE ID(u) = userId
                  RETURN u"""
    )
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

type Progress {
  words_learned: Int!
  intervals_completed: Int!
  total_word_count: Int!
}

type Level {
  level_number: Int
  points: Int
  sentences: [Sentence] @relation(name: "SHOWN_IN", direction: IN)
  minimum_usage: Int  @cypher(
        statement: """MATCH (this)<-[:INTRODUCED_IN]-(w:Word)
                      OPTIONAL MATCH (:Sentence)-[r:CONTAINS]->(w)
                      WITH w, count(r) AS times_used
                      RETURN MIN(times_used) AS minimum_usage
                      """)
  all_words: [Word] @cypher(
        statement: """MATCH(l:Level {level_number: 1})-[:INTRODUCED_IN| COMPOSED_OF*1..2]-(w:Word)
                      RETURN DISTINCT w
                      """)
  teachable_words: [Word] @cypher(
        statement: """MATCH (this)<-[:INTRODUCED_IN]-(w:Word),(a:Author)-[:AUTHORING_INTERVAL]->(i:Interval)
                      OPTIONAL MATCH (w)<-[:TEACHES]-(s:Sentence)-[:AT_INTERVAL]->(i)
                      WITH w,s
                      WHERE s is NULL
                      RETURN w AS word
                      """)
  addable_words: [Word] @cypher(
        statement: """MATCH (this)<-[:SHOWN_IN]-(s:Sentence)-[:TEACHES | CONTAINS]->(w:Word)
                      OPTIONAL MATCH (s)-[r:CONTAINS]->(w)
                      WITH w, count(r) AS times_used
                      RETURN w AS word ORDER BY times_used ASC
                      """)
}
type Word {
  word_id: Int
  times_used: Int @cypher(
        statement: """OPTIONAL MATCH (:Sentence)-[r:CONTAINS]->(this)
                      WITH count(r) AS times_used
                      RETURN times_used
                      """)
  text: String
  alt_text: String
  english: String
  italics: String
  pinyin: String
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
  role: String!
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
  clean_text: String! 
  display_text: String!
  alt_raw_text: String!
  alt_clean_text: String! 
  alt_display_text: String!
  pinyin: String!
  english: String!
  italics: String
  time_fetched: String @cypher(statement: """RETURN toString(time())""")
  current_learners: [Learner]
  level: Level @relation(name: "SHOWN_IN" direction: OUT)
  interval: Interval @relation(name: "AT_INTERVAL" direction: OUT)
	words_contained: [ContainedWord!]!
	word_taught: Word! @relation(name: "TEACHES", direction: OUT)
}

type Learner @relation(name:"LEARNING") {
  from: User
  to: Sentence
  CURRENT_TIME_INTERVAL: Int!
  STEP_AT_INTERVAL: Int!
}

type ContainedWord @relation(name:"CONTAINS") {
  from: Sentence
  to: Word
  contains_order: Int!
}
`

const schema = makeAugmentedSchema({
  typeDefs,
  resolvers,
  directiveResolvers
});

// Allow cross-origin


var corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true // <-- REQUIRED backend setting
};

app.use(cors(corsOptions));

app.use(cookieParser())

app.use((req, res, next) =>{

  const refreshToken = req.cookies["refresh-token"];
  const accessToken = req.cookies["access-token"];
  //no token
  if (!refreshToken && !accessToken) {
    return next();
  }

  if(accessToken){
    const user = jwt.verify(accessToken, ACCESS_SECRET)
    req.userId = user.userId
    return next()
  }

  let refreshUserData;

  try {
    refreshUserData = jwt.verify(refreshToken, REFRESH_SECRET);
  } catch {
    //no access token, and refresh token error
    return next();
  }

  //no access token, but there is a refresh token
  res.cookie("refresh-token", jwt.sign({ userId: refreshUserData.userId, role: refreshUserData.role }, REFRESH_SECRET), { maxAge:  10 * 24 * 60 * 60 * 1000 })
  res.cookie("access-token", jwt.sign({ userId: refreshUserData.userId, role: refreshUserData.role }, ACCESS_SECRET), { maxAge: 15 * 60 * 1000 })
  req.userId = refreshUserData.userId;
  next();
})


app.use(express.static('public'))

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});



const server = new ApolloServer({
  schema: schema,
  context: ({ req }) => {
    return {
      driver,
      req
    };
  }
});


server.applyMiddleware({ app });

const port = process.env.PORT || 3003;

app.listen({ port: port }, () =>
  console.log(`GraphQL API ready at http://localhost:${port}`)
);
