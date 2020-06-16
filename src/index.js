const { makeAugmentedSchema } = require("neo4j-graphql-js");
const { ApolloServer }  = require("apollo-server");
const neo4j = require('neo4j-driver')


const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j','password')
);

const typeDefs = `
type Word {
  text: String!
}
type User {
	name: String!
}
type Sentence {
	text: String!,
	words: [Word!]! @relation(name: "CONTAINS", direction: OUT)
}
`

const schema = makeAugmentedSchema({
  typeDefs
});

const server = new ApolloServer({
  schema: schema,
  context: { driver }
});

server.listen(3003, '0.0.0.0').then(({ url }) => {
  console.log(`GraphQL API ready at ${url}`);
});