from neo4j import GraphDatabase
import csv

driver = GraphDatabase.driver("bolt://localhost:11003", auth=("neo4j", "password"))


def print_sentence():
    with driver.session() as session:
    	with open('interval3.csv') as csvfile:
    		readCSV = csv.reader(csvfile, delimiter=',')
    		for row in readCSV:
    			exampleSentence = session.write_transaction(_create_and_return_greeting, characters=row[0])
    			print(exampleSentence)


def _create_and_return_greeting(tx, characters):
        result = tx.run("CREATE (s:Sentence) "
                        "SET s.raw_text = $characters "
                        "RETURN s.raw_text", characters=characters)
        return result.single()[0]




print_sentence()




