import pinyin
import csv

	
with open('first_30_episodes.tsv') as csvfile:
	readCSV = csv.reader(csvfile, delimiter='\t')
	rows = list(readCSV)
	with open('podcast_sentences_with_pinyin.tsv', 'wt') as outfile:
		tsv_writer = csv.writer(outfile, delimiter='\t')
		for sentence in rows:
			print(sentence[0] + "\t" + pinyin.get(sentence[0]))
			tsv_writer.writerow([sentence[0],pinyin.get(sentence[0])])
		outfile.close()
