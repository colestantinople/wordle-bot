import json

directory = "json-data/wordle/"
inFile = open(directory + "extract.txt", "rt")
outFile = open(directory + "words.json", "wt")

words = []

for line in inFile:
    word = line.split()[2]
    if (len(word) != 5): continue
    if (word == 'FALSE'): continue

    words.append(word)

# words.sort()

outFile.write(json.dumps(words))

# outFile.write("{ words: [")

# for w in words:
#     outFile.write("\"" + w + "\",\n")

# outFile.write("] }")

inFile.close()
outFile.close()
