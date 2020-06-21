const { makeAugmentedSchema } = require("neo4j-graphql-js");
const { ApolloServer }  = require("apollo-server");
const neo4j = require('neo4j-driver')


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
	name: String!
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
  typeDefs
});

const server = new ApolloServer({
  schema: schema,
  context: { driver }
});

server.listen(3003, '0.0.0.0').then(({ url }) => {
  console.log(`GraphQL API ready at ${url}`);
});