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
const {types, fields} = require('./global_strings')


const sequelize = new Sequelize(
  'postgres',
  'postgres',
  'pass',
  {
    host: '34.238.246.9',
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
    const result = await ctx.models.users.update({ user_role: 'STUDENT'},
      { where: { user_id: params.user_id },
        returning: true,
        plain: true })
    const user = result[1]
    ctx.req.res.cookie("refresh-token", jwt.sign({ userId: user.user_id, role: user.user_role }, REFRESH_SECRET), { maxAge: 24 * 60 * 60 * 1000})
    ctx.req.res.cookie("access-token", jwt.sign({ userId: user.user_id, role: user.user_role }, ACCESS_SECRET), { maxAge: 15 * 60 * 1000 })
  }
  catch(error){
    console.log(error)
    throw new Error("Email address already in use")
  }
}

async function login(object, params, ctx, resolveInfo) {
  const password = params.password
  delete params.password

  const user = await ctx.models.users.findOne({
  where: {
    user_email: params.email
  }
  })

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
    await ctx.models.user_progress.upsert({ user_id: params.user_id, word_id: params.word_id, interval_id: params.interval_id})
  }
  catch(error){
    throw new Error('Unable to make attempt')
  }

  return params.user_id
}

async function getMe(object, params, ctx, resolveInfo) {
  const user = await ctx.models.users.findOne({
  where: {
    user_id: params.user_id
  }
  })

  if (!user) {
    throw new Error('Error')
  }

  return user
}


async function getSentence (object, params, ctx, resolveInfo){
  const sentence = await sequelize.query(
    `WITH RECURSIVE 
    all_valid_phrases AS (
    SELECT p.*
    FROM cloze_chinese.phrases p
    WHERE p.is_sentence = FALSE
    OR (p.is_sentence = TRUE
    AND NOT EXISTS
      (
          SELECT  1
          FROM 
          cloze_chinese.phrase_contains_words pcw
          INNER JOIN cloze_chinese.words w
          ON pcw.word_id = w.word_id
          LEFT JOIN cloze_chinese.user_progress up
          ON pcw.word_id = up.word_id
          AND up.user_id =  :userId
          WHERE pcw.phrase_id = p.phrase_id
          AND pcw.teaches = FALSE
          AND (up.word_id IS NULL OR up.interval_id <= 2)
          AND w.is_base_word = FALSE
      )
      )
    ),

  all_seen_phrases AS (
    SELECT p.*, 
    w.word_id AS "${types.word_taught}${fields.word_id}",
    w.word_text AS "${types.word_taught}${fields.word_text}",
    w.english AS "${types.word_taught}${fields.english}",
    w.pinyin AS "${types.word_taught}${fields.pinyin}",
    COALESCE(up.interval_id,1) AS "${types.word_taught}${fields.interval_id}",
    TO_CHAR(NOW(), 'yyyy-mm-dd hh-mm-ss.ms') AS time_fetched,
    CASE 
      WHEN EXTRACT(EPOCH FROM (NOW() - up.last_seen)) > i.seconds THEN 1
    ELSE 4
    END AS rank
    FROM all_valid_phrases p
    INNER JOIN cloze_chinese.phrase_teaches_words ptw
    ON p.phrase_id = ptw.phrase_id
    INNER JOIN cloze_chinese.words w
    ON ptw.word_id = w.word_id
    INNER JOIN cloze_chinese.user_progress up
    ON w.word_id = up.word_id
    AND up.is_learned = FALSE
    INNER JOIN cloze_chinese.intervals i
    ON up.interval_id = i.interval_id
    AND up.user_id = :userId
    ORDER BY i.interval_id ASC, EXTRACT(EPOCH FROM (NOW() - up.last_seen)) DESC, p.iteration DESC
    LIMIT 1
),

  unseen_full_phrases AS (
    SELECT p.*,
    w.word_id AS "${types.word_taught}${fields.word_id}",
    w.word_text AS "${types.word_taught}${fields.word_text}",
    w.english AS "${types.word_taught}${fields.english}",
    w.pinyin AS "${types.word_taught}${fields.pinyin}",
    COALESCE(up_teaches.interval_id,1) AS "${types.word_taught}${fields.interval_id}",
    TO_CHAR(NOW(), 'yyyy-mm-dd hh-mm-ss.ms') AS time_fetched,
    2 AS rank
    FROM all_valid_phrases p
    INNER JOIN cloze_chinese.phrase_teaches_words ptw
    ON p.phrase_id = ptw.phrase_id
    INNER JOIN cloze_chinese.words w
    ON ptw.word_id = w.word_id
    LEFT JOIN cloze_chinese.user_progress up_teaches
    ON ptw.word_id = up_teaches.word_id
    AND up_teaches.user_id = :userId
    WHERE up_teaches.word_id IS NULL
    AND p.is_sentence = TRUE
    ORDER BY p.iteration DESC
    LIMIT 1
),

  unseen_words AS (
    SELECT p.*,
    w.word_id AS "${types.word_taught}${fields.word_id}",
    w.word_text AS "${types.word_taught}${fields.word_text}",
    w.english AS "${types.word_taught}${fields.english}",
    w.pinyin AS "${types.word_taught}${fields.pinyin}",
    COALESCE(up_teaches.interval_id,1) AS "${types.word_taught}${fields.interval_id}",
    TO_CHAR(NOW(), 'yyyy-mm-dd hh-mm-ss.ms') AS time_fetched,
    3 AS rank
    FROM cloze_chinese.phrases parent_phrase
    INNER JOIN cloze_chinese.phrase_contains_words pcw 
    ON parent_phrase.phrase_id = pcw.phrase_id
    AND pcw.teaches = FALSE
    inner join cloze_chinese.phrase_teaches_words ptw 
    on pcw.word_id = ptw.word_id
    inner join cloze_chinese.words w
    on ptw.word_id = w.word_id
    inner join cloze_chinese.phrases p
    on ptw.phrase_id = p.phrase_id
    LEFT JOIN cloze_chinese.user_progress up_teaches
    ON ptw.word_id = up_teaches.word_id
    AND up_teaches.user_id = :userId
    WHERE up_teaches.word_id IS NULL
    AND p.is_sentence = false
    ORDER BY parent_phrase.sentence_order ASC, w.word_occurrences DESC
    LIMIT 1
)

    SELECT *
    FROM all_seen_phrases
    UNION ALL 
    SELECT *
    FROM unseen_full_phrases
    WHERE NOT EXISTS( SELECT phrase_id FROM all_seen_phrases WHERE rank = 1)
    UNION ALL
    SELECT *
    FROM unseen_words
    WHERE NOT EXISTS( SELECT phrase_id FROM unseen_full_phrases)
    order by rank ASC
    LIMIT 1`,
    {
    replacements: { userId:  params.user_id},
    model: ctx.models.phrases,
    mapToModel: true,
    raw: true,
    nest: true,
    type: sequelize.QueryTypes.SELECT })

  return sentence[0]
}

async function changeWordTranslation(object, params, ctx, resolveInfo){
  const result = await ctx.models.words.update({ english: params.english, pinyin: params.pinyin},
      { where: { word_id: params.word_id }})
  return result[0]
}

async function currentProgress (object, params, ctx, resolveInfo){
  const progress = await sequelize.query(
    `select 
    COALESCE(count(word_id),0) as new_words_seen, 
    COALESCE(sum(CASE WHEN is_learned THEN 1 ELSE 0 END),0) as words_learned, 
    COALESCE(sum(interval_id - 1),0) as intervals_completed,
    (select count(word_id) from cloze_chinese.words WHERE is_base_word = FALSE) as total_word_count
    from cloze_chinese.user_progress
    where user_id = ?`,
    {
    replacements: [params.user_id],
    raw: true,
    type: sequelize.QueryTypes.SELECT
    })
  return progress[0]
}

const resolvers = {
  Mutation: {
    CreateUser(object, params, ctx, resolveInfo) {
      return signup(object, params, ctx, resolveInfo)   
    },
    UpgradeUser(object, params, ctx, resolveInfo) {
      params.user_id = ctx.req.userId
      return upgrade(object, params, ctx, resolveInfo)   
    },
    Login(object, params, ctx, resolveInfo) {
     return login(object, params, ctx, resolveInfo)   
    },
    makeClozeAttempt(object, params, ctx, resolveInfo) {
       params.user_id = ctx.req.userId
      return makeAttempt(object, params, ctx, resolveInfo)    
    },
      EditWord(object, params, ctx, resolveInfo) {
      return changeWordTranslation(object, params, ctx, resolveInfo)    
    }

  },
  Query: {
     getNextSentence(object, params, ctx, resolveInfo){
        params.user_id = ctx.req.userId
        const sentence = getSentence(object, params, ctx, resolveInfo)
        return sentence
    },
     getCurrentProgress(object, params, ctx, resolveInfo){
        params.user_id = ctx.req.userId
        const progress = currentProgress(object, params, ctx, resolveInfo)
        return progress
    },
    me(object, params, ctx, resolveInfo){
        var user
        if(ctx.req.userId){
            params.user_id = ctx.req.userId
            user = getMe(object, params, ctx, resolveInfo)
        }

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
  directiveResolvers,
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
