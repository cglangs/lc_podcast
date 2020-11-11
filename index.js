//const { neo4jgraphql, makeAugmentedSchema } = require("neo4j-graphql-js");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { ACCESS_SECRET, REFRESH_SECRET, getUserId } = require('./utils')
const { ApolloServer, gql, SchemaDirectiveVisitor } = require('apollo-server-express');
const Sequelize = require('sequelize')
//const neo4j = require('neo4j-driver')
const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser')
const schema = require('./schema')
const {initModels} = require('./models/init-models')


const sequelize = new Sequelize(
  'postgres',
  'postgres',
  'pass',
  {
    dialect: 'postgres',
  },
);

const models = initModels(sequelize)


async function signup(object, params, ctx, resolveInfo) {
  params.password = await bcrypt.hash(params.password, 10)
  try {
      const user = await ctx.models.users.create({ user_name: params.user_name, user_email: params.email, user_password: params.password, user_role: params.role})
      if(user.user_role === 'TESTER'){
        // do nothing
      } else{
        ctx.req.res.cookie("refresh-token", jwt.sign({ userId: user.user_id, role: user.user_role }, REFRESH_SECRET), { maxAge: 24 * 60 * 60 * 1000})
      }
      ctx.req.res.cookie("access-token", jwt.sign({ userId: user.user_id, role: user.user_role }, ACCESS_SECRET), { maxAge: 15 * 60 * 1000 })
      return user
  }
  catch(error){
    throw new Error("Email address already in use")
  }

}

async function upgrade(object, params, ctx, resolveInfo) {
  try {
      //const user = await ctx.models.users.create({ user_name: params.user_name, user_email: params.email, user_password: params.password, user_role: params.role})
      ctx.req.res.cookie("refresh-token", jwt.sign({ userId: user.user__id, role: user.user_role }, REFRESH_SECRET), { maxAge: 24 * 60 * 60 * 1000})
      ctx.req.res.cookie("access-token", jwt.sign({ userId: user.user_id, role: user.user_role }, ACCESS_SECRET), { maxAge: 15 * 60 * 1000 })
      return user
  }
  catch(error){
    throw new Error("Email address already in use")
  }
}

async function login(object, params, ctx, resolveInfo) {
  const password = params.password
  delete params.password

  const users = await ctx.models.users.findAll({
  where: {
    user_email: params.email
  }
  })
  const user = users[0]

  if (!user) {
    throw new Error('No such user found')
  }
  const valid = await bcrypt.compare(password, user.user_password)
  if (!valid) {
    throw new Error('Invalid password')
  }
  user.password = null

  ctx.req.res.cookie("refresh-token", jwt.sign({ userId: user.user_id, role: user.user_role }, REFRESH_SECRET), { maxAge: 7 * 60 * 60 * 1000 })
  ctx.req.res.cookie("access-token", jwt.sign({ userId: user.user_id, role: user.user_role }, ACCESS_SECRET), { maxAge: 15 * 60 * 1000 })
  return user
}

async function makeAttempt(object, params, ctx, resolveInfo) {
  try {
    await ctx.models.user_progress.upsert({ user_id: params.user_id, word_id: params.word_id, interval_id: params.interval_id, is_learned: params.interval_id === 11})
  }
  catch(error){
    throw new Error('Unable to make attempt')
  }

  return params.user_id
}

async function getMe(object, params, ctx, resolveInfo) {
  const users = await ctx.models.users.findAll({
  where: {
    user_id: params.user_id
  }
  })
  const user = users[0]

  if (!user) {
    throw new Error('Error')
  }
  return user
}


async function getSentence (object, params, ctx, resolveInfo){
  const sentence = await sequelize.query(
    `SELECT * 
    FROM cloze_chinese.phrases p
    LEFT JOIN cloze_chinese.phrase_teaches_words ptw 
    ON p.phrase_id = ptw.phrase_id
    LEFT JOIN cloze_chinese.user_progress up
    ON ptw.word_id = up.word_id
    WHERE is_sentence
    AND up.word_id is null
    ORDER BY sentence_order ASC LIMIT 1`)
  return sentence[0][0]
}

async function currentProgress (object, params, ctx, resolveInfo){
  const progress = await sequelize.query(
    `select 
    sum(CASE WHEN is_learned THEN 1 END) as words_learned, 
    sum(interval_id - 1) as intervals_completed,
    (select count(word_id) from words) as total_words
    from cloze_chinese.user_progress
    where user_id = ?`,
    {
    replacements: params.user_id,
    type: QueryTypes.SELECT
    })
  return progress[0][0]
}

const resolvers = {
  Mutation: {
    CreateUser(object, params, ctx, resolveInfo) {
      return signup(object, params, ctx, resolveInfo)   
    },
    UpgradeUser(object, params, ctx, resolveInfo) {
      return upgrade(object, params, ctx, resolveInfo)   
    },
    Login(object, params, ctx, resolveInfo) {
     return login(object, params, ctx, resolveInfo)   
    },
    makeClozeAttempt(object, params, ctx, resolveInfo) {
       params.user_id = ctx.req.userId
      return makeAttempt(object, params, ctx, resolveInfo)    
    }

  },
  Query: {
     getNextSentence(object, params, ctx, resolveInfo){
        params.user_id = ctx.req.userId
        const sentence = getSentence(object, params, ctx, resolveInfo)
        return sentence
    },
     /*getCurrentProgress(object, params, ctx, resolveInfo){
        params.userId = ctx.req.userId
        //const progress = neo4jgraphql(object, params, ctx, resolveInfo)
        return progress
    },*/
    me(object, params, ctx, resolveInfo){
        params.user_id = ctx.req.userId
        var user
        if(ctx.req.userId){
          params.user_id = ctx.req.userId
          getMe(object, params, ctx, resolveInfo)
        }
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
  introspection: true,
  playground: true,
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
