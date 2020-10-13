From neo4j:4.1

ENV NEO4J_AUTH=neo4j/password

WORKDIR /Users/corygallagher/Library/Application\ Support/Neo4j\ Desktop/Application/neo4jDatabases/database-8eb4f4c5-8d0d-4ed8-a8a8-820f73b88051/installation-4.1.1/bin/

VOLUME ["${HOME}/neo4j/data:/data"]

EXPOSE 7474 7687

RUN neo4j start

