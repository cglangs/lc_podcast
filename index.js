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
var dbPass = process.env.BOLT_PASSWORD || 'cl0zep0dcast4$'
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
}

type Query {
   

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
