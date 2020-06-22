const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('./utils')
const { neo4jgraphql } = require("neo4j-graphql-js")


async function hashPassword(unhashedPassword) {
  const hashedPassword = await bcrypt.hash(unhashedPassword, 10)
  return hashedPassword
  //const user = await context.prisma.createUser({ ...args, password })
}

const resolvers = {
  // entry point to GraphQL service
  Mutation: {
    CreateUser(object, params, ctx, resolveInfo) {
      console.log(params)
      /*params.password = hashPassword(params.password)
      console.log(params)
      const user = neo4jgraphql(object, params, ctx, resolveInfo);
      const token = jwt.sign({ userId: user.id }, APP_SECRET)
      return user*/
    }
  }
};




module.exports = {
  resolvers.Mutation
}

/*
//put this function in User mutation resolver
async function signup(parent, args, context) {
  const password = await bcrypt.hash(args.password, 10)
  //const user = await context.prisma.createUser({ ...args, password })

  const token = jwt.sign({ userId: user.id }, APP_SECRET)

  return {
    token,
    user,
  }
}
//put this function in User query resolver
async function login(parent, args, context) {
  //const user = await context.prisma.user({ email: args.email })
  if (!user) {
    throw new Error('No such user found')
  }

  const valid = await bcrypt.compare(args.password, user.password)
  if (!valid) {
    throw new Error('Invalid password')
  }

  return {
    token: jwt.sign({ userId: user.id }, APP_SECRET),
    user,
  }
}



module.exports = {
  signup,
  login
}*/