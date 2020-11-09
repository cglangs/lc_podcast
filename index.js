//const { neo4jgraphql, makeAugmentedSchema } = require("neo4j-graphql-js");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { ACCESS_SECRET, REFRESH_SECRET, getUserId } = require('./utils')
const { ApolloServer, gql, SchemaDirectiveVisitor } = require('apollo-server-express');
//const neo4j = require('neo4j-driver')
const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser')

const models = require('./models/init-models')


//var dbURL = process.env.BOLT_URL || 'bolt://54.162.39.62:7687'
//var dbUser = process.env.BOLT_USER || 'neo4j'
//var dbPass = process.env.BOLT_PASSWORD || 'cl0zep0dcast4$'
//var driver


/*driver = neo4j.driver(
  dbURL,
  neo4j.auth.basic(dbUser, dbPass)
)*/

async function signup(object, params, ctx, resolveInfo) {
  params.password = await bcrypt.hash(params.password, 10)
  try {
      //const user = await neo4jgraphql(object, params, ctx, resolveInfo)
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
  //const user = await neo4jgraphql(object, params, ctx, resolveInfo)
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

/*async function processSentence (object, params, ctx, resolveInfo){
  //var sentence = await neo4jgraphql(object, params, ctx, resolveInfo)
  if(sentence){
      sentence.current_learners = sentence.current_learners.filter((learner)=> learner.User._id === params.userId)
  }

  return sentence
}*/

const resolvers = {
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
    }
  },
  Query: {
     getNextSentence(object, params, ctx, resolveInfo){
        params.userId = ctx.req.userId
        //const sentence =processSentence(object, params, ctx, resolveInfo)
        return sentence
    },
     getCurrentProgress(object, params, ctx, resolveInfo){
        params.userId = ctx.req.userId
        //const progress = neo4jgraphql(object, params, ctx, resolveInfo)
        return progress
    },
    me(object, params, ctx, resolveInfo){
        params.userId = ctx.req.userId
        //const user = neo4jgraphql(object, params, ctx, resolveInfo)
        return user
    },

  }
}
/*const directiveResolvers = {
  hasToken(next,src,args,ctx) {
      if (typeof ctx.req.userId === 'undefined' || ctx.req.userId === null) {
        return null
      } else{
        return next()
      }
  }
}*/


/*const schema = makeAugmentedSchema({
  typeDefs,
  resolvers
});*/

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
  typeDefs: schema,
  resolvers,
  context: ({ req }) => {
    return {
      models,
      req
    };
  }
});


server.applyMiddleware({ app });

const port = process.env.PORT || 3003;

app.listen({ port: port }, () =>
  console.log(`GraphQL API ready at http://localhost:${port}`)
);
